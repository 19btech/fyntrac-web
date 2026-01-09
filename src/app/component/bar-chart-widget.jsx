import * as React from 'react';
import { BarChart } from '@mui/x-charts/BarChart';

export default function BarChartWidget({
  dataset = [],
  series = [],
  xAxis, // 1. Add this prop here so it can be read
  xAxisKey = 'accountingPeriodId',
  chartSetting = {},
}) {
  if (!dataset || dataset.length === 0) {
    return null;
  }

  return (
    <BarChart
      dataset={dataset}
      // 2. Use the passed 'xAxis' if it exists; otherwise fall back to the default
      xAxis={xAxis || [
        { 
          scaleType: 'band', 
          dataKey: xAxisKey 
        }
      ]}
      series={series}
      {...{ width: '1550', height: 350, ...chartSetting }}
    />
  );
}