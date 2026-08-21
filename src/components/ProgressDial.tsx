interface ProgressDialProps {
  value: number;
  size?: number;
  /** Texto lido por leitores de tela, ex.: "Progresso do projeto Treino". */
  label: string;
  /** Fio de progresso; `signal` marca projetos que ainda não saíram do zero. */
  tone?: 'flow' | 'signal';
}

/**
 * O mostrador. É o elemento assinatura do produto e aparece em três lugares:
 * resumo do painel, linha de projeto e cabeçalho do projeto — sempre lendo a
 * mesma coisa (percentual de tarefas concluídas), nunca como enfeite.
 *
 * Detalhes que importam:
 * · as marcações só são desenhadas acima de 44px, abaixo disso viram ruído;
 * · o número fica em mono tabular, então não "dança" ao ir de 9% para 10%;
 * · o SVG é `role="img"` com rótulo — quem usa leitor de tela ouve o valor,
 *   e a leitura visual central fica `aria-hidden` para não duplicar.
 */
export default function ProgressDial({ value, size = 52, label, tone = 'flow' }: ProgressDialProps) {
  const percent = Math.max(0, Math.min(100, Math.round(value)));
  const showTicks = size >= 44;
  const stroke = size >= 60 ? 4.5 : 4;
  const inset = showTicks ? stroke / 2 + 5 : stroke / 2 + 1;
  const radius = size / 2 - inset;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const color = tone === 'signal' ? 'var(--c-signal)' : 'var(--c-flow)';

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label}: ${percent}%`}>
        {showTicks &&
          Array.from({ length: 20 }).map((_, i) => {
            const rad = ((i / 20) * 360 - 90) * (Math.PI / 180);
            const major = i % 5 === 0;
            const r1 = radius + stroke / 2 + 2;
            const r2 = r1 + (major ? 3 : 1.6);
            return (
              <line
                key={i}
                x1={center + r1 * Math.cos(rad)}
                y1={center + r1 * Math.sin(rad)}
                x2={center + r2 * Math.cos(rad)}
                y2={center + r2 * Math.sin(rad)}
                stroke="var(--c-edge)"
                strokeWidth={major ? 1.4 : 1}
                strokeLinecap="round"
              />
            );
          })}

        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--c-raised)" strokeWidth={stroke} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (percent / 100) * circumference}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: 'stroke-dashoffset 480ms var(--ease-out)' }}
        />
      </svg>

      <span
        aria-hidden="true"
        className="absolute inset-0 grid place-content-center font-mono font-medium text-fg"
        style={{ fontSize: size >= 60 ? 13 : size >= 46 ? 11.5 : 10 }}
      >
        <span className="flex items-baseline leading-none">
          {percent}
          {size >= 46 && (
            <span className="text-fg-soft ml-px" style={{ fontSize: '0.74em' }}>
              %
            </span>
          )}
        </span>
      </span>
    </div>
  );
}
