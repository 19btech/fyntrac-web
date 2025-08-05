import * as React from 'react';
import { BarChart } from '@mui/x-charts/BarChart';

/**
 * @param {{
 *   dataset: Array<any>,
 *   series: Array<{
 *     dataKey: string,
 *     label?: string,
 *     valueFormatter?: (value: any) => string
 *   }>,
 *   xAxisKey: string,
 *   chartSetting?: object
 * }} props
 */
export default function BarChartWidget({
  dataset = mockDataset,
  series = mockSeries,
  xAxisKey = 'accountingPeriodId',
  chartSetting = defaultChartSetting,
}) {
  return (
    <BarChart
      dataset={dataset}
      xAxis={[{ dataKey: xAxisKey }]} 
      series={series}
      {...chartSetting}
    />
  );
}