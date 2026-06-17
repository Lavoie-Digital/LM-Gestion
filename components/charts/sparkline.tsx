type Props = {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
};

/** Compact static trend line. Inherits currentColor. */
export function Sparkline({ data, width = 120, height = 32, className }: Props) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = 3;
  const n = data.length;
  const x = (i: number) => (i / (n - 1)) * (width - pad * 2) + pad;
  const y = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2);
  const path = data.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      aria-hidden
      fill="none"
    >
      <path d={path} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(n - 1)} cy={y(data[n - 1])} r="2" fill="currentColor" />
    </svg>
  );
}
