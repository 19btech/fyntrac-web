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
  const text = String(isoString);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const d = new Date(text);
  return isNaN(d) ? text : d.toLocaleDateString('en-CA');
};

// Chip colours per status: model status (ACTIVE / INACTIVE) and execution status.
const CHIP_TONES = {
  green: { bg: alpha('#22c55e', 0.1), color: '#166534', border: alpha('#22c55e', 0.2) },
  red: { bg: alpha('#ef4444', 0.1), color: '#991b1b', border: alpha('#ef4444', 0.2) },
  amber: { bg: alpha('#f59e0b', 0.1), color: '#92400e', border: alpha('#f59e0b', 0.25) },
  blue: { bg: alpha('#3b82f6', 0.1), color: '#1e40af', border: alpha('#3b82f6', 0.2) },
  grey: { bg: alpha('#64748b', 0.1), color: '#334155', border: alpha('#64748b', 0.2) },
};
const STATUS_CHIP = {
  ACTIVE: ['green', 'ACTIVE'],
  INACTIVE: ['grey', 'INACTIVE'],
  COMPLETED: ['green', 'COMPLETED'],
  PARTIAL_SUCCESS: ['amber', 'PARTIAL SUCCESS'],
  FAILED: ['red', 'FAILED'],
  IN_PROGRESS: ['blue', 'IN PROGRESS'],
  STARTING: ['blue', 'STARTING'],
  STOPPED: ['amber', 'STOPPED'],
  NOT_EXECUTED: ['grey', 'NOT EXECUTED'],
  NOT_INCLUDED: ['grey', 'NOT INCLUDED'],
  UNKNOWN: ['grey', 'UNKNOWN'],
};

// Unrecognised values are shown as they are, in grey (never as "in progress" or "completed").
const StatusChip = ({ status, tooltip }) => {
  const [toneName, label] = STATUS_CHIP[status] ?? ['grey', status ? String(status).replace(/_/g, ' ') : '—'];
  const tone = CHIP_TONES[toneName];
  const chip = (
    <Chip
      label={label}
      size="small"
      sx={{
        fontWeight: 700,
        fontSize: '0.7rem',
        borderRadius: 1,
        height: 24,
        bgcolor: tone.bg,
        color: tone.color,
        border: `1px solid ${tone.border}`
      }}
    />
  );
  return tooltip ? <Tooltip title={tooltip}><span>{chip}</span></Tooltip> : chip;
};

// --- COMPONENTS ---

// Execution Summary Panel
const SUMMARY_STATUS_CONFIG = {
  SUCCESS: { color: '#16a34a', bg: 'rgba(22,163,74,0.08)', icon: CheckCircleOutlineIcon },
  STOPPED: { color: '#64748b', bg: 'rgba(100,116,139,0.08)', icon: ErrorOutlineIcon },
  PARTIAL_SUCCESS: { color: '#d97706', bg: 'rgba(217,119,6,0.08)', icon: ErrorOutlineIcon },
  FAILED: { color: '#dc2626', bg: 'rgba(220,38,38,0.08)', icon: ErrorOutlineIcon },
};

// A summary without any batches means the model hasn't run yet (shown as "no summary", not SUCCESS).
const usableSummary = (data) => {
  const summary = Array.isArray(data) ? data[0] : data;
  if (!summary || typeof summary !== 'object') return null;
  const success = summary.statusCounts?.SUCCESS ?? summary.totalSuccess ?? 0;
  const failed = summary.statusCounts?.FAILED ?? summary.totalFailed ?? 0;
  const total = summary.totalBatches ?? 0;
  return success + failed + total > 0 ? summary : null;
};

// Live Execution Progress Panel
// Which run record (ExecutionInstance) a model row belongs to: DSL models run as "DSL", Excel as "EXCEL".
const runTypeOf = (modelType) => (modelType === 'DSL' || modelType === 'PYTHON' ? 'DSL' : 'EXCEL');

// Run record statuses. While a run is active its status is its current stage (e.g. LOADING_DATA);
// a final status always wins over the active flag (a record can't be both FAILED and running).
const FINAL_STATUSES = {
  COMPLETED: 'COMPLETED', SUCCESS: 'COMPLETED',
  PARTIAL_SUCCESS: 'PARTIAL_SUCCESS',
  FAILED: 'FAILED',
  STOPPED: 'STOPPED', CANCELLED: 'STOPPED', CANCELED: 'STOPPED', ABANDONED: 'STOPPED',
};
const RUNNING_STATUSES = new Set(['IN_PROGRESS', 'RUNNING', 'STARTING', 'STARTED', 'QUEUED']);
const upper = (v) => String(v ?? '').toUpperCase();
const finalStatusOf = (run) => FINAL_STATUSES[upper(run?.status)] ?? null;
const isRunActive = (run) => Boolean(run) && !finalStatusOf(run)
  && (run.active === true || (run.active === undefined && RUNNING_STATUSES.has(upper(run.status))));

