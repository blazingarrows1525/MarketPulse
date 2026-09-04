interface SparklineProps {
  data: number[];
  positive?: boolean;
  width?: number;
  height?: number;
  strokeWidth?: number;
  showArea?: boolean;
}

export default function Sparkline({ data, positive = true, width = 80, height = 32, strokeWidth = 1.5, showArea = true }: SparklineProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;

  const toX = (i: number) => pad + (i / (data.length - 1)) * (width - pad * 2);
  const toY = (v: number) => height - pad - ((v - min) / range) * (height - pad * 2);

  const pts = data.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
  const pathD = `M ${pts.split(" ").join(" L ")}`;
  const areaD = `${pathD} L ${toX(data.length - 1)},${height} L ${toX(0)},${height} Z`;

  const color = positive ? "#10C97A" : "#FF4D6A";
  const areaColor = positive ? "rgba(16,201,122,0.1)" : "rgba(255,77,106,0.1)";

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      {showArea && (
        <path d={areaD} fill={areaColor} />
      )}
      <path d={pathD} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={toX(data.length - 1)}
        cy={toY(data[data.length - 1])}
        r={2.5}
        fill={color}
      />
    </svg>
  );
}
