import React from 'react';
import { Box, Typography } from '@mui/material';

const MetricWidget = ({ metric }) => {
  if (!metric || !metric.balance) return null;

  const { metricName, balance } = metric;
  const beginning = parseFloat(balance.beginningBalance || 0);
  const ending = parseFloat(balance.endingBalance || 0);
  const activity = parseFloat(balance.activity || 0);

  const diff = ending - beginning;
  const percentageChange = beginning !== 0 ? (diff / beginning) * 100 : 100;

  const diffLabel = activity >= 0 ? '+' : '-';
  const diffValue = `${Math.abs(activity / 1000).toFixed(0)}K`;
  const percentLabel = `${diffLabel}${Math.abs(percentageChange).toFixed(0)}%`;

  return (
    <Box
      sx={{
        p: 1,
        minWidth: 160,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        
      }}
    >
      <Typography variant="h8" fontWeight="medium" sx={{color: '#2f3a53',}}>
        {metricName}
      </Typography>

      <Typography variant="h4" fontWeight={600} sx={{color: '#2f3a53',}}>
        {parseFloat(balance.endingBalance).toLocaleString()}
      </Typography>

<Typography
  variant="body2"
  sx={{
    mt: 0.5,
    display: 'flex',
    justifyContent: 'center',
    gap: 2,
    textAlign: 'center',

  }}
  color={activity >= 0 ? 'success.main' : 'error.main'}
>
  <span>{percentLabel}</span>
  <span>{diffLabel} {diffValue} this month</span>
</Typography>

    </Box>
  );
};

export default MetricWidget;
