"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  Chip,
  Switch,
  LinearProgress,
  TablePagination,
  useTheme,
  alpha,
  Container,
  Divider,
  Tooltip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Snackbar,
  Alert,
  Slide
} from '@mui/material';

// Icons
import CachedRoundedIcon from '@mui/icons-material/CachedRounded';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import LayersIcon from '@mui/icons-material/Layers';

import { styled } from '@mui/material/styles';

// API & Context
import { dataloaderApi } from '../services/api-client';
import { useTenant } from '../tenant-context';

// Dialog components
import ModelUploadComponent from '../component/model-upload';
import ExecuteModel from '../component/execute-model';

// --- STYLED COMPONENTS ---

const Android12Switch = styled(Switch)(({ theme }) => ({
  padding: 8,
  '& .MuiSwitch-track': {
    borderRadius: 22 / 2,
    '&::before, &::after': {
      content: '""',
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      width: 16,
      height: 16,
    },
    '&::before': {
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
        theme.palette.getContrastText(theme.palette.primary.main),
      )}" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>')`,
      left: 12,
    },
    '&::after': {
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
        theme.palette.getContrastText(theme.palette.primary.main),
      )}" d="M19,13H5V11H19V13Z" /></svg>')`,
      right: 12,
    },
  },
  '& .MuiSwitch-thumb': {
    boxShadow: 'none',
    width: 16,
    height: 16,
    margin: 2,
  },
}));

// --- HELPERS ---

const formatDate = (isoString) => {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('en-CA');
};

const StatusChip = ({ status }) => {
  const isSuccess = status === 'ACTIVE' || status === 'COMPLETED' || status === 'SUCCESS';
  const isError = status === 'FAILED';
  const isWarning = status === 'IN_PROGRESS';
  const isPartial = status === 'PARTIAL_SUCCESS';
  const isIdle = status === 'IDLE' || status === 'INACTIVE' || status === 'CONFIGURE' || status === 'NOT_EXECUTED';

  let bg = alpha('#22c55e', 0.1);
  let color = '#166534';
  let border = alpha('#22c55e', 0.2);
  let label = status || '—';

  if (status === 'NOT_EXECUTED') label = 'NOT EXECUTED';
  else if (status === 'IN_PROGRESS') label = 'IN PROGRESS';
  else if (status === 'PARTIAL_SUCCESS') label = 'PARTIAL SUCCESS';

  if (isError) {
    bg = alpha('#ef4444', 0.1);
    color = '#991b1b';
    border = alpha('#ef4444', 0.2);
  } else if (isPartial) {
    bg = alpha('#f59e0b', 0.1);
    color = '#92400e';
    border = alpha('#f59e0b', 0.25);
  } else if (isWarning) {
    bg = alpha('#3b82f6', 0.1);
    color = '#1e40af';
    border = alpha('#3b82f6', 0.2);
  } else if (isIdle) {
    bg = alpha('#64748b', 0.1);
    color = '#334155';
    border = alpha('#64748b', 0.2);
  } else if (!isSuccess) {
    bg = alpha('#3b82f6', 0.1);
    color = '#1e40af';
    border = alpha('#3b82f6', 0.2);
  }

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        fontWeight: 700,
        fontSize: '0.7rem',
        borderRadius: 1,
        height: 24,
        bgcolor: bg,
        color: color,
        border: `1px solid ${border}`
      }}
    />
  );
};

// --- COMPONENTS ---

// Execution Summary Panel
const SUMMARY_STATUS_CONFIG = {
  SUCCESS: { color: '#16a34a', bg: 'rgba(22,163,74,0.08)', icon: CheckCircleOutlineIcon },
  PARTIAL_SUCCESS: { color: '#d97706', bg: 'rgba(217,119,6,0.08)', icon: ErrorOutlineIcon },
  FAILED: { color: '#dc2626', bg: 'rgba(220,38,38,0.08)', icon: ErrorOutlineIcon },
};

// Live Execution Progress Panel
// Which run record (ExecutionInstance) a model row belongs to: DSL models run as "DSL", Excel as "EXCEL".
const runTypeOf = (modelType) => (modelType === 'DSL' || modelType === 'PYTHON' ? 'DSL' : 'EXCEL');

// Status shown for a model type, from its latest run record (GET /model/executions/latest).
const executionStatusOf = (run) => {
  if (!run) return 'NOT_EXECUTED';
  if (run.active) return 'IN_PROGRESS';
  return run.status || 'NOT_EXECUTED';   // COMPLETED | PARTIAL_SUCCESS | FAILED
};

