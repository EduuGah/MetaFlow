/**
 * A marca do MetaFlow é o próprio mostrador de progresso do produto,
 * congelado em 72%: o mesmo desenho que aparece em cada projeto do painel.
 * O logotipo não é um enfeite à parte — é a peça de interface mais usada.
 */
export default function BrandMark({ size = 26 }: { size?: number }) {
  const r = 9.4;
  const c = 2 * Math.PI * r;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r={r} stroke="var(--c-edge-strong)" strokeWidth="2.4" />
      <circle
        cx="12"
        cy="12"
        r={r}
        stroke="var(--c-flow)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * 0.28}
        transform="rotate(-90 12 12)"
      />
      <circle cx="12" cy="12" r="2.6" fill="var(--c-signal)" />
    </svg>
  );
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display font-semibold tracking-tight ${className}`}>
      Meta<span className="text-signal">Flow</span>
    </span>
  );
}