// Status shown for a model type, from its latest run record (GET /model/executions/latest).
const executionStatusOf = (run) => {
  if (!run) return 'NOT_EXECUTED';
  if (isRunActive(run)) return 'IN_PROGRESS';
  return finalStatusOf(run) ?? 'UNKNOWN'; // not running and no recognised outcome
};

// Start time as a number; records without a valid one sort last (never "the latest").
const runTime = (run) => {
  const t = Date.parse(run?.startTime);
  return Number.isFinite(t) ? t : -Infinity;
};
const latestRunOf = (runs) => runs.reduce((a, b) => (runTime(b) > runTime(a) ? b : a));

// Identity of a run record's state: changes when a run starts, progresses or ends.
const runSignature = (run) => (run
  ? [run._id ?? run.id ?? '', run.startTime ?? '', upper(run.status), isRunActive(run), run.endTime ?? '',
    run.completedBatches ?? '', run.failedBatches ?? '', run.completedChunks ?? ''].join('|')
  : 'none');

// Posting dates as yyyymmdd strings, whatever form they arrive in.
const postingKey = (d) => String(d ?? '').replace(/-/g, '').slice(0, 8);

// No reported progress for this long while active: the run may be stuck.
const STALL_MS = 10 * 60 * 1000;

// The outcome shown for a run: label, colour and whether it finished cleanly.
const runOutcome = (run, failedBatches) => {
  if (isRunActive(run)) {
    const stage = upper(run.status).replace(/_/g, ' ').toLowerCase();
    return { kind: 'running', label: stage && stage !== 'in progress' ? `Running · ${stage}` : 'Running', color: '#6366f1' };
  }
  const final = finalStatusOf(run);
  if (final === 'FAILED') return { kind: 'failed', label: 'Failed', color: '#dc2626' };
  if (final === 'STOPPED') return { kind: 'stopped', label: 'Stopped', color: '#64748b' };
  if (final === 'PARTIAL_SUCCESS' || (final === 'COMPLETED' && failedBatches > 0)) {
    return { kind: 'partial', label: 'Completed with errors', color: '#d97706' };
  }
  if (final === 'COMPLETED') return { kind: 'completed', label: 'Completed', color: '#16a34a' };
  return { kind: 'unknown', label: 'Status unknown', color: '#64748b' };
};

// The batches of this run only: the timeline endpoint returns every batch for the posting date,
// which can include a re-run on that date or the other model type.
const batchTime = (b) => Date.parse(b.startTime ?? b.createdAt ?? b.timestamp ?? '');
const batchesOfRun = (batches, run) => {
  const start = runTime(run);
  return (batches || []).filter((b) => {
    if (b.modelType && run.modelType && runTypeOf(upper(b.modelType)) !== runTypeOf(upper(run.modelType))) return false;
    const t = batchTime(b);
    // Allow a minute of clock difference between the services.
    return !(Number.isFinite(t) && Number.isFinite(start) && t < start - 60000);
  });
};

