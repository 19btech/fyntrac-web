"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Collapse,
  Tooltip,
  useTheme,
  alpha,
  Container,
  Divider,
  Slide,
  Snackbar,
  Alert,
  CircularProgress,
  TextField,
  Button,
  Badge,
  Stack,
} from '@mui/material';

// Icons
import CachedRoundedIcon from '@mui/icons-material/CachedRounded';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import DatasetOutlinedIcon from '@mui/icons-material/DatasetOutlined';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { DataGrid } from '@mui/x-data-grid';

import { useTenant } from "../tenant-context";
import { dataloaderApi } from '../services/api-client';
import FileUploadComponent from '../component/file-upload';

// --- HELPERS ---

// 1. Date Only (YYYY-MM-DD)
const formatDate = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const text = String(value);
  const dateOnly = /^(\d{4})-?(\d{2})-?(\d{2})$/.exec(text);
  if (dateOnly) return `${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}`;
  const d = new Date(text);
  return Number.isNaN(d.getTime()) ? text : d.toLocaleDateString('en-CA');
};

// Load statuses that are still running (the page re-checks them until they finish).
const RUNNING_STATUSES = new Set(['STARTING', 'STARTED', 'RUNNING', 'IN_PROGRESS', 'PROCESSING', 'STOPPING']);
const isRunningLoad = (row) => RUNNING_STATUSES.has(String(row?.activityStatus || '').toUpperCase());

// Validation issues: a stable key per issue. Without an id, the job, row, field, code and time
// identify it (so resolving one never hides an issue from another upload); exact repeats get #n.
const withKeys = (logs) => {
  const seen = new Map();
  return (Array.isArray(logs) ? logs : []).map((r) => {
    const base = r.id != null
      ? String(r.id)
      : [r.jobId, r.rowNumber, r.fieldName, r.errorCode, r.createdAt].map((v) => v ?? '').join('|');
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return { ...r, __key: n ? `${base}#${n}` : base };
  });
};

const isErrorLog = (r) => r.validationType === 'ERROR' || (r.validationType !== 'WARNING' && r.errorCode?.startsWith('ERR'));

// CSV cell: quoted, and text a spreadsheet would run as a formula is kept as text.
const csvCell = (value) => {
  let s = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s) && !/^[+-]?\d+(\.\d+)?$/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

