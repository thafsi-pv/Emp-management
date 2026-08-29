import React from 'react';

interface DonutChartData {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  size?: number;
  holeSize?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({ data, size = 180, holeSize = 120 }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = size / 2;
  const strokeWidth = (size - holeSize) / 2;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  let accumulatedAngle = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
      <svg height={size} width={size} style={{ transform: 'rotate(-90deg)' }}>
        {data.map((item, index) => {
          if (total === 0) return null;
          const percentage = item.value / total;
          const strokeDashoffset = circumference - percentage * circumference;
          const rotation = (accumulatedAngle / total) * 360;
          accumulatedAngle += item.value;

          return (
            <circle
              key={index}
              stroke={item.color}
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference + ' ' + circumference}
              style={{
                strokeDashoffset,
                transform: `rotate(${rotation}deg)`,
                transformOrigin: '50% 50%',
                transition: 'stroke-dashoffset 0.8s ease-in-out',
              }}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
          );
        })}
        {/* Center Text */}
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="var(--text-primary)"
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: '18px',
            transform: 'rotate(90deg)',
            transformOrigin: '50% 50%',
          }}
        >
          {total} Total
        </text>
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.map((item, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: item.color }} />
            <span style={{ color: 'var(--text-secondary)' }}>{item.label}:</span>
            <strong style={{ color: 'var(--text-primary)' }}>{item.value} ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)</strong>
          </div>
        ))}
      </div>
    </div>
  );
};

interface BarChartData {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarChartData[];
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({ data, height = 200 }) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height, gap: '16px', padding: '10px 0' }}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (height - 40);
          return (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px' }}>
              {/* Bar Value Tooltip */}
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-secondary)' }}>
                {item.value}
              </span>
              
              {/* The Bar */}
              <div
                style={{
                  height: `${barHeight}px`,
                  width: '100%',
                  minWidth: '24px',
                  maxWidth: '40px',
                  background: 'var(--accent-gradient)',
                  borderRadius: '6px 6px 0 0',
                  boxShadow: '0 4px 10px rgba(99, 102, 241, 0.2)',
                  transition: 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />

              {/* Label */}
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  width: '100%',
                  textAlign: 'center',
                }}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
