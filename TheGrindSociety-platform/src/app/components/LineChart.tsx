// Lightweight inline-SVG line chart. No deps.

type Point = { x: number; y: number; label?: string };

export default function LineChart({
  points,
  width = 600,
  height = 180,
  color = '#4F46E5',
  fill = 'rgba(79,70,229,0.15)',
  yLabel,
}: {
  points: Point[];
  width?: number;
  height?: number;
  color?: string;
  fill?: string;
  yLabel?: string;
}) {
  if (points.length === 0) {
    return <div className="text-muted text-sm h-[180px] flex items-center justify-center border border-white/5 rounded-lg">No data yet.</div>;
  }

  const padding = { top: 16, right: 12, bottom: 28, left: 36 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const yRange = yMax - yMin || 1;
  const xRange = xMax - xMin || 1;

  const sx = (x: number) => padding.left + ((x - xMin) / xRange) * innerW;
  const sy = (y: number) => padding.top + innerH - ((y - yMin) / yRange) * innerH;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p.x)} ${sy(p.y)}`).join(' ');
  const areaPath = `${linePath} L ${sx(points[points.length - 1].x)} ${padding.top + innerH} L ${sx(points[0].x)} ${padding.top + innerH} Z`;

  // 4 horizontal grid lines
  const gridYs = [0, 0.25, 0.5, 0.75, 1].map((t) => padding.top + innerH * (1 - t));
  const gridLabels = [0, 0.25, 0.5, 0.75, 1].map((t) => yMin + yRange * t);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {gridYs.map((y, i) => (
        <g key={i}>
          <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(255,255,255,0.05)" />
          <text x={6} y={y + 4} fontSize="10" fill="#9CA3AF">{gridLabels[i].toFixed(yRange < 5 ? 1 : 0)}</text>
        </g>
      ))}
      <path d={areaPath} fill={fill} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={2} />
      {points.map((p, i) => (
        <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={3} fill={color}>
          <title>{p.label ?? `${p.x}: ${p.y}`}</title>
        </circle>
      ))}
      {yLabel && <text x={6} y={padding.top - 4} fontSize="10" fill="#9CA3AF">{yLabel}</text>}
    </svg>
  );
}
