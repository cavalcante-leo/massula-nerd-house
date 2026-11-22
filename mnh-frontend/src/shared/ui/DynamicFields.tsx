import { Plus, Trash2 } from 'lucide-react';

export interface CampoConfig {
  nome: string;
  tipo: 'texto' | 'numero' | 'booleano';
}

interface Props {
  value: CampoConfig[];
  onChange: (value: CampoConfig[]) => void;
}

export function DynamicFields({ value, onChange }: Props) {
  const update = (index: number, patch: Partial<CampoConfig>) => {
    onChange(value.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  const remove = (index: number) => onChange(value.filter((_, i) => i !== index));

  const add = () => onChange([...value, { nome: '', tipo: 'texto' }]);

  return (
    <div>
      {value.length === 0 && (
        <p className="tag" style={{ marginBottom: 10 }}>
          Nenhum campo de estatística ainda. Adicione o primeiro.
        </p>
      )}

      {value.map((campo, i) => (
        <div className="dyn-row" key={i}>
          <input
            placeholder="Nome do campo"
            value={campo.nome}
            onChange={(e) => update(i, { nome: e.target.value })}
          />
          <select
            value={campo.tipo}
            onChange={(e) => update(i, { tipo: e.target.value as CampoConfig['tipo'] })}
          >
            <option value="texto">texto</option>
            <option value="numero">numero</option>
            <option value="booleano">sim/não</option>
          </select>
          <button type="button" className="remove" onClick={() => remove(i)} aria-label="Remover">
            <Trash2 size={15} />
          </button>
        </div>
      ))}

      <button type="button" className="btn btn-ghost btn-sm" onClick={add}>
        <Plus size={14} /> Adicionar campo
      </button>

      <div className="json-preview">
        {JSON.stringify(value, null, 2)}
      </div>
    </div>
  );
}