function ExecutionProgressPanel() {
  const theme = useTheme();
  const { tenant } = useTenant();
  const [progress, setProgress] = useState(null);
  const [batches, setBatches] = useState([]);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // The run shown is the one in progress, else the most recent one. Status, counts and chunk
  // progress come from its run record; the per-batch timeline from the batch logs of its posting
  // date (passed explicitly: the default date only advances when a run ends).
  const poll = useCallback(async () => {
    if (!tenant) return;
    try {
      const res = await dataloaderApi.get('/model/executions/latest', { headers: { 'X-Tenant': tenant } });
      const runs = Object.values(res.data || {}).filter(Boolean);
      if (runs.length === 0) { setProgress(null); setBatches([]); setIsRunning(false); return; }
      const run = runs.find(r => r.active)
        || runs.reduce((a, b) => (new Date(a.startTime) >= new Date(b.startTime) ? a : b));

      let timeline = null;
      try {
        const t = await dataloaderApi.get('/model/execution-progress', {
          headers: { 'X-Tenant': tenant }, params: { postingDate: run.postingDate }
        });
        timeline = t.data;
      } catch { /* timeline is optional */ }

      const completedBatches = run.completedBatches ?? 0;
      const failedBatches = run.failedBatches ?? 0;
      const totalInstruments = run.totalInstruments ?? timeline?.totalInstruments ?? 0;
      const totalInstrumentsProcessed = timeline?.totalInstrumentsProcessed ?? 0;
      const isComplete = !run.active;
      let completionPct = 0;
      if (isComplete) completionPct = 100;
      else if (run.totalChunks > 0) completionPct = Math.round((run.completedChunks ?? 0) * 1000 / run.totalChunks) / 10;
      else if (totalInstruments > 0) completionPct = Math.min(100, Math.round(totalInstrumentsProcessed * 1000 / totalInstruments) / 10);

      setProgress({
        runId: run._id, modelType: run.modelType, stage: run.status, errorMessage: run.errorMessage,
        postingDate: run.postingDate, startTime: run.startTime, endTime: run.endTime,
        completedBatches, failedBatches, successBatches: Math.max(0, completedBatches - failedBatches),
        totalChunks: run.totalChunks ?? 0, completedChunks: run.completedChunks ?? 0,
        totalInstruments, totalInstrumentsProcessed, totalExpectedBatches: 0,
        pageSize: timeline?.pageSize ?? 0, isComplete, completionPct,
      });
      setBatches(timeline?.batches ?? []);
      setIsRunning(!!run.active);
      setLastUpdated(new Date());
    } catch { /* silent — never block the UI */ }
  }, [tenant]);

  useEffect(() => {
    poll();
    if (!isLive) return;
    // Poll faster while a run is in progress, back off when idle
    const interval = isRunning ? 2000 : 10000;
    const t = setInterval(poll, interval);
    return () => clearInterval(t);
  }, [poll, isLive, isRunning]);

  const fmtMs = (ms) => {
    if (!ms && ms !== 0) return '—';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };
  const fmtTime = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (!progress) return null;

  const { completionPct = 0, completedBatches = 0, totalExpectedBatches = 0,
    totalInstruments = 0, totalInstrumentsProcessed = 0,
    successBatches = 0, failedBatches = 0, isComplete = false, pageSize = 0,
    stage, modelType, totalChunks = 0, completedChunks = 0, errorMessage } = progress;

  const stageLabel = (stage || '').replace(/_/g, ' ').toLowerCase();
  const statusColor = isRunning ? '#6366f1'
    : stage === 'FAILED' ? '#dc2626'
      : stage === 'PARTIAL_SUCCESS' || failedBatches > 0 ? '#d97706' : '#16a34a';
  const statusLabel = isRunning ? `Running · ${stageLabel}`
    : stage === 'FAILED' ? 'Failed'
      : stage === 'PARTIAL_SUCCESS' || failedBatches > 0 ? 'Completed with errors' : 'Completed';

  const fmtDate = (d) => {
    if (!d) return '—';
    const s = String(d);
    return s.length === 8 ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : s;
  };

  return (
    <Box sx={{
      mb: 3, borderRadius: 3, overflow: 'hidden', bgcolor: 'background.paper',
      boxShadow: `0 2px 12px ${alpha(theme.palette.grey[400], 0.2)}`,
      border: `1.5px solid ${alpha(statusColor, 0.25)}`,
    }}>
      {/* Header bar */}
      <Box sx={{
        px: 2.5, py: 1.5, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: alpha(statusColor, 0.05),
        borderBottom: collapsed ? 'none' : `1px solid ${alpha(statusColor, 0.15)}`,
        cursor: 'pointer',
      }} onClick={() => setCollapsed(c => !c)}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {isRunning
            ? <CircularProgress size={16} thickness={5} sx={{ color: statusColor }} />
            : <FiberManualRecordIcon sx={{ fontSize: 14, color: statusColor }} />
          }
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Live Execution Progress
          </Typography>
          <Chip label={statusLabel} size="small" sx={{
            height: 20, fontSize: '0.65rem', fontWeight: 700,
            bgcolor: alpha(statusColor, 0.1), color: statusColor,
            border: `1px solid ${alpha(statusColor, 0.3)}`
          }} />
          {modelType && (
            <Chip label={modelType} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
          )}
          {/* Posting date — always visible so you always know which date is running */}
          {progress?.postingDate && (
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 0.5,
              px: 1.2, py: 0.3, borderRadius: 1.5,
              bgcolor: alpha('#0ea5e9', 0.08),
              border: '1px solid ' + alpha('#0ea5e9', 0.25),
            }}>
              <AccessTimeIcon sx={{ fontSize: 13, color: '#0ea5e9' }} />
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#0369a1', letterSpacing: '0.02em' }}>
                {fmtDate(progress.postingDate)}
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {lastUpdated && (
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
              Updated {fmtTime(lastUpdated)}
            </Typography>
          )}
          <Tooltip title={isLive ? 'Pause polling' : 'Resume polling'}>
            <IconButton size="small" onClick={e => { e.stopPropagation(); setIsLive(l => !l); }}>
              {isLive
                ? <FiberManualRecordIcon sx={{ fontSize: 14, color: '#16a34a' }} />
                : <FiberManualRecordIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
              }
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={e => { e.stopPropagation(); setCollapsed(c => !c); }}>
            {collapsed ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowUpIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>

      <Collapse in={!collapsed}>
        <Box sx={{ p: 2.5 }}>
          {/* Progress bar */}
          <Box sx={{ mb: 2 }}>

            {/* Row 1: Batch count + completion % */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Batches Completed:
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {/* Batch size is set by the worker callback and chunks round up independently, so
                      totalInstruments / pageSize is not the batch count; only a reported total is shown. */}
                  {completedBatches}{totalExpectedBatches > 0 && !isComplete ? ` of ${totalExpectedBatches}` : ''}
                </Typography>
                {successBatches > 0 && (
                  <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 600 }}>· {successBatches} succeeded</Typography>
                )}
                {failedBatches > 0 && (
                  <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 600 }}>· {failedBatches} failed</Typography>
                )}
              </Box>
              <Typography variant="caption" sx={{ color: statusColor, fontWeight: 700, fontSize: '0.85rem' }}>
                {completionPct}%{isComplete && !isRunning ? ' ✓' : ''}
              </Typography>
            </Box>

            {/* Row 2: Instrument breakdown */}
            {totalInstruments > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Instruments Processed:
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {totalInstrumentsProcessed.toLocaleString()} of {totalInstruments.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  · batch size {pageSize}
                </Typography>
              </Box>
            )}

            {totalChunks > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Chunks Completed:
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {completedChunks} of {totalChunks}
                </Typography>
              </Box>
            )}

            {errorMessage && (
              <Typography variant="caption" display="block" sx={{ color: '#991b1b', mb: 0.75 }}>
                {errorMessage}
              </Typography>
            )}

            <Tooltip
              title={totalChunks > 0
                ? `${completionPct}% = ${completedChunks} of ${totalChunks} chunks completed`
                : `${completionPct}% = ${totalInstrumentsProcessed} of ${totalInstruments} instruments processed`}
              placement="top"
            >
              <LinearProgress
                variant={isRunning ? 'buffer' : 'determinate'}
                value={completionPct}
                valueBuffer={Math.min(100, completionPct + (isRunning ? 5 : 0))}
                sx={{
                  height: 8, borderRadius: 4, cursor: 'help',
                  bgcolor: alpha(statusColor, 0.1),
                  '& .MuiLinearProgress-bar': { bgcolor: statusColor, borderRadius: 4, transition: 'transform 0.6s ease' },
                  '& .MuiLinearProgress-bar2Buffer': { bgcolor: alpha(statusColor, 0.2) },
                }}
              />
            </Tooltip>
          </Box>

          {/* Per-batch timeline */}
          {batches.length > 0 && (
            <Box sx={{
              maxHeight: 280, overflowY: 'auto',
              border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
              borderRadius: 2, bgcolor: alpha(theme.palette.grey[50], 0.5),
            }}>
              {/* Table header */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: '52px 1fr 90px 90px 90px 90px',
                px: 1.5, py: 1,
                bgcolor: alpha(theme.palette.grey[100], 0.8),
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
                position: 'sticky', top: 0, zIndex: 1,
              }}>
                {['Batch', 'Job ID', 'Type', 'Instruments', 'Duration', 'Status'].map(h => (
                  <Typography key={h} variant="caption" sx={{
                    fontWeight: 700, fontSize: '0.65rem',
                    color: 'text.secondary', textTransform: 'uppercase'
                  }}>{h}</Typography>
                ))}
              </Box>

              {/* Batch rows */}
              {[...batches].reverse().map((b, i) => {
                const bStatus = b.status ?? 'UNKNOWN';
                const bColor = bStatus === 'SUCCESS' ? '#16a34a' : bStatus === 'FAILED' ? '#dc2626' : '#d97706';
                return (
                  <Box key={i} sx={{
                    display: 'grid',
                    gridTemplateColumns: '52px 1fr 90px 90px 90px 90px',
                    px: 1.5, py: 0.75, alignItems: 'center',
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.25)}`,
                    '&:last-child': { borderBottom: 'none' },
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.03) },
                    transition: 'background 0.15s',
                  }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      #{(b.batchNumber ?? i) + 1}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontFamily: 'monospace', fontSize: '0.68rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {b.jobId ?? '—'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {b.modelType ?? '—'}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {b.instrumentCount ?? 0}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#7c3aed' }}>
                      {fmtMs(b.durationMs)}
                    </Typography>
                    <Box>
                      <Chip label={bStatus} size="small" sx={{
                        height: 18, fontSize: '0.6rem', fontWeight: 700,
                        bgcolor: alpha(bColor, 0.1), color: bColor,
                        border: `1px solid ${alpha(bColor, 0.3)}`
                      }} />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}

          {batches.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>
              {isComplete ? 'No per-batch log for this run.' : 'Waiting for batch data…'}
            </Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

// Fyntrac Card
const FyntracCard = ({ title, children, action, sx }) => {
  const theme = useTheme();
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        boxShadow: `0px 2px 4px ${alpha(theme.palette.grey[300], 0.4)}, 0px 0px 2px ${alpha(theme.palette.grey[400], 0.2)}`,
        bgcolor: 'background.paper',
        transition: 'box-shadow 0.3s, transform 0.2s ease-in-out',
        '&:hover': {
          boxShadow: `0px 12px 24px ${alpha(theme.palette.grey[400], 0.3)}`,
          transform: 'translateY(-2px)'
        },
        ...sx
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 2.5,
          borderBottom: '1px solid',
          borderColor: alpha(theme.palette.divider, 0.5),
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          borderRadius: '12px 12px 0 0'
        }}
      >
        <Typography variant="h6" sx={{ fontSize: '1.05rem', fontWeight: 700, color: 'text.primary' }}>
          {title}
        </Typography>
        {action}
      </Box>
      <Box sx={{ p: 0 }}>
        {children}
      </Box>
    </Card>
  );
};

// Row Component
function Row({ row, onToggleStatus, onDownload, onExecute, executionStatus, execRefreshKey }) {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const { tenant } = useTenant();

  // Lazy-fetch summary when row is first expanded
  const [rowSummary, setRowSummary] = useState(null);
  const [rowSummaryLoading, setRowSummaryLoading] = useState(false);
  const [fetchedFor, setFetchedFor] = useState(null);

  // Reset cached summary whenever a new execution is triggered; re-fetch if row is already open
  useEffect(() => {
    if (execRefreshKey === 0) return; // skip initial mount
    setFetchedFor(null);
    setRowSummary(null);
    if (!open || !tenant) return;
    setRowSummaryLoading(true);
    const modelType = row.modelType === 'DSL' ? 'PYTHON' : row.modelType;
    dataloaderApi.get(
      `/model/execution-summary${modelType ? `?modelType=${modelType}` : ''}`,
      { headers: { 'X-Tenant': tenant } }
    ).then(res => {
      const data = res.data;
      setRowSummary(Array.isArray(data) ? data[0] : data);
      setFetchedFor(row.id);
    }).catch(() => {
      setRowSummary(null);
    }).finally(() => {
      setRowSummaryLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execRefreshKey]);

  const handleExpand = async () => {
    const next = !open;
    setOpen(next);
    // Fetch summary on expand; cache is cleared after each execution
    if (next && fetchedFor !== row.id && tenant) {
      setRowSummaryLoading(true);
      const modelType = row.modelType === 'DSL' ? 'PYTHON' : row.modelType;
      try {
        const res = await dataloaderApi.get(
          `/model/execution-summary${modelType ? `?modelType=${modelType}` : ''}`,
          { headers: { 'X-Tenant': tenant } }
        );
        const data = res.data;
        setRowSummary(Array.isArray(data) ? data[0] : data);
      } catch {
        setRowSummary(null);
      } finally {
        setRowSummaryLoading(false);
        setFetchedFor(row.id);
      }
    }
  };

  const handleToggle = () => onToggleStatus(row);
  const handleDownload = (e) => { e.stopPropagation(); onDownload(row); };
  const handleExecute = (e) => { e.stopPropagation(); onExecute(row); };

  const fmtMs = (ms) => {
    if (!ms && ms !== 0) return '—';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };
  const fmtDate = (d) => {
    if (!d) return '—';
    const s = String(d);
    return s.length === 8 ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : s;
  };

  const successBatches = rowSummary?.statusCounts?.SUCCESS ?? rowSummary?.totalSuccess ?? 0;
  const failedBatches = rowSummary?.statusCounts?.FAILED ?? rowSummary?.totalFailed ?? 0;
  const overallStatus = !rowSummary ? null
    : failedBatches === 0 ? 'SUCCESS'
      : successBatches === 0 ? 'FAILED' : 'PARTIAL_SUCCESS';
  const statusCfg = overallStatus ? (SUMMARY_STATUS_CONFIG[overallStatus] || SUMMARY_STATUS_CONFIG.SUCCESS) : null;

  return (
    <>
      <TableRow
        sx={{
          '& > *': { borderBottom: 'unset' },
          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
          transition: 'background-color 0.2s',
          cursor: 'pointer'
        }}
        onClick={handleExpand}
      >
        <TableCell width={60}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={(e) => { e.stopPropagation(); handleExpand(); }}
            sx={{
              bgcolor: open ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
              color: open ? 'primary.main' : 'action.active'
            }}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>

        <TableCell component="th" scope="row" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {row.orderId || '—'}
        </TableCell>
        <TableCell sx={{ color: 'text.secondary' }}>{row.modelName || '—'}</TableCell>
        <TableCell sx={{ color: 'text.secondary' }}>{row.modelType || '—'}</TableCell>
        <TableCell sx={{ color: 'text.secondary' }}>{formatDate(row.uploadDate)}</TableCell>
        <TableCell><StatusChip status={row.modelStatus} /></TableCell>
        <TableCell><StatusChip status={executionStatus ?? null} /></TableCell>
        <TableCell sx={{ color: 'text.secondary' }}>{row.uploadedBy || '—'}</TableCell>

        <TableCell onClick={(e) => e.stopPropagation()} align="center">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Tooltip title={`Execute ${row.modelType || 'Model'}`}>
              <span>
                <IconButton
                  size="small"
                  onClick={handleExecute}
                  disabled={row.modelStatus !== 'ACTIVE'}
                  sx={{
                    bgcolor: 'rgba(22,163,74,0.1)',
                    border: '1px solid rgba(21,128,61,0.35)',
                    color: '#16a34a',
                    '&:hover': { bgcolor: 'rgba(22,163,74,0.2)', borderColor: '#15803d' },
                    '&.Mui-disabled': { bgcolor: 'rgba(0,0,0,0.04)', borderColor: 'transparent', color: 'action.disabled' },
                  }}
                >
                  <PlayArrowIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Download">
              <span>
                <IconButton size="small" onClick={handleDownload} disabled={!row.modelFileId}>
                  <FileDownloadOutlinedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={row.modelStatus === 'ACTIVE' ? 'Set Inactive' : 'Set Active'}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Android12Switch
                  checked={row.modelStatus === 'ACTIVE'}
                  onChange={handleToggle}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#1e88e5',
                      '&:hover': { backgroundColor: 'rgba(30, 136, 229, 0.08)' },
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#1e88e5',
                    },
                    '& .MuiSwitch-switchBase:not(.Mui-checked)': {
                      color: '#6d6d6d',
                      '&:hover': { backgroundColor: 'rgba(109, 109, 109, 0.08)' },
                    },
                    '& .MuiSwitch-switchBase:not(.Mui-checked) + .MuiSwitch-track': {
                      backgroundColor: '#6d6d6d',
                    },
                  }}
                />
              </Box>
            </Tooltip>
            <Tooltip title="Delete">
              <span>
                <IconButton size="small" color="error" disabled>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </TableCell>
      </TableRow>

      {/* Expanded: Execution Summary */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ mx: 2, my: 1.5, p: 2.5, bgcolor: alpha(theme.palette.grey[50], 0.5), borderRadius: 2, border: `1px dashed ${theme.palette.divider}` }}>

              {rowSummaryLoading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">Loading execution summary…</Typography>
                </Box>
              )}

              {!rowSummaryLoading && !rowSummary && (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 0.5 }}>
                  No execution summary found for this model type.
                </Typography>
              )}

              {!rowSummaryLoading && rowSummary && (
                <>
                  {/* Summary header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {statusCfg && <statusCfg.icon sx={{ color: statusCfg.color, fontSize: 20 }} />}
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        Last Execution Summary
                      </Typography>
                      {overallStatus && (
                        <Chip
                          label={overallStatus.replace('_', ' ')}
                          size="small"
                          sx={{
                            fontWeight: 700, fontSize: '0.65rem', borderRadius: 1, height: 20,
                            bgcolor: statusCfg.bg, color: statusCfg.color,
                            border: `1px solid ${alpha(statusCfg.color, 0.3)}`
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Posting Date: <strong>{fmtDate(rowSummary.postingDate)}</strong>
                    </Typography>
                  </Box>

                  {/* Stat grid */}
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    {[{ label: 'Total Batches', value: rowSummary.totalBatches ?? 0, color: '#6366f1', icon: LayersIcon },
                    { label: 'Instruments', value: (rowSummary.totalInstruments ?? 0).toLocaleString(), color: '#0ea5e9', icon: FiberManualRecordIcon },
                    { label: 'Successful', value: successBatches, color: '#16a34a', icon: CheckCircleOutlineIcon },
                    { label: 'Failed', value: failedBatches, color: failedBatches > 0 ? '#dc2626' : '#94a3b8', icon: ErrorOutlineIcon },
                    { label: 'Total Duration', value: fmtMs(rowSummary.totalDurationMs), color: '#7c3aed', icon: AccessTimeIcon },
                    { label: 'Avg Batch', value: fmtMs(rowSummary.avgBatchMs), color: '#0891b2', icon: AccessTimeIcon },
                    ].map(({ label, value, color, icon: Icon }) => (
                      <Box key={label} sx={{
                        flex: 1, minWidth: 140,
                        display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5,
                        borderRadius: 2, bgcolor: `${color}0d`, border: `1px solid ${color}22`
                      }}>
                        <Box sx={{
                          width: 34, height: 34, borderRadius: '50%',
                          bgcolor: `${color}1a`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <Icon sx={{ fontSize: 18, color }} />
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem', display: 'block', lineHeight: 1.2 }}>{label}</Typography>
                          <Typography sx={{ fontWeight: 700, fontSize: '1rem', color, lineHeight: 1.4 }}>{value}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  {/* Errors */}
                  {rowSummary.errors?.length > 0 && (
                    <Box sx={{ mt: 1.5, p: 1, borderRadius: 1.5, bgcolor: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.15)' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#dc2626' }}>Errors:</Typography>
                      {rowSummary.errors.map((e, i) => (
                        <Typography key={i} variant="caption" display="block" sx={{ color: '#991b1b', mt: 0.3, fontSize: '0.7rem' }}>• {e}</Typography>
                      ))}
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}


// --- MAIN PAGE ---
export default function ModelPage() {
  const theme = useTheme();
  const { tenant } = useTenant();

  // Data state
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [executeOpen, setExecuteOpen] = useState(false);
  const [selectedModelType, setSelectedModelType] = useState(null);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Incremented after each execution so Row components reset their cached summaries
  const [execRefreshKey, setExecRefreshKey] = useState(0);

  // Execution status map: 'DSL' | 'EXCEL' -> 'NOT_EXECUTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PARTIAL_SUCCESS' | 'FAILED'
  const [executionStatusMap, setExecutionStatusMap] = useState({});

  // Execution status per run type ('DSL' | 'EXCEL'), from the latest run record of each.
  const refreshExecutionStatuses = useCallback(async () => {
    try {
      const res = await dataloaderApi.get('/model/executions/latest');
      const runs = res.data || {};
      setExecutionStatusMap({
        DSL: executionStatusOf(runs.DSL),
        EXCEL: executionStatusOf(runs.EXCEL),
      });
    } catch { /* silent — keep the last known statuses */ }
  }, []);

  // --- Data fetching ---
  const fetchModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dataloaderApi.get('/model/get/all');
      const data = response.data || [];
      setRows(data);
      refreshExecutionStatuses();
    } catch (err) {
      console.error('Failed to fetch models:', err);
      setError('Failed to load models. Please try again.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [refreshExecutionStatuses]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Real-time polling: 3s while IN_PROGRESS, 8s otherwise
  useEffect(() => {
    const poll = () => refreshExecutionStatuses();
    const getInterval = () =>
      Object.values(executionStatusMap).includes('IN_PROGRESS') ? 3000 : 8000;
    let timer = setInterval(poll, getInterval());
    // Restart interval whenever the interval duration should change
    return () => clearInterval(timer);
  }, [refreshExecutionStatuses, executionStatusMap]);

  // When a run leaves IN_PROGRESS its summary has just been written, so open rows re-fetch it.
  const prevStatusRef = useRef({});
  useEffect(() => {
    const prev = prevStatusRef.current;
    const finished = Object.keys(executionStatusMap).some(
      k => prev[k] === 'IN_PROGRESS' && executionStatusMap[k] !== 'IN_PROGRESS');
    prevStatusRef.current = executionStatusMap;
    if (finished) setExecRefreshKey(k => k + 1);
  }, [executionStatusMap]);

  // --- Action handlers ---

  const handleRefresh = () => {
    fetchModels();
  };

  const handleToggleStatus = async (model) => {
    const newStatus = model.modelStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updatedModel = {
      id: model.id,
      orderId: model.orderId,
      modelName: model.modelName,
      modelType: model.modelType,
      uploadDate: model.uploadDate,
      uploadStatus: model.uploadStatus,
      modelStatus: newStatus,
      uploadedBy: model.uploadedBy,
      isDeleted: model.isDeleted,
      lastModifiedDate: model.lastModifiedDate,
      modifiedBy: model.modifiedBy,
      modelConfig: model.modelConfig,
      modelFileId: model.modelFileId,
    };

    try {
      await dataloaderApi.post('/model/save', updatedModel);
      // Optimistic update
      setRows((prev) =>
        prev.map((r) => (r.id === model.id ? { ...r, modelStatus: newStatus } : r))
      );
      setSnackbar({ open: true, message: `Model "${model.modelName}" set to ${newStatus}`, severity: 'success' });
    } catch (err) {
      console.error('Failed to update model status:', err);
      setSnackbar({ open: true, message: 'Failed to update model status.', severity: 'error' });
    }
  };

  const handleDownload = async (model) => {
    if (!model.modelFileId) return;
    try {
      const response = await dataloaderApi.get(`/model/download/${model.modelFileId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${model.modelName || 'model'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download model:', err);
      setSnackbar({ open: true, message: 'Failed to download model file.', severity: 'error' });
    }
  };

  const handleUploadClose = () => {
    setUploadOpen(false);
    fetchModels(); // Refresh after upload dialog closes
  };

  const handleExecuteOpen = (model) => {
    setSelectedModelType(model?.modelType ?? null);
    setExecuteOpen(true);
  };

  const handleExecuteClose = (val) => {
    setExecuteOpen(false);
    setSelectedModelType(null);
    setExecRefreshKey(k => k + 1); // Force all Row components to re-fetch their summaries
    fetchModels(); // Refresh after execute dialog closes
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Paginated rows
  const paginatedRows = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ bgcolor: alpha(theme.palette.grey[50], 0.5), minHeight: '100vh', pb: 1 }}>

      <Container maxWidth={false} sx={{ py: 1, px: 2 }}>

        {/* 1. Header Section */}
        <Box sx={{
          p: 1.5,
          borderBottom: '1.5px solid',
          borderColor: (theme) => alpha(theme.palette.divider, 0.2),
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { sm: 'center' },
          gap: 2,
          mb: 4
        }}>
          <Box>
            <Typography variant="h5" fontWeight={600} color="text.primary" sx={{ letterSpacing: '-0.5px' }}>
              Model Management
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Upload Model">
              <IconButton
                sx={{ bgcolor: 'white', boxShadow: 1, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', '&:hover': { bgcolor: 'grey.50', boxShadow: 3, transform: 'scale(1.08)' }, '&:active': { transform: 'scale(0.94)' } }}
                onClick={() => setUploadOpen(true)}
              >
                <FileUploadOutlinedIcon color="action" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton
                sx={{ bgcolor: 'white', boxShadow: 1, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', '&:hover': { bgcolor: 'grey.50', boxShadow: 3, transform: 'scale(1.08)' }, '&:active': { transform: 'scale(0.94)' } }}
                onClick={handleRefresh}
              >
                <CachedRoundedIcon color="action" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* 2. Live Progress Panel */}
        <ExecutionProgressPanel />

        {/* 3. Main Data Table */}
        <Box>
          <FyntracCard title="Loaded Models">

            {/* Loading indicator */}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
                <CircularProgress size={36} />
                <Typography sx={{ ml: 2 }} color="text.secondary">Loading models…</Typography>
              </Box>
            )}

            {/* Error state */}
            {!loading && error && (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography color="error">{error}</Typography>
              </Box>
            )}

            {/* Table */}
            {!loading && !error && (
              <>
                <TableContainer>
                  <Table aria-label="model table">
                    <TableHead sx={{ bgcolor: alpha(theme.palette.grey[100], 0.5) }}>
                      <TableRow>
                        <TableCell width={60} />
                        <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Execution ID</TableCell>
                        <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Model Type</TableCell>
                        <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Upload Date</TableCell>
                        <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Model Status</TableCell>
                        <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Execution Status</TableCell>
                        <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>User</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                            <Typography color="text.secondary">No models found. Upload a model to get started.</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedRows.map((row) => (
                          <Row
                            key={row.id}
                            row={row}
                            onToggleStatus={handleToggleStatus}
                            onDownload={handleDownload}
                            onExecute={handleExecuteOpen}
                            executionStatus={executionStatusMap[runTypeOf(row.modelType)]}
                            execRefreshKey={execRefreshKey}
                          />
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination Footer */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                  <TablePagination
                    component="div"
                    count={rows.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25]}
                  />
                </Box>
              </>
            )}

          </FyntracCard>
        </Box>

      </Container>

      {/* Upload Dialog */}
      <Dialog
        open={uploadOpen}
        onClose={handleUploadClose}
        maxWidth="md"
        fullWidth
        slots={{ transition: Slide }}
        slotProps={{
          transition: { direction: 'up' },
          paper: {
            sx: {
            borderRadius: 4,
            boxShadow: '0 32px 64px rgba(0,0,0,0.14)',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            },
          },
        }}
      >
        <DialogTitle sx={{ p: 0 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 3,
              pt: 3,
              pb: 2.5,
              background: 'linear-gradient(135deg, rgba(30,64,175,0.05) 0%, rgba(99,102,241,0.04) 100%)',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <img
                src="fyntrac.png"
                alt="Fyntrac"
                style={{ width: 72, height: 'auto' }}
              />
              <Box>
                <Chip
                  label="Model Management"
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                    bgcolor: alpha('#3f51b5', 0.1),
                    color: '#3f51b5',
                    mb: 0.5,
                    borderRadius: 1,
                  }}
                />
                <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, color: 'text.primary' }}>
                  Model Upload
                </Typography>
              </Box>
            </Box>
            <Tooltip title="Close" placement="left">
              <IconButton
                onClick={handleUploadClose}
                size="small"
                sx={{
                  color: 'text.secondary',
                  bgcolor: 'action.hover',
                  borderRadius: 2,
                  '&:hover': { bgcolor: alpha('#ef4444', 0.1), color: 'error.main' },
                }}
              >
                <HighlightOffOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogTitle>
        <ModelUploadComponent
          onDrop={handleUploadClose}
          text="Drag and drop model file here or click to browse"
        />
      </Dialog>

      {/* Execute Dialog */}
      <ExecuteModel open={executeOpen} onClose={handleExecuteClose} modelType={selectedModelType} />

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ top: '55px', '@media (min-width:600px)': { top: '55px' } }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="standard"
          sx={{
            width: '100%',
            bgcolor: snackbar.severity === 'success' ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.10)',
            border: snackbar.severity === 'success' ? '1px solid rgba(22,163,74,0.3)' : '1px solid rgba(220,38,38,0.3)',
            color: snackbar.severity === 'success' ? '#15803d' : '#dc2626',
            '& .MuiAlert-icon': { color: snackbar.severity === 'success' ? '#16a34a' : '#dc2626' },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Box>
  );
}