'use client';

interface Props {
  nota: number;          // valor actual (0-5)
  max?: number;
  tamanho?: string;
  interativo?: boolean;
  onChange?: (n: number) => void;
}

export default function Estrelas({ nota, max = 5, tamanho = 'text-xl', interativo = false, onChange }: Props) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map((i) => (
        <button
          key={i}
          type="button"
          disabled={!interativo}
          onClick={() => onChange?.(i)}
          className={`${tamanho} transition-transform ${interativo ? 'cursor-pointer hover:scale-125' : 'cursor-default'}`}
          aria-label={`${i} estrela${i > 1 ? 's' : ''}`}
        >
          <span className={i <= nota ? 'text-[#e9b94e]' : 'text-slate-200'}>★</span>
        </button>
      ))}
    </div>
  );
}
