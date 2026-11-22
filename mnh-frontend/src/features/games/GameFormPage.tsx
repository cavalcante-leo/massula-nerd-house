import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { Spinner } from '@/shared/ui';
import { DynamicFields } from '@/shared/ui/DynamicFields';
import { useGame, useSaveGame } from './useGames';

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório.'),
  descricao: z.string().optional(),
  config_campos: z.array(
    z.object({
      nome: z.string().min(1, 'Cada campo precisa de um nome.'),
      tipo: z.enum(['texto', 'numero', 'booleano']),
    })
  ),
});

type FormData = z.infer<typeof schema>;

export function GameFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: jogo, isLoading } = useGame(isEdit ? id : undefined);
  const save = useSaveGame();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', descricao: '', config_campos: [] },
  });

  const campos = watch('config_campos');

  useEffect(() => {
    if (isEdit && jogo) {
      reset({
        nome: jogo.nome,
        descricao: jogo.descricao ?? '',
        config_campos: jogo.config_campos ?? [],
      });
    }
  }, [isEdit, jogo, reset]);

  const submit = (data: FormData) => {
    save.mutate(
      {
        id: isEdit ? id : undefined,
        payload: {
          nome: data.nome.trim(),
          descricao: data.descricao?.trim() || undefined,
          config_campos: data.config_campos,
        },
      },
      { onSuccess: () => navigate('/jogos') }
    );
  };

  if (isEdit && isLoading) return <Spinner />;

  return (
    <>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate('/jogos')}>
        <ArrowLeft size={14} /> Voltar para jogos
      </button>

      <div className="card card-hero form-card-wide">
        <div className="section-title" style={{ margin: 0, marginBottom: 20 }}>
          {isEdit ? 'Editar jogo' : 'Novo jogo'}
        </div>

        <form onSubmit={handleSubmit(submit)}>
          <div className="field">
            <label>Nome *</label>
            <input placeholder="Ex: Catan" {...register('nome')} />
            {errors.nome && <span className="error">{errors.nome.message}</span>}
          </div>
          <div className="field">
            <label>Descrição</label>
            <textarea rows={2} placeholder="Breve descrição do jogo" {...register('descricao')} />
          </div>
          <div className="field">
            <label>Campos de estatística</label>
            <DynamicFields
              value={campos}
              onChange={(value) => setValue('config_campos', value, { shouldValidate: true })}
            />
            {errors.config_campos && (
              <span className="error">Verifique os campos: nome e tipo são obrigatórios.</span>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/jogos')}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={save.isPending}>
              {save.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
