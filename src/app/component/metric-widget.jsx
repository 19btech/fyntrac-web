import React from 'react';
import { Box, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const formatMetricName = (name) =>
  (name || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

// Eased counter animation
const useAnimatedValue = (target, duration = 900) => {
  const [value, setValue] = React.useState(0);
  React.useEffect(() => {
    let raf;
    const start = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4); // ease-out quart
      setValue(target * eased);
      if (progress < 1) raf = requestAnimationFrame(animate);
      else setValue(target);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
};

const MetricWidget = ({ metric, currencyCode = 'USD' }) => {
  if (!metric || !metric.balance) return null;

  const { metricName, balance } = metric;
  const beginning = parseFloat(balance.beginningBalance || 0);
  const ending = parseFloat(balance.endingBalance || 0);
  const activity = parseFloat(balance.activity || 0);

  const diff = ending - beginning;
  const percentageChange = beginning !== 0 ? (diff / beginning) * 100 : 100;

  const isPositive = activity >= 0;
  const diffSign = isPositive ? '+' : '-';
  const diffValue = `${Math.abs(activity / 1000).toFixed(0)}K`;
  const percentLabel = `${diffSign}${Math.abs(percentageChange).toFixed(0)}%`;

  const accentColor = isPositive ? '#10b981' : '#ef4444';
  const accentBg   = isPositive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)';

  const animatedEnding = useAnimatedValue(ending);

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(animatedEnding);

  return (
    <Box
      sx={{
        px: 2.5,
        py: 2,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        // Left accent stripe — tint colour
        borderLeft: `4px solid ${isPositive ? 'rgba(16,185,129,0.45)' : 'rgba(239,68,68,0.45)'}`,
        // Subtle diagonal gradient tint
        background: 'transparent',
        transition: 'box-shadow 0.22s ease',
        '&:hover': {
          boxShadow: `inset 0 0 0 1px ${accentColor}55`,
        },
      }}
    >
      {/* Label */}
      <Typography
        sx={{
          fontSize: '1rem',
          fontWeight: 700,
          letterSpacing: 'normal',
          color: '#64748b',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {formatMetricName(metricName)}
      </Typography>

      {/* Animated big number */}
      <Typography
        sx={{
          fontSize: '1.85rem',
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: '-0.03em',
          color: '#0f172a',
          fontVariantNumeric: 'tabular-nums',
          my: 1.2,
        }}
      >
        {formatted}
      </Typography>

      {/* Divider + trend row */}
      <Box
        sx={{
          borderTop: '1px solid #f1f5f9',
          pt: 1.2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Icon + percent inline */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            sx={{
              width: 22, height: 22,
              borderRadius: '6px',
              bgcolor: accentBg,
              color: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isPositive
              ? <TrendingUpIcon sx={{ fontSize: '0.85rem' }} />
              : <TrendingDownIcon sx={{ fontSize: '0.85rem' }} />
            }
          </Box>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: accentColor }}>
            {percentLabel}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>
          {diffSign} {diffValue} this month
        </Typography>
      </Box>
    </Box>
  );
};

export default MetricWidget;
