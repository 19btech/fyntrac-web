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
  DialogContent, DialogTitle,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';

// Icons
import RefreshIcon from '@mui/icons-material/Refresh';
import UploadIcon from '@mui/icons-material/Upload';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DownloadIcon from '@mui/icons-material/Download';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LayersIcon from '@mui/icons-material/Layers';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';

// API & Context
import { dataloaderApi } from '../services/api-client';
import { useTenant } from '../tenant-context';

// Dialog components
import ModelUploadComponent from '../component/model-upload';
import ExecuteModel from '../component/execute-model';

// --- HELPERS ---

const formatDate = (isoString) => {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('en-CA');
};

const StatusChip = ({ status }) => {
  const isSuccess = status === 'ACTIVE' || status === 'COMPLETED';
  const isError = status === 'FAILED';
  const isIdle = status === 'IDLE' || status === 'INACTIVE' || status === 'CONFIGURE';

  let bg = alpha('#22c55e', 0.1);
  let color = '#166534';
  let border = alpha('#22c55e', 0.2);

  if (isError) {
    bg = alpha('#ef4444', 0.1);
    color = '#991b1b';
    border = alpha('#ef4444', 0.2);
  } else if (isIdle) {
    bg = alpha('#64748b', 0.1);
    color = '#334155';
    border = alpha('#64748b', 0.2);
  } else if (!isSuccess && !isError) {
    bg = alpha('#3b82f6', 0.1);
    color = '#1e40af';
    border = alpha('#3b82f6', 0.2);
  }

  return (
    <Chip
      label={status || '—'}
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

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <Box sx={{
      flex: 1, minWidth: 130, p: 2, borderRadius: 2,
      bgcolor: bg || 'rgba(99,102,241,0.06)',
      display: 'flex', alignItems: 'center', gap: 1.5
    }}>
      <Box sx={{
        width: 38, height: 38, borderRadius: '50%',
        bgcolor: color ? `${color}18` : 'rgba(99,102,241,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <Icon sx={{ fontSize: 20, color: color || '#6366f1' }} />
      </Box>
      <Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, lineHeight: 1 }}>{label}</Typography>
        <Typography variant="h6" sx={{ fontWeight: 700, color: color || 'text.primary', lineHeight: 1.3 }}>{value ?? '—'}</Typography>
      </Box>
    </Box>
  );
}

