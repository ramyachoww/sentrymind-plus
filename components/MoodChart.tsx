import React from 'react';

export interface MoodDataPoint {
  date: string;
  avgMood: number;
}

interface MoodChartProps {
  data: MoodDataPoint[];
  timeframe: 'week' | 'month' | 'year';
}

const MoodChart: React.FC<MoodChartProps> = ({ data, timeframe }) => {
  const width = 300;
  const height = 150;
  const padding = 20;
  const yAxisLabels = [1, 2, 3, 4, 5];

  if (data.length < 2) {
    return (
      <div style={{ height: `${height}px` }} className="flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
        Not enough data to display trend. Log your mood for a few days to see a chart.
      </div>
    );
  }

  // Y-scale: mood from 1 to 5
  const yScale = (mood: number) => height - padding - ((mood - 1) / 4) * (height - 2 * padding);
  
  // X-scale: time
  const firstDate = new Date(data[0].date).getTime();
  const lastDate = new Date(data[data.length - 1].date).getTime();
  const dateRange = lastDate - firstDate;

  const xScale = (date: string) => {
    if (dateRange === 0) return padding;
    const currentDate = new Date(date).getTime();
    return padding + ((currentDate - firstDate) / dateRange) * (width - 2 * padding);
  };
  
  const points = data.map(d => `${xScale(d.date)},${yScale(d.avgMood)}`).join(' ');
  
  const getXAxisLabels = () => {
    if (data.length === 0) return [];
    const first = new Date(data[0].date);
    const last = new Date(data[data.length - 1].date);
    
    const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const labels = [{ x: xScale(data[0].date), label: formatDate(first) }];
    if (data.length > 1) {
        labels.push({ x: xScale(data[data.length - 1].date), label: formatDate(last) });
    }
    return labels;
  };

  const xAxisLabels = getXAxisLabels();

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} aria-label={`Mood trend chart for the last ${timeframe}.`}>
        {/* Y-Axis Grid Lines and Labels */}
        {yAxisLabels.map(label => (
          <g key={label} className="text-gray-400">
            <line
              x1={padding}
              y1={yScale(label)}
              x2={width - padding}
              y2={yScale(label)}
              stroke="currentColor"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
            <text x={padding - 10} y={yScale(label)} dy="0.3em" textAnchor="end" className="text-[8px] fill-current">
              {label}
            </text>
          </g>
        ))}

        {/* X-Axis Labels */}
         {xAxisLabels.map(({ x, label }) => (
            <text key={label} x={x} y={height - padding + 12} textAnchor="middle" className="text-[8px] fill-current text-gray-500">
                {label}
            </text>
        ))}

        {/* Line */}
        <polyline
          fill="none"
          stroke="#588157"
          strokeWidth="2"
          points={points}
        />
        
        {/* Points */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={xScale(d.date)}
            cy={yScale(d.avgMood)}
            r="3"
            fill="#FDFCFB"
            stroke="#3A5A40"
            strokeWidth="1.5"
          />
        ))}
      </svg>
    </div>
  );
};

export default MoodChart;
