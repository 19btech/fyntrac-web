import * as React from 'react';
import { BarChart } from '@mui/x-charts/BarChart';

/**
 * Reusable Bar Chart Widget
 * * @param {{
 * dataset: Array<any>,
 * series: Array<{
 * dataKey: string,
 * label?: string,
 * valueFormatter?: (value: any) => string
 * }>,
 * xAxisKey: string,
 * chartSetting?: object
 * }} props
 */
export default function BarChartWidget({
  dataset = [], // Default to empty array to prevent crash
  series = [],  // Default to empty array
  xAxisKey = 'accountingPeriodId',
  chartSetting = {},
}) {
  // If no data is passed, we can render null or an empty chart container
  if (!dataset || dataset.length === 0) {
    return null; // Or return <div style={{height: 300}}>No Data</div>
  }

  return (
    <BarChart
      dataset={dataset}
      xAxis={[
        { 
          scaleType: 'band', 
          dataKey: xAxisKey 
        }
      ]}
      series={series}
      // Combine default chart settings with any custom settings passed in
      {...{ width: 500, height: 300, ...chartSetting }}
    />
  );
}