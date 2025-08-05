import React from 'react';
import { LineChart } from '@mui/x-charts/LineChart';

export default function LineChartWidget({
  height = 300,
  series,
  xLabels,
  margin = { right: 24 },
}) {
  return (
    <LineChart
      height={height}
      series={series}
      xAxis={[{ scaleType: 'point', data: xLabels }]}
      yAxis={[{ width: 50 }]}
      margin={margin}
    />
  );
}