function ExecutionProgressPanel({ run, pollAt }) {
  const theme = useTheme();
  const { tenant } = useTenant();
  const [timeline, setTimeline] = useState(null);
  const [isLive, setIsLive] = useState(true);
  const [shownRun, setShownRun] = useState(run);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  // When this run last reported progress (for spotting a stuck run).
  const progressSeen = useRef({ key: null, at: Date.now() });

  // Follows the page's poll; "Pause" freezes what is shown. The per-batch timeline is re-read
  // when the run changes (and on every poll while it is running).
  const sig = runSignature(run);
  const updateSeq = useRef(0);
  useEffect(() => {
    if (!isLive || !run || !tenant) return;
    setShownRun(run);
    const seq = ++updateSeq.current;
    dataloaderApi.get('/model/execution-progress', {
      headers: { 'X-Tenant': tenant }, params: { postingDate: run.postingDate }
    })
      .then((t) => { if (seq === updateSeq.current) setTimeline(t.data); })
      .catch(() => { /* timeline is optional */ })
      .finally(() => { if (seq === updateSeq.current) setLastUpdated(new Date()); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, isLive, tenant, isRunActive(run) ? pollAt : null]);

  // A stuck run never changes its record, so nothing else re-renders this panel: tick while running
  // so "no progress for N min" can appear.
  const [, setTick] = useState(0);
  const shownActive = isRunActive(shownRun);
  useEffect(() => {
    if (!shownActive) return undefined;
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, [shownActive]);

  const current = shownRun;
  if (!current) return null;

  const running = isRunActive(current);
  const progressKey = [current._id, current.completedChunks, current.completedBatches, current.failedBatches, upper(current.status)].join('|');
  if (progressSeen.current.key !== progressKey) progressSeen.current = { key: progressKey, at: Date.now() };
  const stalledFor = running ? Date.now() - progressSeen.current.at : 0;
  const stalled = running && stalledFor > STALL_MS;

  const allBatches = timeline?.batches ?? [];
  const batches = batchesOfRun(allBatches, current);
  const filteredOut = batches.length !== allBatches.length;
  const completedBatches = current.completedBatches ?? 0;
  const failedBatches = current.failedBatches ?? 0;
  // Only a count the service reports itself (completed may or may not include failed batches).
  const successBatches = current.successBatches ?? current.succeededBatches ?? null;
  const totalInstruments = current.totalInstruments ?? timeline?.totalInstruments ?? 0;
  const totalInstrumentsProcessed = filteredOut
    ? batches.reduce((sum, b) => sum + (Number(b.instrumentCount) || 0), 0)
    : (timeline?.totalInstrumentsProcessed ?? 0);
  const totalChunks = current.totalChunks ?? 0;
  const completedChunks = current.completedChunks ?? 0;
  const pageSize = timeline?.pageSize ?? 0;
  const outcome = runOutcome(current, failedBatches);
  const finishedCleanly = outcome.kind === 'completed' || outcome.kind === 'partial';

  // A run that completed is 100%; a failed / stopped one shows how far it got.
  let completionPct = 0;
  if (finishedCleanly) completionPct = 100;
  else if (totalChunks > 0) completionPct = Math.min(100, Math.round(completedChunks * 1000 / totalChunks) / 10);
  else if (totalInstruments > 0) completionPct = Math.min(100, Math.round(totalInstrumentsProcessed * 1000 / totalInstruments) / 10);

  const statusColor = outcome.color;
  const errorMessage = current.errorMessage;
  const modelType = current.modelType;

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          {running
            ? <CircularProgress size={16} thickness={5} sx={{ color: statusColor }} />
            : <FiberManualRecordIcon sx={{ fontSize: 14, color: statusColor }} />
          }
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {running ? 'Live Execution Progress' : 'Last Execution'}
          </Typography>
          <Chip label={outcome.label} size="small" sx={{
            height: 20, fontSize: '0.65rem', fontWeight: 700,
            bgcolor: alpha(statusColor, 0.1), color: statusColor,
            border: `1px solid ${alpha(statusColor, 0.3)}`
          }} />
          {modelType && (
            <Chip label={modelType} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
          )}
          {/* Posting date — always visible so you always know which date is running */}
          {current.postingDate && (
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 0.5,
              px: 1.2, py: 0.3, borderRadius: 1.5,
              bgcolor: alpha('#0ea5e9', 0.08),
              border: '1px solid ' + alpha('#0ea5e9', 0.25),
            }}>
              <AccessTimeIcon sx={{ fontSize: 13, color: '#0ea5e9' }} />
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#0369a1', letterSpacing: '0.02em' }}>
                {fmtDate(current.postingDate)}
              </Typography>
            </Box>
          )}
          {stalled && (
            <Chip
              icon={<ErrorOutlineIcon sx={{ fontSize: '14px !important' }} />}
              label={`No progress for ${Math.floor(stalledFor / 60000)} min`}
              size="small"
              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: alpha('#d97706', 0.1), color: '#b45309', border: `1px solid ${alpha('#d97706', 0.3)}` }}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {lastUpdated && (
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
              Updated {fmtTime(lastUpdated)}
            </Typography>
          )}
          <Tooltip title={isLive ? 'Pause updates' : 'Resume updates'}>
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
          {stalled && (
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2, py: 0 }}>
              This run hasn't reported any progress for {Math.floor(stalledFor / 60000)} minutes. It may be stuck — check the service logs before starting another run.
            </Alert>
          )}
          {/* Progress bar */}
          <Box sx={{ mb: 2 }}>

            {/* Row 1: Batch count + completion % */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Batches Completed:
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {completedBatches}
                </Typography>
                {successBatches !== null && (
                  <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 600 }}>· {successBatches} succeeded</Typography>
                )}
                {failedBatches > 0 && (
                  <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 600 }}>· {failedBatches} failed</Typography>
                )}
              </Box>
              <Typography variant="caption" sx={{ color: statusColor, fontWeight: 700, fontSize: '0.85rem' }}>
                {completionPct}%{outcome.kind === 'completed' ? ' ✓' : ''}
              </Typography>
            </Box>

            {/* Row 2: Instrument breakdown */}
            {totalInstruments > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Instruments Processed:
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {Math.min(totalInstrumentsProcessed, totalInstruments).toLocaleString()} of {totalInstruments.toLocaleString()}
                </Typography>
                {pageSize > 0 && (
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    · batch size {pageSize}
                  </Typography>
                )}
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
                variant={running ? 'buffer' : 'determinate'}
                value={completionPct}
                valueBuffer={Math.min(100, completionPct + (running ? 5 : 0))}
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
                  <Box key={b.jobId ?? i} sx={{
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
              {running ? 'Waiting for batch data…' : 'No per-batch log for this run.'}
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
// What a model row shows as its execution status. The service keeps one latest run per model type,
// so a row only takes that run's status when the model could have been part of it.
const uploadDay = (row) => {
  const t = Date.parse(row.uploadDate);
  return Number.isFinite(t) ? new Date(t).toISOString().slice(0, 10) : null;
};
const rowExecutionStatus = (row, run, awaiting) => {
  const type = runTypeOf(row.modelType);
  if (row.modelStatus !== 'ACTIVE') {
    return { status: 'NOT_INCLUDED', tooltip: 'Inactive models are not executed. Activate the model to include it in the next run.' };
  }
  if (awaiting) return { status: 'STARTING', tooltip: `A ${type} run was just started — waiting for it to appear.` };
  if (!run) return { status: 'NOT_EXECUTED', tooltip: `No ${type} run has been recorded yet.` };
  const started = runTime(run);
  const uploaded = uploadDay(row);
  // Uploaded on a later day than the run started: it can't have been part of that run.
  if (uploaded && Number.isFinite(started) && uploaded > new Date(started).toISOString().slice(0, 10)) {
    return { status: 'NOT_EXECUTED', tooltip: `Uploaded after the latest ${type} run started — it runs in the next one.` };
  }
  const status = executionStatusOf(run);
  const date = run.postingDate ? ` (posting date ${postingKey(run.postingDate).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')})` : '';
  return { status, tooltip: `Status of the latest ${type} run${date}, which covers every active ${type} model.` };
};

function Row({ row, onToggleStatus, onDownload, onExecute, run, awaiting, runBusy, execRefreshKey }) {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const { tenant } = useTenant();
  const display = rowExecutionStatus(row, run, awaiting);
  const summarySeq = useRef(0);

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
    const seq = ++summarySeq.current;
    setRowSummaryLoading(true);
    const modelType = row.modelType === 'DSL' ? 'PYTHON' : row.modelType;
    dataloaderApi.get(
      `/model/execution-summary${modelType ? `?modelType=${modelType}` : ''}`,
      { headers: { 'X-Tenant': tenant } }
    ).then(res => {
      if (seq !== summarySeq.current) return; // a newer request owns the summary
      setRowSummary(usableSummary(res.data));
      setFetchedFor(row.id);
    }).catch(() => {
      if (seq === summarySeq.current) setRowSummary(null);
    }).finally(() => {
      if (seq === summarySeq.current) setRowSummaryLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execRefreshKey]);

  const handleExpand = async () => {
    const next = !open;
    setOpen(next);
    // Fetch summary on expand; cache is cleared after each execution
    if (next && fetchedFor !== row.id && tenant) {
      const seq = ++summarySeq.current;
      setRowSummaryLoading(true);
      const modelType = row.modelType === 'DSL' ? 'PYTHON' : row.modelType;
      try {
        const res = await dataloaderApi.get(
          `/model/execution-summary${modelType ? `?modelType=${modelType}` : ''}`,
          { headers: { 'X-Tenant': tenant } }
        );
        if (seq === summarySeq.current) setRowSummary(usableSummary(res.data));
      } catch {
        if (seq === summarySeq.current) setRowSummary(null);
      } finally {
        if (seq === summarySeq.current) {
          setRowSummaryLoading(false);
          setFetchedFor(row.id);
        }
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
  const batchStatus = failedBatches === 0 ? 'SUCCESS' : successBatches === 0 ? 'FAILED' : 'PARTIAL_SUCCESS';
  // The summary's batches can all succeed while the run itself failed (e.g. after the batches):
  // when it is the latest run's posting date, that run's outcome decides the summary's status.
  const sameRun = Boolean(rowSummary && run && !isRunActive(run)
    && postingKey(rowSummary.postingDate) && postingKey(rowSummary.postingDate) === postingKey(run.postingDate));
  const runFinal = sameRun ? finalStatusOf(run) : null;
  const overallStatus = !rowSummary ? null
    : runFinal === 'FAILED' ? 'FAILED'
      : runFinal === 'STOPPED' ? 'STOPPED'
        : runFinal === 'PARTIAL_SUCCESS' && batchStatus === 'SUCCESS' ? 'PARTIAL_SUCCESS'
          : batchStatus;
  const summaryFromOtherRun = Boolean(rowSummary && run && postingKey(rowSummary.postingDate)
    && postingKey(run.postingDate) && postingKey(rowSummary.postingDate) !== postingKey(run.postingDate));
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
        <TableCell><StatusChip status={display.status} tooltip={display.tooltip} /></TableCell>
        <TableCell sx={{ color: 'text.secondary' }}>{row.uploadedBy || '—'}</TableCell>

        <TableCell onClick={(e) => e.stopPropagation()} align="center">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Tooltip title={runBusy
              ? `A ${runTypeOf(row.modelType)} run is in progress — wait for it to finish`
              : `Execute ${row.modelType || 'Model'}`}>
              <span>
                <IconButton
                  size="small"
                  onClick={handleExecute}
                  disabled={row.modelStatus !== 'ACTIVE' || runBusy}
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
                          label={overallStatus.replace(/_/g, ' ')}
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
                  {(summaryFromOtherRun || display.status === 'NOT_INCLUDED' || display.status === 'NOT_EXECUTED') && (
                    <Typography variant="caption" display="block" sx={{ color: '#b45309', mb: 1.5, fontWeight: 600 }}>
                      {display.status === 'NOT_INCLUDED'
                        ? 'This model is inactive: the summary below is for the latest run of its model type, which did not include it.'
                        : display.status === 'NOT_EXECUTED'
                          ? 'This model has not run yet: the summary below is for an earlier run of its model type.'
                          : `This summary is for posting date ${fmtDate(rowSummary.postingDate)}; the latest run (posting date ${fmtDate(run.postingDate)}) is ${executionStatusOf(run).replace(/_/g, ' ').toLowerCase()}.`}
                    </Typography>
                  )}

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

  // Latest run record per run type ('DSL' | 'EXCEL') — the one poll shared by the table and the
  // progress panels.
  const [latestRuns, setLatestRuns] = useState(null);
  const pollSeq = useRef(0);
  // Poll health: failures in a row and the time of the last successful poll.
  const [pollHealth, setPollHealth] = useState({ failures: 0, lastOkAt: null });
  // A run just started from this page, per type, until its record appears: { since, sig }.
  const [awaiting, setAwaiting] = useState({});

  const refreshExecutionStatuses = useCallback(async () => {
    const seq = ++pollSeq.current;
    try {
      const res = await dataloaderApi.get('/model/executions/latest');
      if (seq !== pollSeq.current) return; // a newer poll was started; ignore this older answer
      const runs = res.data || {};
      // Same run states → keep the same object, so the table doesn't re-render on every poll.
      setLatestRuns(prev => (prev && runSignature(prev.DSL) === runSignature(runs.DSL)
        && runSignature(prev.EXCEL) === runSignature(runs.EXCEL) ? prev : runs));
      setPollHealth({ failures: 0, lastOkAt: new Date() });
    } catch {
      if (seq !== pollSeq.current) return;
      setPollHealth(prev => ({ ...prev, failures: prev.failures + 1 }));
    }
  }, []);
  const statusOfType = (type) => (latestRuns ? executionStatusOf(latestRuns[type]) : null);

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

  // A started run is waited for until its record appears (a new record, or the old one running
  // again), for at most a minute.
  useEffect(() => {
    const types = Object.keys(awaiting);
    if (!types.length) return undefined;
    const done = types.filter((t) => {
      const run = latestRuns?.[t];
      return Date.now() - awaiting[t].since > 60000 || runSignature(run) !== awaiting[t].sig || isRunActive(run);
    });
    if (done.length) setAwaiting(prev => Object.fromEntries(Object.entries(prev).filter(([t]) => !done.includes(t))));
    const timer = setTimeout(() => setAwaiting(prev => ({ ...prev })), 60000); // re-check the timeout
    return () => clearTimeout(timer);
  }, [awaiting, latestRuns]);

  // Real-time polling: 2s while a run is in progress (or just started), 8s otherwise. The timer only
  // restarts when that rate changes, not on every poll. Hidden tabs don't poll; showing the tab
  // again polls straight away.
  const anyRunning = ['DSL', 'EXCEL'].some(t => isRunActive(latestRuns?.[t])) || Object.keys(awaiting).length > 0;
  useEffect(() => {
    const poll = () => { if (!document.hidden) refreshExecutionStatuses(); };
    const timer = setInterval(poll, anyRunning ? 2000 : 8000);
    const onVisible = () => { if (!document.hidden) refreshExecutionStatuses(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [refreshExecutionStatuses, anyRunning]);

  // Open rows re-fetch their summary whenever a run record changes and isn't running — a run that
  // ended, or a new finished run (also short ones and runs started elsewhere).
  const prevSigRef = useRef(null);
  useEffect(() => {
    if (!latestRuns) return;
    const sigs = { DSL: runSignature(latestRuns.DSL), EXCEL: runSignature(latestRuns.EXCEL) };
    const prev = prevSigRef.current;
    prevSigRef.current = sigs;
    if (!prev) return; // first look: nothing has changed yet
    const changed = ['DSL', 'EXCEL'].some(t => sigs[t] !== prev[t] && !isRunActive(latestRuns[t]));
    if (changed) setExecRefreshKey(k => k + 1);
  }, [latestRuns]);

  // --- Action handlers ---

  const handleRefresh = () => {
    fetchModels();
    setExecRefreshKey(k => k + 1); // open summaries reload too
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

  // The run record of the type as it was before this execution (to recognise the new run).
  const executeBaseline = useRef(null);
  const handleExecuteOpen = (model) => {
    const type = runTypeOf(model?.modelType);
    executeBaseline.current = { type, sig: runSignature(latestRuns?.[type]) };
    setSelectedModelType(model?.modelType ?? null);
    setExecuteOpen(true);
  };

  const handleExecuteClose = (started) => {
    if (started && executeBaseline.current) {
      // Until the new run's record shows up, its rows read STARTING and polling is fast. The record
      // is compared with how it was before the run (it may already have appeared, or even finished).
      const { type, sig } = executeBaseline.current;
      if (runSignature(latestRuns?.[type]) === sig) {
        setAwaiting(prev => ({ ...prev, [type]: { since: Date.now(), sig } }));
      }
    }
    executeBaseline.current = null;
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
  const lastPage = Math.max(0, Math.ceil(rows.length / rowsPerPage) - 1);
  const currentPage = Math.min(page, lastPage);
  const paginatedRows = rows.slice(currentPage * rowsPerPage, currentPage * rowsPerPage + rowsPerPage);

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

        {/* 2. Status updates failing */}
        {pollHealth.failures >= 2 && (
          <Alert
            severity="warning"
            sx={{ mb: 2, borderRadius: 2 }}
            action={<Typography component="span" onClick={refreshExecutionStatuses} sx={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', mr: 1, textDecoration: 'underline' }}>Retry now</Typography>}
          >
            Live status updates are failing{pollHealth.lastOkAt ? ` — last updated ${pollHealth.lastOkAt.toLocaleTimeString()}` : ''}. Execution statuses shown may be out of date. Retrying automatically.
          </Alert>
        )}

        {/* 3. Live Progress Panels */}
        {(() => {
          const runs = Object.values(latestRuns || {}).filter(Boolean);
          if (!runs.length) return null;
          const active = runs.filter(isRunActive);
          const shown = active.length ? active : [latestRunOf(runs)];
          return shown.map(run => (
            <ExecutionProgressPanel key={run._id ?? run.id ?? runTypeOf(upper(run.modelType))} run={run} pollAt={pollHealth.lastOkAt} />
          ));
        })()}

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
                        <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Execution Order</TableCell>
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
                            run={latestRuns?.[runTypeOf(row.modelType)]}
                            awaiting={Boolean(awaiting[runTypeOf(row.modelType)])}
                            runBusy={statusOfType(runTypeOf(row.modelType)) === 'IN_PROGRESS' || Boolean(awaiting[runTypeOf(row.modelType)])}
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
                    page={currentPage}
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