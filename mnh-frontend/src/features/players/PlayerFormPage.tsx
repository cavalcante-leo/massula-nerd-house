import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { Spinner } from '@/shared/ui';
import { formatPhoneBR } from '@/shared/lib/format';
import { useCreatePlayer, usePlayer, useUpdatePlayer } from './usePlayers';

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório.'),
  instagram: z.string().optional(),
  telefone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function PlayerFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: jogador, isLoading } = usePlayer(isEdit ? id : undefined);
  const create = useCreatePlayer();
  const update = useUpdatePlayer();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (isEdit && jogador) {
      reset({
        nome: jogador.nome,
        instagram: jogador.instagram ?? '',
        telefone: jogador.telefone ? formatPhoneBR(jogador.telefone) : '',
      });
    }
  }, [isEdit, jogador, reset]);

  const submit = (data: FormData) => {
    const payload = {
      nome: data.nome.trim(),
      instagram: data.instagram?.trim() || undefined,
      telefone: data.telefone?.replace(/\D/g, '') || undefined,
    };
    const onDone = { onSuccess: () => navigate('/jogadores') };
    if (isEdit && id) {
      update.mutate({ id, payload }, onDone);
    } else {
      create.mutate(payload, onDone);
    }
  };

  const pending = create.isPending || update.isPending;

  if (isEdit && isLoading) return <Spinner />;

  return (
    <>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate('/jogadores')}>
        <ArrowLeft size={14} /> Voltar para jogadores
      </button>

      <div className="card card-hero form-card">
        <div className="section-title" style={{ margin: 0, marginBottom: 20 }}>
          {isEdit ? 'Editar jogador' : 'Novo jogador'}
        </div>

        <form onSubmit={handleSubmit(submit)}>
          <div className="field">
            <label>Nome *</label>
            <input placeholder="Nome completo" {...register('nome')} />
            {errors.nome && <span className="error">{errors.nome.message}</span>}
          </div>

          <div className="field">
            <label>Instagram</label>
            <input placeholder="@usuario" {...register('instagram')} />
          </div>

          <div className="field">
            <label>Telefone</label>
            <Controller
              name="telefone"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  placeholder="(31) 90000-0000"
                  inputMode="numeric"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(formatPhoneBR(e.target.value))}
                />
              )}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/jogadores')}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}