function ExecutionSummaryPanel() {
  const theme = useTheme();
  const { tenant } = useTenant();
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  const fetchSummary = useCallback(async () => {
    if (!tenant) return;
    try {
      const res = await dataloaderApi.get('/model/execution-summary', {
        headers: { 'X-Tenant': tenant }
      });
      // Find the most recent EXECUTION_SUMMARY entry if response is an array,
      // or use directly if it's the aggregated object.
      const data = res.data;
      setSummary(Array.isArray(data) ? data[0] : data);
    } catch (e) {
      setSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    const timer = setInterval(fetchSummary, 15000);
    return () => clearInterval(timer);
  }, [fetchSummary]);

  const cfg = summary?.statusCounts
    ? (Object.keys(summary.statusCounts).length === 1 && summary.statusCounts['SUCCESS']
      ? SUMMARY_STATUS_CONFIG.SUCCESS
      : summary.statusCounts['FAILED'] ? SUMMARY_STATUS_CONFIG.FAILED : SUMMARY_STATUS_CONFIG.PARTIAL_SUCCESS)
    : SUMMARY_STATUS_CONFIG.SUCCESS;

  const fmtMs = (ms) => {
    if (!ms && ms !== 0) return '—';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const fmtDate = (d) => {
    if (!d) return '—';
    const s = String(d);
    if (s.length === 8) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
    return s;
  };

  if (loadingSummary) return (
    <Box sx={{ mb: 3, p: 2, borderRadius: 3, bgcolor: 'background.paper', boxShadow: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <CircularProgress size={18} />
      <Typography variant="body2" color="text.secondary">Loading execution summary…</Typography>
    </Box>
  );

  if (!summary || (!summary.totalBatches && !summary.totalInstruments)) return (
    <Box sx={{ mb: 3, p: 2.5, borderRadius: 3, bgcolor: 'background.paper', boxShadow: 1, border: '1px dashed', borderColor: 'divider' }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
        No execution summary available for the current execution date.
      </Typography>
    </Box>
  );

  const successBatches = summary.statusCounts?.SUCCESS ?? summary.totalSuccess ?? 0;
  const failedBatches = summary.statusCounts?.FAILED ?? summary.totalFailed ?? 0;
  const overallStatus = failedBatches === 0 ? 'SUCCESS' : successBatches === 0 ? 'FAILED' : 'PARTIAL_SUCCESS';
  const statusCfg = SUMMARY_STATUS_CONFIG[overallStatus] || SUMMARY_STATUS_CONFIG.SUCCESS;
  const StatusIcon = statusCfg.icon;

  return (
    <Box sx={{
      mb: 3, p: 2.5, borderRadius: 3, bgcolor: 'background.paper',
      boxShadow: `0 2px 8px ${alpha(theme.palette.grey[400], 0.18)}`,
      border: `1.5px solid ${alpha(statusCfg.color, 0.2)}`,
    }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StatusIcon sx={{ color: statusCfg.color, fontSize: 22 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Last Execution Summary
          </Typography>
          <Chip
            label={overallStatus.replace('_', ' ')}
            size="small"
            sx={{
              fontWeight: 700, fontSize: '0.68rem', borderRadius: 1, height: 22,
              bgcolor: statusCfg.bg, color: statusCfg.color,
              border: `1px solid ${alpha(statusCfg.color, 0.3)}`
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Posting Date: <strong>{fmtDate(summary.postingDate)}</strong>
          </Typography>
          <Tooltip title="Refresh summary">
            <IconButton size="small" onClick={fetchSummary}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Stat Cards */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        <StatCard
          icon={LayersIcon}
          label="Total Batches"
          value={summary.totalBatches ?? 0}
          color="#6366f1"
        />
        <StatCard
          icon={FiberManualRecordIcon}
          label="Instruments"
          value={(summary.totalInstruments ?? 0).toLocaleString()}
          color="#0ea5e9"
        />
        <StatCard
          icon={CheckCircleOutlineIcon}
          label="Successful Batches"
          value={successBatches}
          color="#16a34a"
        />
        <StatCard
          icon={ErrorOutlineIcon}
          label="Failed Batches"
          value={failedBatches}
          color={failedBatches > 0 ? '#dc2626' : '#94a3b8'}
        />
        <StatCard
          icon={AccessTimeIcon}
          label="Total Duration"
          value={fmtMs(summary.totalDurationMs)}
          color="#7c3aed"
        />
        <StatCard
          icon={AccessTimeIcon}
          label="Avg Batch Time"
          value={fmtMs(summary.avgBatchMs)}
          color="#0891b2"
        />
      </Box>

      {/* Errors */}
      {summary.errors?.length > 0 && (
        <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.15)' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#dc2626' }}>Errors:</Typography>
          {summary.errors.map((e, i) => (
            <Typography key={i} variant="caption" display="block" sx={{ color: '#991b1b', mt: 0.5, fontSize: '0.72rem' }}>
              • {e}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
}

// Live Execution Progress Panel
function ExecutionProgressPanel() {
  const theme = useTheme();
  const { tenant } = useTenant();
  const [progress, setProgress] = useState(null);  // /execution-progress data
  const [batches, setBatches] = useState([]);     // /execution-summary batches[]
  const [isLive, setIsLive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const prevCompleted = useRef(0);
  const [isRunning, setIsRunning] = useState(false);
  const stablePolls = useRef(0);

  const poll = useCallback(async () => {
    if (!tenant) return;
    try {
      // Single call — /execution-progress now includes batches[] too.
      // Count queries only; no full document loads during polling.
      const res = await dataloaderApi.get('/model/execution-progress', {
        headers: { 'X-Tenant': tenant }
      });
      const p = res.data;

      const completed = p?.completedBatches ?? 0;
      if (completed !== prevCompleted.current) {
        stablePolls.current = 0;
        setIsRunning(true);
      } else if (!p?.isComplete) {
        stablePolls.current += 1;
        if (stablePolls.current >= 3) setIsRunning(false);
      } else {
        setIsRunning(false);
      }
      prevCompleted.current = completed;

      setProgress(p);
      setBatches(p?.batches ?? []);
      setLastUpdated(new Date());
    } catch { /* silent — never block the UI */ }
  }, []);

  useEffect(() => {
    poll();
    if (!isLive) return;
    // Adaptive interval: poll faster while actively running, back off when idle
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
    successBatches = 0, failedBatches = 0, isComplete = false, pageSize = 0 } = progress;

  const statusColor = isRunning ? '#6366f1' : failedBatches > 0 ? '#dc2626' : '#16a34a';
  const statusLabel = isRunning ? 'Running…'
    : isComplete ? (failedBatches > 0 ? 'Completed with errors' : 'Completed')
      : completedBatches === 0 ? 'Idle' : 'Partial';

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
                  {completedBatches} of {totalExpectedBatches || '?'}
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

            <Tooltip
              title={`${completionPct}% = ${completedBatches} completed batches ÷ ${totalExpectedBatches} expected batches (${totalInstruments} instruments ÷ ${pageSize} batch size)`}
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
              Waiting for batch data…
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
          alignItems: 'center'
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
function Row({ row, onToggleStatus, onDownload, onExecute }) {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const { tenant } = useTenant();

  // Lazy-fetch summary when row is first expanded
  const [rowSummary, setRowSummary] = useState(null);
  const [rowSummaryLoading, setRowSummaryLoading] = useState(false);
  const [fetchedFor, setFetchedFor] = useState(null);

  const handleExpand = async () => {
    const next = !open;
    setOpen(next);
    // Only fetch once per row (keyed by model id)
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
        <TableCell><StatusChip status={null} /></TableCell>
        <TableCell sx={{ color: 'text.secondary' }}>{row.uploadedBy || '—'}</TableCell>

        <TableCell onClick={(e) => e.stopPropagation()} align="center">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Tooltip title={`Execute ${row.modelType || 'Model'}`}>
              <IconButton size="small" color="primary" onClick={handleExecute} disabled={row.modelStatus !== 'ACTIVE'}>
                <PlayArrowIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download">
              <IconButton size="small" onClick={handleDownload} disabled={!row.modelFileId}>
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={row.modelStatus === 'ACTIVE' ? 'Set Inactive' : 'Set Active'}>
              <Switch
                size="small"
                checked={row.modelStatus === 'ACTIVE'}
                onChange={handleToggle}
              />
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" color="error" disabled>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
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

  // --- Data fetching ---
  const fetchModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dataloaderApi.get('/model/get/all');
      setRows(response.data || []);
    } catch (err) {
      console.error('Failed to fetch models:', err);
      setError('Failed to load models. Please try again.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

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
            <Tooltip title="Run Model (select a model row to pick type)">
              <IconButton
                sx={{ bgcolor: 'white', boxShadow: 1, '&:hover': { bgcolor: 'grey.50' } }}
                onClick={() => handleExecuteOpen(null)}
              >
                <PlayCircleOutlineIcon color="action" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Upload Model">
              <IconButton
                sx={{ bgcolor: 'white', boxShadow: 1, '&:hover': { bgcolor: 'grey.50' } }}
                onClick={() => setUploadOpen(true)}
              >
                <UploadIcon color="action" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton
                sx={{ bgcolor: 'white', boxShadow: 1, '&:hover': { bgcolor: 'grey.50' } }}
                onClick={handleRefresh}
              >
                <RefreshIcon color="action" />
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
      >
        <DialogTitle>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
            }}
          >
            {/* Top Left: Logo and Title */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 1,
                width: 'fit-content'
              }}
            >
              <img
                src="fyntrac.png"
                alt="Logo"
                style={{
                  width: '120px', // Slightly larger for the 'md' dialog
                  height: 'auto',
                  maxWidth: '100%'
                }}
              />
              <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1 }}>
                Model Upload
              </Typography>
            </Box>

            {/* Top Right: Close Button */}
            <Tooltip title="Close">
              <IconButton
                onClick={handleUploadClose}
                edge="end"
                aria-label="close"
                sx={{
                  color: 'grey.500',
                  '&:hover': { color: 'error.main' },
                }}
              >
                <HighlightOffOutlinedIcon fontSize="large" />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 4 }}>
          <ModelUploadComponent
            onDrop={() => { }} // You can pass handleUploadClose here if you want it to close after drop
            text="Drag and drop model file here or click to browse"
            // Assuming your component supports these based on your reference code
            iconColor="#3f51b5"
            borderColor="#3f51b5"
          />
        </DialogContent>
      </Dialog>

      {/* Execute Dialog */}
      <ExecuteModel open={executeOpen} onClose={handleExecuteClose} modelType={selectedModelType} />

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Box>
  );
}