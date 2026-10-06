"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Button,
  Card,
  Chip,
  Fade,
  IconButton,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';
import ViewDayOutlinedIcon from '@mui/icons-material/ViewDayOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import CleaningServicesOutlinedIcon from '@mui/icons-material/CleaningServicesOutlined';
import { EmptyState } from './report-catalog';

// The app's icon-button style (e.g. the Diagnostic page's download button).
const ICON_BUTTON_SX = {
  bgcolor: 'white',
  boxShadow: 1,
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': { bgcolor: 'grey.50', boxShadow: 3, transform: 'scale(1.08)' },
  '&:active': { transform: 'scale(0.94)' },
};

// The app's success / error tints (as used by its toasts).
const APP_GREEN = '#16a34a';
const APP_RED = '#dc2626';

const formatSize = (bytes) => {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const relativeTime = (ts, now) => {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 45) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr${h > 1 ? 's' : ''} ago`;
  return new Date(ts).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
};

const dayBucket = (ts) => {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return 'Earlier';
};

const FILTERS = {
  all: () => true,
  done: (j) => j.status === 'done',
  running: (j) => j.status === 'running',
  failed: (j) => j.status === 'failed',
};

// Cards use the theme's Card (hover lift, shadow and tinted border) — the same animation as
// the Diagnostic page's cards.
function Stat({ label, value, index }) {
  return (
    <Fade in timeout={Math.min((index + 1) * 200, 600)}>
      <Card variant="outlined" sx={{ px: 2, py: 1, minWidth: 110 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.66rem' }}>
          {label}
        </Typography>
        <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
      </Card>
    </Fade>
  );
}

function FileBadge({ status }) {
  const theme = useTheme();
  const tone = status === 'failed' ? APP_RED : status === 'running' ? theme.palette.primary.main : APP_GREEN;
  return (
    <Box
      sx={{
        position: 'relative',
        width: 46,
        height: 52,
        flexShrink: 0,
        borderRadius: '8px',
        bgcolor: alpha(tone, 0.08),
        border: `1px solid ${alpha(tone, 0.25)}`,
        display: 'grid',
        placeItems: 'center',
        // folded corner
        '&::after': {
          content: '""',
          position: 'absolute',
          top: -1,
          right: -1,
          width: 12,
          height: 12,
          borderBottomLeftRadius: '4px',
          background: `linear-gradient(225deg, ${theme.palette.background.paper} 50%, ${alpha(tone, 0.3)} 50%)`,
        },
      }}
    >
      <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.06em', color: tone, mt: 1 }}>CSV</Typography>
    </Box>
  );
}

function StatusChip({ job }) {
  if (job.status === 'running') {
    return <Chip size="small" icon={<HourglassTopRoundedIcon />} label={`Exporting · ${Math.round(job.progress * 100)}%`} color="primary" variant="outlined" sx={{ fontWeight: 600, height: 24 }} />;
  }
  if (job.status === 'failed') {
    return (
      <Chip
        size="small"
        icon={<ErrorOutlineRoundedIcon />}
        label="Failed"
        variant="outlined"
        sx={{ fontWeight: 600, height: 24, color: APP_RED, bgcolor: 'rgba(220,38,38,0.10)', borderColor: 'rgba(220,38,38,0.3)', '& .MuiChip-icon': { color: APP_RED } }}
      />
    );
  }
  return (
    <Chip
      size="small"
      icon={<CheckCircleRoundedIcon />}
      label="Ready"
      variant="outlined"
      sx={{ fontWeight: 600, height: 24, color: '#15803d', bgcolor: 'rgba(22,163,74,0.12)', borderColor: 'rgba(22,163,74,0.3)', '& .MuiChip-icon': { color: APP_GREEN } }}
    />
  );
}

function ExportCard({ job, index, now, onDownload, onRemove }) {
  const ScopeIcon = job.kind === 'page' ? ViewDayOutlinedIcon : LayersOutlinedIcon;
  return (
    <Fade in timeout={Math.min((index + 1) * 150, 600)}>
      <Card variant="outlined">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2.5, py: 2 }}>
          <FileBadge status={job.status} />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap', mb: 0.5 }}>
              <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ maxWidth: '100%' }}>{job.reportName || job.name}</Typography>
              <StatusChip job={job} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', color: 'text.secondary' }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                <ScopeIcon sx={{ fontSize: 16 }} />
                <Typography variant="body2">{job.kind === 'page' ? 'Current page' : 'All pages'}</Typography>
              </Box>
              <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {job.rowCount != null ? `${job.rowCount.toLocaleString()} rows` : '— rows'}
              </Typography>
              <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>{formatSize(job.size)}</Typography>
              <Tooltip title={new Date(job.createdAt).toLocaleString()}>
                <Typography variant="body2">{relativeTime(job.createdAt, now)}</Typography>
              </Tooltip>
            </Box>
            {job.status === 'running' && (
              <LinearProgress
                variant={job.progress > 0 ? 'determinate' : 'indeterminate'}
                value={Math.round(job.progress * 100)}
                sx={{ mt: 1.25, height: 6, borderRadius: 3, maxWidth: 520 }}
              />
            )}
            {job.status === 'failed' && (
              <Typography variant="body2" color="error" sx={{ mt: 0.75 }}>{job.error}</Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            {job.status === 'done' && (
              <Tooltip title="Download CSV" arrow>
                <IconButton aria-label={`Download ${job.name}`} onClick={() => onDownload(job.id)} sx={ICON_BUTTON_SX}>
                  <FileDownloadOutlinedIcon color="action" />
                </IconButton>
              </Tooltip>
            )}
            {job.status !== 'running' && (
              <Tooltip title="Delete" arrow>
                <IconButton aria-label={`Delete ${job.name}`} onClick={() => onRemove(job.id)} sx={ICON_BUTTON_SX}>
                  <DeleteOutlineOutlined color="action" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Card>
    </Fade>
  );
}

export default function ExportsPanel({ exports, onDownload, onRemove }) {
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [now, setNow] = useState(() => Date.now());

  // Keep "5 min ago" labels fresh.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const download = async (id) => {
    setError('');
    try {
      await onDownload(id);
    } catch (err) {
      setError(err.message);
    }
  };

  const counts = useMemo(() => ({
    all: exports.length,
    done: exports.filter(FILTERS.done).length,
    running: exports.filter(FILTERS.running).length,
    failed: exports.filter(FILTERS.failed).length,
  }), [exports]);
  const totalSize = exports.reduce((sum, j) => sum + (j.size || 0), 0);
  const visible = exports.filter(FILTERS[filter]);
  const groups = ['Today', 'Yesterday', 'Earlier']
    .map((label) => ({ label, items: visible.filter((j) => dayBucket(j.createdAt) === label) }))
    .filter((g) => g.items.length);

  let index = 0;
  return (
    <Box sx={{ px: 3, py: 2.5, overflow: 'auto', height: '100%' }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Exported</Typography>
      {error && <Typography variant="body2" color="error" sx={{ mb: 2 }}>{error}</Typography>}

      {exports.length === 0 ? (
        <EmptyState icon={FileDownloadOutlinedIcon} title="No exports yet">
          Open a report and choose Download → Current page or All pages. Exports appear here with their status.
        </EmptyState>
      ) : (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 2.5 }}>
            <Stat index={0} label="Files" value={counts.all.toLocaleString()} />
            <Stat index={1} label="Total size" value={formatSize(totalSize)} />
            <Stat index={2} label="In progress" value={counts.running.toLocaleString()} />
            <Box sx={{ flex: 1 }} />
            <ToggleButtonGroup
              exclusive
              size="small"
              value={filter}
              onChange={(_, v) => v && setFilter(v)}
              sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 700, px: 1.5, py: 0.5 } }}
            >
              <ToggleButton value="all">All {counts.all}</ToggleButton>
              <ToggleButton value="done">Ready {counts.done}</ToggleButton>
              <ToggleButton value="running">In progress {counts.running}</ToggleButton>
              <ToggleButton value="failed">Failed {counts.failed}</ToggleButton>
            </ToggleButtonGroup>
            <Tooltip title="Remove completed and failed exports">
              <span>
                <Button
                  size="small"
                  startIcon={<CleaningServicesOutlinedIcon />}
                  disabled={counts.done + counts.failed === 0}
                  onClick={() => exports.filter((j) => j.status !== 'running').forEach((j) => onRemove(j.id))}
                  sx={{ fontWeight: 700 }}
                >
                  Clear finished
                </Button>
              </span>
            </Tooltip>
          </Box>

          {groups.length === 0 ? (
            <EmptyState icon={FileDownloadOutlinedIcon} title="Nothing here">
              No exports match this filter.
            </EmptyState>
          ) : groups.map((g) => (
            <Box key={g.label} sx={{ mb: 2.5 }}>
              <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.secondary' }}>
                {g.label}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {g.items.map((job) => (
                  <ExportCard key={job.id} job={job} index={index++} now={now} onDownload={download} onRemove={onRemove} />
                ))}
              </Box>
            </Box>
          ))}
        </>
      )}
    </Box>
  );
}