// 2. Date & Time (YYYY-MM-DD, HH:MM)
// ✅ FIXED: Added this missing function
const formatDateTime = (isoString) => {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

const StatusChip = ({ status }) => {
  const isSuccess = status === 'COMPLETED';
  const isError = status === 'FAILED';

  let bg = alpha('#22c55e', 0.1);
  let color = '#166534';
  let border = alpha('#22c55e', 0.2);

  if (isError) {
    bg = alpha('#ef4444', 0.1);
    color = '#991b1b';
    border = alpha('#ef4444', 0.2);
  } else if (!isSuccess && !isError) {
    bg = alpha('#3b82f6', 0.1);
    color = '#1e40af';
    border = alpha('#3b82f6', 0.2);
  }

  return (
    <Chip
      label={status || 'UNKNOWN'}
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

function Row({ row, isExpandedDefault = false }) {
  const [open, setOpen] = useState(isExpandedDefault);
  const theme = useTheme();

  const hasDetails = row.details && row.details.length > 0;
  const hasErrors = hasDetails && row.details.some(d => d.errorMessage);

  return (
    <>
      <TableRow
        sx={{
          '& > *': { borderBottom: 'unset' },
          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
          transition: 'background-color 0.2s'
        }}
      >
        <TableCell width={60}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
            sx={{
              bgcolor: open ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
              color: open ? 'primary.main' : 'action.active'
            }}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>

        <TableCell component="th" scope="row" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {row.uploadId}
        </TableCell>
        <TableCell sx={{ color: 'text.secondary' }}>{row.jobName}</TableCell>

        {/* Uses formatDate for posting date (Date Only) */}
        <TableCell align="center" sx={{ color: 'text.secondary' }}>
          {row.postingDate ? formatDate(row.postingDate) : '-'}
        </TableCell>

        {/* Uses formatDateTime for timestamps */}
        <TableCell align="center" sx={{ color: 'text.secondary' }}>{formatDateTime(row.starting)}</TableCell>
        <TableCell align="center" sx={{ color: 'text.secondary' }}>{formatDateTime(row.endTime)}</TableCell>

        <TableCell align="center">
          <StatusChip status={row.activityStatus} />
        </TableCell>

        <TableCell sx={{ color: 'text.secondary' }}>{row.fileName || '-'}</TableCell>
      </TableRow>

      {/* Expanded Detail View */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 3, ml: 9, p: 2, bgcolor: alpha(theme.palette.grey[50], 0.5), borderRadius: 2, border: `1px dashed ${theme.palette.divider}` }}>

              {hasDetails ? (
                <>
                  <Typography variant="subtitle2" gutterBottom component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', fontWeight: 700 }}>
                    Processing Details
                  </Typography>
                  <Card variant="outlined" sx={{ mt: 2, overflow: 'hidden', borderRadius: 2, boxShadow: 0 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Table Name</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>File Name</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>Read</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>Written</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>Skipped</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>Duration</TableCell>
                          {hasErrors && (
                            <TableCell align="left" sx={{ fontWeight: 600 }}>Error</TableCell>
                          )}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {row.details.map((detail, index) => {
                          // Calculate duration simply by showing time range
                          const start = formatDateTime(detail.starting).split(',')[1] || '';
                          const end = formatDateTime(detail.endTime).split(',')[1] || '';

                          return (
                            <TableRow key={index}>
                              <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                                {detail.tableName}
                              </TableCell>
                              <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                                {detail.fileName}
                              </TableCell>
                              <TableCell align="center">{detail.recordsRead}</TableCell>
                              <TableCell align="center">{detail.recordsWritten}</TableCell>
                              <TableCell align="center">{detail.recordsSkipped}</TableCell>
                              <TableCell align="center" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                {start} - {end}
                              </TableCell>

                              {hasErrors && (
                                <TableCell align="left" sx={{ fontSize: '0.75rem', maxWidth: 200, wordWrap: 'break-word' }}>
                                  {detail.errorMessage ? (
                                    <Typography variant="caption" color="error.main" fontWeight={600}>
                                      {detail.errorMessage}
                                    </Typography>
                                  ) : (
                                    <Typography variant="caption" color="text.disabled">-</Typography>
                                  )}
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Card>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
                  No detailed records available.
                </Typography>
              )}

            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

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

function ValidationNoRows({ severityFilter, context, error, onRetry }) {
  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', py: 6, gap: 1.5 }}>
        <WarningAmberOutlinedIcon sx={{ color: '#dc2626', fontSize: 32 }} />
        <Box sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#991b1b' }}>Validation issues could not be loaded.</Box>
        <Box sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{error}</Box>
        {onRetry && <Button size="small" variant="outlined" onClick={onRetry}>Retry</Button>}
      </Box>
    );
  }
  const msgs = {
    rules: {
      all: 'All accounting rules are valid — no issues detected.',
      error: 'No errors in your accounting rules.',
      warning: 'No warnings to review for accounting rules.',
    },
    journal: {
      all: 'All journal mappings are configured correctly — no issues found.',
      error: 'No errors in your journal mappings.',
      warning: 'No warnings in your journal mappings.',
    },
    ingest: {
      all: 'All records passed validation for the selected period.',
      error: 'No errors found for the selected period.',
      warning: 'No warnings found for the selected period.',
    },
  };
  const text = msgs[context]?.[severityFilter] ?? 'No records found.';
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', py: 6, color: 'text.secondary' }}>
      <Box sx={{ fontSize: '2rem', mb: 1 }}>✓</Box>
      <Box sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{text}</Box>
    </Box>
  );
}

// --- MAIN PAGE ---
export default function IngestPage() {
  const theme = useTheme();
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [recentUpload, setRecentUpload] = useState(null);
  const [historicalUpload, setHistoricalUpload] = useState([]);
  const [openFileUpload, setOpenFileUpload] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { tenant, user } = useTenant();
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const showToast = (message, severity = 'success') => setToast({ open: true, message, severity });
  const handleToastClose = (_, reason) => { if (reason === 'clickaway') return; setToast(p => ({ ...p, open: false })); };

  // ── Validation Log ──────────────────────────────────────────────────────────
  const [openValidationLog, setOpenValidationLog] = React.useState(false);
  // #6: every issue (badge, warning strip) vs. the issues shown in the dialog (with its filters).
  const [allLogs, setAllLogs] = React.useState([]);
  const [validationLogs, setValidationLogs] = React.useState([]);
  const [validationLogsLoading, setValidationLogsLoading] = React.useState(false);
  const [validationError, setValidationError] = React.useState('');
  const [issuesCheckFailed, setIssuesCheckFailed] = React.useState(false);
  const [uploadBusy, setUploadBusy] = React.useState(false);

  const [filterInstrumentId, setFilterInstrumentId] = React.useState('');
  const [filterAttributeId, setFilterAttributeId] = React.useState('');
  const [filterPostingDate, setFilterPostingDate] = React.useState('');

  const filtersActive = Boolean(filterInstrumentId.trim() || filterAttributeId.trim() || filterPostingDate.trim());
  const fetchValidationLogs = React.useCallback(() => {
    setValidationLogsLoading(true);
    setValidationError('');
    let url = '/validation-logs/activity';
    const params = new URLSearchParams();
    if (filterInstrumentId.trim()) params.append('instrumentId', filterInstrumentId.trim());
    if (filterAttributeId.trim()) params.append('attributeId', filterAttributeId.trim());
    if (filterPostingDate.trim()) params.append('postingDate', filterPostingDate.trim().replace(/-/g, ''));
    const filtered = Boolean(params.toString());

    if (filtered) {
      url += `?${params.toString()}`;
    }

    dataloaderApi.get(url)
      .then(res => {
        const logs = withKeys(res.data ?? []);
        setValidationLogs(logs);
        // Unfiltered results are also the page-wide list.
        if (!filtered) { setAllLogs(logs); setIssuesCheckFailed(false); }
      })
      .catch(err => {
        console.error('Failed to fetch validation logs:', err);
        setValidationLogs([]);
        setValidationError(err?.response?.data?.message || err?.message || 'Please try again.');
      })
      .finally(() => setValidationLogsLoading(false));
  }, [filterInstrumentId, filterAttributeId, filterPostingDate]);

  const handleOpenValidationLog = () => {
    setOpenValidationLog(true);
    setSeverityFilter('all');
    fetchValidationLogs();
  };

  const [stripDismissed, setStripDismissed] = React.useState(false);

  const resolvedKey = `resolved_INGEST.${tenant || 'default'}.${user?.id || user?.email || 'anon'}`;
  const [resolvedIds, setResolvedIds] = React.useState(() => new Set());
  useEffect(() => {
    try { setResolvedIds(new Set(JSON.parse(localStorage.getItem(resolvedKey) ?? '[]'))); }
    catch { setResolvedIds(new Set()); }
  }, [resolvedKey]);
  const saveResolved = (next) => {
    try { localStorage.setItem(resolvedKey, JSON.stringify([...next])); } catch { }
  };

  // Shown in the dialog (filters apply) and page-wide (badge / strip).
  const unresolvedLogs = React.useMemo(() =>
    validationLogs.filter(r => !resolvedIds.has(r.__key)),
    [validationLogs, resolvedIds]
  );
  const allUnresolved = React.useMemo(() =>
    allLogs.filter(r => !resolvedIds.has(r.__key)),
    [allLogs, resolvedIds]
  );

  const [severityFilter, setSeverityFilter] = React.useState('all');

  const filteredLogs = React.useMemo(() => {
    if (severityFilter === 'all') return unresolvedLogs;
    return unresolvedLogs.filter(r => (severityFilter === 'error' ? isErrorLog(r) : r.validationType === 'WARNING'));
  }, [unresolvedLogs, severityFilter]);

  const validationIssueCount = allUnresolved.length;
  const hasValidationIssues = validationIssueCount > 0;

  // #11: the warning strip comes back when new issues appear.
  const lastIssueCount = useRef(0);
  useEffect(() => {
    if (validationIssueCount > lastIssueCount.current) setStripDismissed(false);
    lastIssueCount.current = validationIssueCount;
  }, [validationIssueCount]);

  const recheckValidationIssues = React.useCallback(() => {
    if (!tenant) return;
    dataloaderApi.get('/validation-logs/activity')
      .then(res => {
        setAllLogs(withKeys(res.data ?? []));
        setIssuesCheckFailed(false);
      })
      .catch(() => setIssuesCheckFailed(true)); // the badge says the check failed instead of "no issues"
  }, [tenant]);

  useEffect(() => { recheckValidationIssues(); }, [recheckValidationIssues]);

  const handleMarkResolved = (row) => {
    setResolvedIds(prev => {
      const next = new Set(prev);
      next.add(row.__key);
      saveResolved(next);
      return next;
    });
  };

  // Marks the issues listed in the dialog (only the filtered ones when filters are applied).
  const handleMarkAllResolved = () => {
    const count = unresolvedLogs.length;
    setResolvedIds(prev => {
      const next = new Set(prev);
      unresolvedLogs.forEach(r => next.add(r.__key));
      saveResolved(next);
      return next;
    });
    showToast(`${count} issue${count !== 1 ? 's' : ''} marked as resolved.`, 'success');
  };

  const downloadErrorReport = () => {
    const headers = ['Row #', 'Type', 'Field', 'Rejected Value', 'Instrument ID', 'Attribute ID', 'Posting Date', 'Error Code', 'Message', 'Job ID', 'Timestamp'];
    const rows = filteredLogs.map(r => [
      r.rowNumber,
      r.validationType,
      r.fieldName,
      r.rejectedValue,
      r.instrumentId,
      r.attributeId,
      r.postingDate,
      r.errorCode,
      r.errorMessage,
      r.jobId,
      r.createdAt ? new Date(r.createdAt).toLocaleString() : '',
    ]);
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation-issues-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const baseURL = "";
  const fetchUploadActivityCall = `${baseURL}/activitylog/get/recent/loads`;

  const headers = {
    'X-Tenant': tenant,
    'X-User-Id': user?.id || '',
    Accept: '*/*',
  };

  const fetchUploadActivitiyLogs = ({ quiet = false } = {}) => {
    if (!quiet) setIsRefreshing(true);
    dataloaderApi.get(fetchUploadActivityCall, { headers: headers })
      .then(response => {
        const logs = response.data || [];
        if (logs.length > 0) {
          setRecentUpload(logs[0]);
          setHistoricalUpload(logs.slice(1));
        } else {
          setRecentUpload(null);
          setHistoricalUpload([]);
        }
        setIsDataFetched(true);
        setIsRefreshing(false);
      })
      .catch(error => {
        console.error('Error fetching logs:', error);
        setIsRefreshing(false);
        if (!quiet) showToast('Failed to refresh data. Please try again.', 'error');
      });
  };

  useEffect(() => {
    if (tenant) {
      fetchUploadActivitiyLogs();
    }
  }, [tenant]);

  const anyRunning = isRunningLoad(recentUpload) || historicalUpload.some(isRunningLoad);
  const wasRunning = useRef(false);
  useEffect(() => {
    // A load just finished: its validation issues are new.
    if (wasRunning.current && !anyRunning) recheckValidationIssues();
    wasRunning.current = anyRunning;
    if (!anyRunning || !tenant) return undefined;
    const id = setInterval(() => fetchUploadActivitiyLogs({ quiet: true }), 10000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anyRunning, tenant]);

  const refreshAll = () => {
    fetchUploadActivitiyLogs();
    recheckValidationIssues();
  };

  const handleOpenFileUpload = () => {
    setOpenFileUpload(true);
  };

  const handleCloseFileUpload = () => {
    if (uploadBusy) return; // closing mid-upload would hide its result
    setOpenFileUpload(false);
  };

  const handleFileUploadComplete = () => {
    setOpenFileUpload(false);
    fetchUploadActivitiyLogs();
    recheckValidationIssues();
  };

  return (
    <Box sx={{ bgcolor: alpha(theme.palette.grey[50], 0.5), minHeight: '100vh', pb: 1 }}>

      <Container maxWidth={false} sx={{ py: 1, px: 2 }}>

        {/* 1. Header Section */}
        <Box sx={{
          p: 1.5,
          borderBottom: '1.5px solid',
          borderColor: (theme) => alpha(theme.palette.divider, 0.2), display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, mb: (hasValidationIssues && !stripDismissed) ? 0 : 4
        }}>
          <Box>
            <Typography variant="h5" fontWeight={600} color="text.primary" sx={{ letterSpacing: '-0.5px' }}>
              Ingest
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={issuesCheckFailed ? 'Validation Log — issues could not be checked' : 'Validation Log'}>
              <IconButton
                aria-label="validation-log"
                onClick={handleOpenValidationLog}
                sx={{
                  bgcolor: 'white', boxShadow: 1,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': { bgcolor: 'grey.50', boxShadow: 3, transform: 'scale(1.08)' },
                  '&:active': { transform: 'scale(0.94)' },
                }}
              >
                <Badge badgeContent={issuesCheckFailed ? '!' : validationIssueCount} color="error" max={99}
                  sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', height: 16, minWidth: 16 } }}>
                  <WarningAmberOutlinedIcon sx={{ color: '#d97706' }} />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title="Upload Activity Files">
              <IconButton onClick={handleOpenFileUpload} sx={{ bgcolor: 'white', boxShadow: 1, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', '&:hover': { bgcolor: 'grey.50', boxShadow: 3, transform: 'scale(1.08)' }, '&:active': { transform: 'scale(0.94)' } }}>
                <FileUploadOutlinedIcon color="action" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <span>
                <IconButton
                  onClick={refreshAll}
                  disabled={isRefreshing}
                  sx={{ bgcolor: 'white', boxShadow: 1, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', '&:hover': { bgcolor: 'grey.50', boxShadow: 3, transform: 'scale(1.08)' }, '&:active': { transform: 'scale(0.94)' } }}
                >
                  {isRefreshing
                    ? <CircularProgress size={20} color="action" />
                    : <CachedRoundedIcon color="action" />}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Download Sample Activity Data">
              <IconButton aria-label="Download Sample Activity Data" component="a" href="/ActivityData_Sample.xlsx" download="ActivityData_Sample.xlsx" sx={{ bgcolor: 'white', boxShadow: 1, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', '&:hover': { bgcolor: 'grey.50', boxShadow: 3, transform: 'scale(1.08)' }, '&:active': { transform: 'scale(0.94)' } }}>
                <DatasetOutlinedIcon color="action" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Validation Issues Strip */}
        {hasValidationIssues && !stripDismissed && (
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            px: 2, py: 1.25, mb: 3,
            borderRadius: 2,
            bgcolor: alpha('#f59e0b', 0.08),
            border: '1px solid', borderColor: alpha('#f59e0b', 0.35),
          }}>
            <WarningAmberOutlinedIcon sx={{ color: '#d97706', fontSize: 20, flexShrink: 0 }} />
            <Typography variant="body2" sx={{ color: '#92400e', flex: 1, fontWeight: 500 }}>
              Your data contains unresolved issues. Please review before proceeding.
            </Typography>
            <Button size="small" onClick={handleOpenValidationLog} disableRipple sx={{
              color: '#d97706', fontWeight: 700, textDecoration: 'underline',
              p: 0, minWidth: 'auto', fontSize: '0.8rem',
              '&:hover': { bgcolor: 'transparent', color: '#b45309' },
            }}>
              Click here
            </Button>
            <IconButton size="small" onClick={() => setStripDismissed(true)} sx={{ color: '#d97706', p: 0.25, ml: 0.5 }}>
              <HighlightOffOutlinedIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        {/* 2. Recent Upload Section */}
        <Box sx={{ mb: 4 }}>
          <FyntracCard
            title="Recent Upload"
            action={<Box sx={{ display: 'flex', gap: 1 }}></Box>}
          >
            <TableContainer>
              <Table aria-label="recent upload table">
                <TableHead sx={{ bgcolor: alpha(theme.palette.grey[100], 0.5) }}>
                  <TableRow>
                    <TableCell />
                    <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Upload Id</TableCell>
                    <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Job Name</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Posting Date</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Start Time</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>End Time</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>File Name</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentUpload ? (
                    <Row row={recentUpload} isExpandedDefault={true} />
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary', fontStyle: 'italic' }}>
                        {isDataFetched ? 'No recent upload found.' : 'Loading...'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </FyntracCard>
        </Box>

        {/* 3. Historical Loads Section */}
        <Box>
          <FyntracCard
            title="Historical Loads"

          >
            <TableContainer>
              <Table aria-label="historical loads table">
                <TableHead sx={{ bgcolor: alpha(theme.palette.grey[100], 0.5) }}>
                  <TableRow>
                    <TableCell width={60} />
                    <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Upload Id</TableCell>
                    <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Job Name</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Posting Date</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Start Time</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>End Time</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>File Name</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historicalUpload.length > 0 ? (
                    historicalUpload.map((row) => (
                      <Row key={row.uploadId} row={row} />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        {isDataFetched ? 'No historical data available.' : 'Loading...'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

          </FyntracCard>
        </Box>

      </Container>

      {/* File Upload Dialog */}
      <Dialog
        open={openFileUpload}
        onClose={handleCloseFileUpload}
        maxWidth="sm"
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
                  label="Data Ingestion"
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
                  Activity Data Load
                </Typography>
              </Box>
            </Box>
            <Tooltip title={uploadBusy ? 'Uploading — please wait' : 'Close'} placement="left">
              <span>
              <IconButton
                onClick={handleCloseFileUpload}
                disabled={uploadBusy}
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
              </span>
            </Tooltip>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <FileUploadComponent
            onDrop={handleFileUploadComplete}
            onBusyChange={setUploadBusy}
            showActivitySelector={true}
            showLoadModeSelector={true}
            headerMessage={""}
            filesLimit={5}
          />
        </DialogContent>
      </Dialog>

      {/* ── Validation Log Dialog ── */}
      <Dialog
        open={openValidationLog}
        onClose={() => setOpenValidationLog(false)}
        maxWidth="xl"
        fullWidth
        slots={{ transition: Slide }}
        slotProps={{
          transition: { direction: 'up' },
          paper: {
            sx: {
              borderRadius: 3, overflow: 'hidden', border: '1px solid',
              borderColor: 'divider', height: '80vh', display: 'flex', flexDirection: 'column',
            },
          },
        }}
      >
        <DialogTitle sx={{ p: 0, flexShrink: 0 }}>
          <Box
            sx={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              px: 3, pt: 2.5, pb: 2,
              background: `linear-gradient(135deg, ${alpha('#2563EB', 0.08)} 0%, ${alpha('#2563EB', 0.03)} 100%)`,
              borderBottom: '1px solid', borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <img src="fyntrac.png" alt="Fyntrac" style={{ width: 64, height: 'auto' }} />
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.4 }}>
                  <Chip
                    icon={<WarningAmberOutlinedIcon sx={{ fontSize: '12px !important', color: '#2563EB !important' }} />}
                    label="Activity Load"
                    size="small"
                    sx={{
                      height: 20, fontSize: '0.68rem', fontWeight: 700,
                      bgcolor: alpha('#2563EB', 0.1), color: '#2563EB',
                      border: `1px solid ${alpha('#2563EB', 0.25)}`, borderRadius: 1,
                    }}
                  />
                </Box>
                <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1rem', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                  Validation Log
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                  {unresolvedLogs.length} unresolved
                </Typography>
              </Box>
            </Box>
            <Tooltip title="Close">
              <IconButton
                onClick={() => setOpenValidationLog(false)}
                size="small"
                sx={{ color: 'text.secondary', bgcolor: 'action.hover', borderRadius: 2, '&:hover': { bgcolor: alpha('#2563EB', 0.08), color: '#2563EB' } }}
              >
                <HighlightOffOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Summary Card */}
          <Box sx={{ display: 'flex', gap: 2, px: 2, pt: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#f8fafc', alignItems: 'center', flexWrap: 'wrap' }}>
            {[
              { label: 'All', filterKey: 'all', value: unresolvedLogs.length, color: '#14213d' },
              { label: 'Errors', filterKey: 'error', value: unresolvedLogs.filter(isErrorLog).length, color: '#dc2626' },
              { label: 'Warnings', filterKey: 'warning', value: unresolvedLogs.filter(r => r.validationType === 'WARNING').length, color: '#d97706' },
            ].map(({ label, filterKey, value, color }) => {
              const active = severityFilter === filterKey;
              return (
                <Box key={filterKey} onClick={() => setSeverityFilter(filterKey)} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.75, borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s', bgcolor: active ? alpha(color, 0.12) : alpha(color, 0.06), border: '1px solid', borderColor: active ? alpha(color, 0.5) : alpha(color, 0.2), '&:hover': { borderColor: alpha(color, 0.4), bgcolor: alpha(color, 0.1) } }}>
                  <Typography variant="caption" sx={{ color: active ? color : 'text.secondary', fontWeight: 600 }}>{label}:</Typography>
                  <Typography variant="caption" sx={{ color, fontWeight: 800, fontSize: '0.85rem' }}>{value}</Typography>
                </Box>
              );
            })}
            <Box sx={{ flex: 1 }} />
            <Button size="small" startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: '16px !important' }} />} onClick={downloadErrorReport} disabled={filteredLogs.length === 0} sx={{
              fontSize: '0.72rem', fontWeight: 700, color: '#14213d',
              border: '1px solid', borderColor: alpha('#14213d', 0.25), borderRadius: 1.5, px: 1.5,
              '&:hover': { bgcolor: alpha('#14213d', 0.05), borderColor: '#14213d' },
            }}>Download CSV</Button>
            <Button size="small" onClick={handleMarkAllResolved} disabled={unresolvedLogs.length === 0} sx={{
              fontSize: '0.72rem', fontWeight: 700, color: '#16a34a',
              border: '1px solid', borderColor: alpha('#16a34a', 0.35), borderRadius: 1.5, px: 1.5,
              '&:hover': { bgcolor: alpha('#16a34a', 0.06), borderColor: '#16a34a' },
            }}>{filtersActive ? '✓ Mark Shown Resolved' : '✓ Mark All Resolved'}</Button>
          </Box>
          {/* Filters */}
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#f8fafc' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                label="Instrument ID"
                size="small"
                variant="outlined"
                value={filterInstrumentId}
                onChange={(e) => setFilterInstrumentId(e.target.value)}
                sx={{ bgcolor: 'white', flex: 1 }}
              />
              <TextField
                label="Attribute ID"
                size="small"
                variant="outlined"
                value={filterAttributeId}
                onChange={(e) => setFilterAttributeId(e.target.value)}
                sx={{ bgcolor: 'white', flex: 1 }}
              />
              <TextField
                label="Posting Date (YYYYMMDD)"
                size="small"
                variant="outlined"
                value={filterPostingDate}
                onChange={(e) => setFilterPostingDate(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') fetchValidationLogs(); }}
                sx={{ bgcolor: 'white', flex: 1 }}
              />
              <Button
                variant="contained"
                onClick={fetchValidationLogs}
                disabled={validationLogsLoading}
                sx={{ height: 40, bgcolor: '#14213d', '&:hover': { bgcolor: '#0d1829' } }}
              >
                Filter
              </Button>
            </Stack>
          </Box>

          <Box sx={{ flex: 1, overflow: 'hidden', px: 3 }}>
            <DataGrid
              rows={filteredLogs}
              loading={validationLogsLoading}
              getRowId={(row) => row.__key}
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              disableRowSelectionOnClick
              slots={{ noRowsOverlay: ValidationNoRows }}
              slotProps={{ noRowsOverlay: { severityFilter, context: 'ingest', error: validationError, onRetry: fetchValidationLogs } }}
              columns={[
                {
                  field: 'validationType', headerName: 'Type', width: 140,
                  renderCell: (p) => <Box sx={{ fontWeight: 600, fontSize: '0.82rem', color: '#1e293b' }}>{p.value}</Box>
                },
                {
                  field: 'fieldName', headerName: 'Field', width: 140,
                  renderCell: (p) => <Box sx={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#475569' }}>{p.value ?? '—'}</Box>
                },
                {
                  field: 'rejectedValue', headerName: 'Rejected Value', width: 130,
                  renderCell: (p) => <Box sx={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#64748b' }}>{p.value ?? '—'}</Box>
                },
                {
                  field: 'rowNumber', headerName: 'Row #', width: 80, align: 'center', headerAlign: 'center',
                  renderCell: (p) => <Box sx={{ fontSize: '0.82rem', color: '#64748b' }}>{p.value ?? '—'}</Box>
                },
                {
                  field: 'errorCode', headerName: 'Error Code', width: 130,
                  renderCell: (p) => {
                    const warning = p.row.validationType === 'WARNING';
                    const tone = warning ? '#d97706' : '#dc2626';
                    return p.value ? (
                      <Chip label={p.value} size="small" sx={{
                        height: 20, fontSize: '0.68rem', fontWeight: 700, fontFamily: 'monospace',
                        bgcolor: alpha(tone, 0.08), color: tone,
                        border: `1px solid ${alpha(tone, 0.2)}`, borderRadius: 1,
                      }} />
                    ) : '—';
                  }
                },
                {
                  field: 'errorMessage', headerName: 'Message', flex: 1, minWidth: 200,
                  renderCell: (p) => (
                    <Tooltip title={p.value} placement="top-start">
                      <Box sx={{ fontSize: '0.82rem', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                        {p.value}
                      </Box>
                    </Tooltip>
                  )
                },
                {
                  field: 'instrumentId', headerName: 'Instrument', width: 140,
                  renderCell: (p) => <Box sx={{ fontSize: '0.8rem', color: '#64748b' }}>{p.value ?? '—'}</Box>
                },
                {
                  field: 'attributeId', headerName: 'Attribute', width: 120,
                  renderCell: (p) => <Box sx={{ fontSize: '0.8rem', color: '#64748b' }}>{p.value ?? '—'}</Box>
                },
                {
                  field: 'postingDate', headerName: 'Posting', width: 90, align: 'center', headerAlign: 'center',
                  renderCell: (p) => <Box sx={{ fontSize: '0.8rem', color: '#64748b' }}>{p.value ?? '—'}</Box>
                },
                {
                  field: 'jobId', headerName: 'Job ID', width: 90, align: 'center', headerAlign: 'center',
                  renderCell: (p) => <Box sx={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' }}>{p.value ?? '—'}</Box>
                },
                {
                  field: 'createdAt', headerName: 'Timestamp', width: 160,
                  renderCell: (p) => (
                    <Box sx={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {p.value ? new Date(p.value).toLocaleString() : '—'}
                    </Box>
                  )
                },
                {
                  field: '__resolve', headerName: '', width: 140, sortable: false, filterable: false,
                  renderCell: (p) => (
                    <Button size="small" onClick={() => handleMarkResolved(p.row)} sx={{
                      fontSize: '0.72rem', fontWeight: 700, color: '#16a34a',
                      border: '1px solid', borderColor: alpha('#16a34a', 0.3),
                      borderRadius: 1.5, px: 1.5, py: 0.25, minWidth: 'auto',
                      '&:hover': { bgcolor: alpha('#16a34a', 0.06), borderColor: '#16a34a' },
                    }}>✓ Mark Resolved</Button>
                  )
                },
              ]}
              sx={{
                border: 0, flex: 1,
                fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
                fontSize: '0.85rem',
                '& *': { fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' },
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: '#f8fafc', color: '#475569', fontSize: '0.7rem',
                  fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
                  borderBottom: '2px solid #e2e8f0',
                },
                '& .MuiDataGrid-columnHeader': { bgcolor: '#f8fafc' },
                '& .MuiDataGrid-columnSeparator': { display: 'none' },
                '& .MuiDataGrid-scrollbarFiller': { bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
                '& .MuiDataGrid-filler': { bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
                '& .MuiDataGrid-row': { transition: 'background 0.15s', '&:hover': { bgcolor: alpha('#2563EB', 0.03) } },
                '& .MuiDataGrid-cell': { borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' },
                '& .MuiDataGrid-footerContainer': { borderTop: '1px solid', borderColor: 'divider', bgcolor: alpha('#2563EB', 0.02) },
              }}
            />
          </Box>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleToastClose} severity={toast.severity} variant="standard" sx={{ borderRadius: 3, fontWeight: 600 }}>
          {toast.message}
        </Alert>
      </Snackbar>

    </Box>
  );
}