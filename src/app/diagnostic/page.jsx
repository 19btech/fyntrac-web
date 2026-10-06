"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Button,
  Container,
  TextField,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  Slide,
  Typography,
  Popover,
  List,
  ListItemButton,
  ListItemText,
  InputAdornment,
  Chip,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import SearchIcon from "@mui/icons-material/Search";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";
import PlayCircleOutlineOutlinedIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import { dataloaderApi, reportingApi } from '../services/api-client';
import CustomTabPanel from '../component/custom-tab-panel';
import CircularProgress from '@mui/material/CircularProgress';
import { green } from '@mui/material/colors';
import { useTenant } from "../tenant-context";
import EnhancedDataGridTabs from "../component/map-tabs";

const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// The server's own message, including from a blob (download) error response.
const serverMessage = async (error, fallback) => {
  const data = error?.response?.data;
  try {
    if (data instanceof Blob) {
      const text = await data.text();
      try { return JSON.parse(text).message || text.slice(0, 200) || fallback; } catch { return text.slice(0, 200) || fallback; }
    }
  } catch { /* fall through */ }
  if (typeof data === 'string' && data.trim()) return data.replace(/<[^>]*>/g, '').trim().slice(0, 200);
  return data?.message || data?.error || error?.message || fallback;
};

// File name from Content-Disposition: filename*=UTF-8''… wins over filename="…".
const fileNameFrom = (disposition, fallback) => {
  if (!disposition) return fallback;
  const star = /filename\*\s*=\s*(?:UTF-8|utf-8)?''([^;]+)/i.exec(disposition);
  if (star) {
    try { return decodeURIComponent(star[1].trim().replace(/^"|"$/g, '')); } catch { /* use plain filename */ }
  }
  const plain = /filename\s*=\s*("([^"]*)"|[^;]+)/i.exec(disposition);
  const name = plain ? (plain[2] ?? plain[1]).trim() : '';
  return name || fallback;
};

const PAPER_SX = {
  mt: 0.75,
  width: 350,
  borderRadius: 3,
  boxShadow: '0 8px 32px rgba(15,23,42,0.16)',
  border: '1px solid', borderColor: 'divider',
  overflow: 'hidden',
};

const InstrumentDiagnosticPage = () => {
  const theme = useTheme();
  const { tenant } = useTenant();

  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const showToast = (message, severity = 'success') => setToast({ open: true, message, severity });
  const handleToastClose = (_, reason) => { if (reason === 'clickaway') return; setToast(p => ({ ...p, open: false })); };

  const [instrumentId, setInstrumentId] = useState('');
  const [models, setModels] = useState([]);
  const [modelsError, setModelsError] = useState('');
  const [model, setModel] = useState('');
  const [postingDates, setPostingDates] = useState([]);
  const [postingDatesError, setPostingDatesError] = useState('');
  const [postingDate, setPostingDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // Results and the inputs they were run for (shown above them).
  const [diagnosticData, setDiagnosticData] = useState({});
  const [ranFor, setRanFor] = useState(null);
  const runSeq = useRef(0);

  const [datepickerAnchor, setDatepickerAnchor] = useState(null);
  const [datepickerSearch, setDatepickerSearch] = useState('');
  const [modelpickerAnchor, setModelpickerAnchor] = useState(null);
  const [modelpickerSearch, setModelpickerSearch] = useState('');

  const filteredPostingDates = postingDates.filter(d =>
    String(d.label ?? d.value ?? '').toLowerCase().includes(datepickerSearch.toLowerCase())
  );
  const filteredModels = models.filter(m =>
    String(m.modelName ?? '').toLowerCase().includes(modelpickerSearch.toLowerCase())
  );

  const modelName = (id) => models.find(m => m.id === id)?.modelName || id;
  const dateLabel = (value) => postingDates.find(d => d.value === value)?.label || value;

  const fetchAllModels = useCallback(() => {
    dataloaderApi.get('/model/get/all')
      .then(response => {
        setModels(Array.isArray(response.data) ? response.data : []);
        setModelsError('');
      })
      .catch(async error => {
        console.error('Error fetching models:', error);
        setModelsError(await serverMessage(error, 'Models could not be loaded.'));
      });
  }, []);

  const fetchAllPostingDates = useCallback(() => {
    reportingApi.get('/diagnostic/get/event-postingdates')
      .then(response => {
        setPostingDates(Array.isArray(response.data) ? response.data : []);
        setPostingDatesError('');
      })
      .catch(async error => {
        console.error('Error fetching posting dates from EventHistory:', error);
        setPostingDatesError(await serverMessage(error, 'Posting dates could not be loaded.'));
      });
  }, []);

  // Lists load for the tenant, and again each time a picker opens (new models / executions).
  useEffect(() => {
    if (!tenant) return;
    fetchAllModels();
    fetchAllPostingDates();
  }, [tenant, fetchAllModels, fetchAllPostingDates]);

  // Everything the diagnostic needs; names the missing inputs.
  const missingInputs = () => [
    !instrumentId.trim() && 'an instrument',
    !model && 'a model',
    !postingDate && 'a posting date',
  ].filter(Boolean);

  const checkInputs = () => {
    setSubmitted(true);
    const missing = missingInputs();
    if (!missing.length) return true;
    const list = missing.length > 1 ? `${missing.slice(0, -1).join(', ')} and ${missing[missing.length - 1]}` : missing[0];
    showToast(`Select ${list} first.`, 'error');
    return false;
  };

  const request = () => ({
    tenant: tenant,
    instrumentId: instrumentId.trim(),
    modelId: model,
    postingDate: postingDate,
  });

  const downloadDiagnostic = () => {
    if (downloading || !checkInputs()) return;
    setDownloading(true);
    reportingApi.post('/diagnostic/download', request(), {
      headers: {
        'X-Tenant': tenant,
        Accept: XLSX_TYPE,
      },
      responseType: 'blob' // ✅ required
    })
      .then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data], { type: XLSX_TYPE }));
        const fileName = fileNameFrom(response.headers['content-disposition'], `diagnostic-${instrumentId.trim()}.xlsx`);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        showToast('Diagnostic file downloaded successfully.');
      })
      .catch(async error => {
        console.error('Error downloading Excel file:', error);
        showToast(await serverMessage(error, 'Failed to download diagnostic file.'), 'error');
      })
      .finally(() => setDownloading(false));
  };

  const executeReport = () => {
    if (loading || !checkInputs()) return;
    const seq = ++runSeq.current;
    const inputs = request();
    setLoading(true);

    reportingApi.post('/diagnostic/generate', inputs)
      .then(response => {
        if (seq !== runSeq.current) return; // a newer run was started
        const data = response.data?.valueMapList;
        setDiagnosticData(data && typeof data === 'object' ? data : {});
        setRanFor(inputs);
        showToast('Diagnostic report loaded successfully.');
      })
      .catch(async error => {
        if (seq !== runSeq.current) return;
        console.error('Error fetching data:', error);
        // Never leave another run's results on screen under these inputs.
        setDiagnosticData({});
        setRanFor(null);
        showToast(await serverMessage(error, 'Failed to run diagnostic.'), 'error');
      })
      .finally(() => {
        if (seq === runSeq.current) setLoading(false);
      });
  };

  // Results that don't match the inputs any more are labelled as such.
  const resultsStale = Boolean(ranFor) && (
    ranFor.instrumentId !== instrumentId.trim() || ranFor.modelId !== model || ranFor.postingDate !== postingDate
  );

  const iconButtonSx = { bgcolor: 'white', boxShadow: 1, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', '&:hover': { bgcolor: 'grey.50', boxShadow: 3, transform: 'scale(1.08)' }, '&:active': { transform: 'scale(0.94)' } };
  const fieldSx = { flex: '1 1 260px', minWidth: 0 };

  const pickerList = ({ items, error, onRetry, empty, isSelected, onPick, label }) => (
    <List dense disablePadding sx={{ maxHeight: 280, overflow: 'auto' }}>
      {error && !items.length ? (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>{error}</Typography>
          <Button size="small" onClick={onRetry}>Retry</Button>
        </Box>
      ) : items.length === 0 ? (
        <ListItemButton disabled sx={{ justifyContent: 'center', py: 2.5 }}>
          <Typography variant="caption" color="text.disabled">{empty}</Typography>
        </ListItemButton>
      ) : items.map((item) => (
        <ListItemButton
          key={item.key}
          selected={isSelected(item)}
          onClick={() => onPick(item)}
          sx={{
            py: 1, px: 2,
            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
            '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.1) },
          }}
        >
          <ListItemText primary={label(item)} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }} />
        </ListItemButton>
      ))}
    </List>
  );

  const searchBox = (value, onChange, placeholder) => (
    <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.6) }}>
      <TextField
        autoFocus
        fullWidth
        size="small"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
      />
    </Box>
  );

  const clearAdornment = (show, onClear) => (show ? (
    <InputAdornment position="end">
      <IconButton
        size="small"
        onClick={(e) => { e.stopPropagation(); onClear(); }}
        sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}
      >
        <HighlightOffOutlinedIcon sx={{ fontSize: '0.95rem' }} />
      </IconButton>
    </InputAdornment>
  ) : null);

  return (
    <Box sx={{ bgcolor: alpha(theme.palette.grey[50], 0.5), minHeight: '100vh', pb: 1 }}>
      <Container maxWidth={false} sx={{ py: 1, px: 2 }}>

        {/* Header Section */}
        <Box sx={{
          p: 1.5,
          borderBottom: '1.5px solid',
          borderColor: (t) => alpha(t.palette.divider, 0.2),
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { sm: 'center' },
          gap: 2,
          mb: 4,
        }}>
          <Box>
            <Typography variant="h5" fontWeight={600} color="text.primary" sx={{ letterSpacing: '-0.5px' }}>
              Diagnostic Report
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={loading ? 'Running…' : 'Run diagnostic'} arrow>
              <span>
                <IconButton
                  aria-label="Run diagnostic"
                  onClick={executeReport}
                  disabled={loading}
                  sx={{ position: 'relative', bgcolor: 'rgba(22,163,74,0.1)', border: '1px solid rgba(21,128,61,0.35)', color: '#16a34a', boxShadow: 1, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', '&:hover': { bgcolor: 'rgba(22,163,74,0.2)', borderColor: '#15803d', boxShadow: 3, transform: 'scale(1.08)' }, '&:active': { transform: 'scale(0.94)' }, '&.Mui-disabled': { color: alpha('#16a34a', 0.5), bgcolor: 'rgba(22,163,74,0.06)' } }}
                >
                  <PlayCircleOutlineOutlinedIcon />
                  {loading && (
                    <CircularProgress
                      size={24}
                      sx={{
                        color: green[500],
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        marginTop: '-12px',
                        marginLeft: '-12px',
                      }}
                    />
                  )}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={downloading ? 'Downloading…' : 'Download Diagnostic'} arrow>
              <span>
                <IconButton
                  onClick={downloadDiagnostic}
                  disabled={downloading}
                  aria-label="Download diagnostic"
                  sx={{ ...iconButtonSx, position: 'relative' }}
                >
                  <FileDownloadOutlinedIcon color="action" />
                  {downloading && (
                    <CircularProgress size={24} sx={{ position: 'absolute', top: '50%', left: '50%', marginTop: '-12px', marginLeft: '-12px' }} />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
      <Box sx={{ width: '100%', borderBottom: 1, borderColor: 'divider', alignItems: 'flex-start', margin: 0, padding: 0 }}>
        <Tabs value={0} aria-label="Filter">
          <Tab label="Filter" sx={{ textTransform: 'none' }} />
        </Tabs>
      </Box>

      <CustomTabPanel value={0} index={0}>

        <Box display="flex" flexDirection="column" sx={{ minHeight: '78vh' }}>
          <Box sx={{ mb: 1, p: 1, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
            <TextField
              label="Instrument"
              value={instrumentId}
              onChange={(e) => setInstrumentId(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') executeReport(); }}
              size="small"
              error={submitted && !instrumentId.trim()}
              helperText={submitted && !instrumentId.trim() ? 'Enter an instrument' : ' '}
              sx={{ ...fieldSx, '& .MuiInputLabel-root:not(.MuiInputLabel-shrink)': { fontSize: '0.875rem' } }}
            />

            <TextField
              size="small"
              label="Select Model"
              value={model ? modelName(model) : ''}
              onClick={(e) => { setModelpickerAnchor(e.currentTarget); setModelpickerSearch(''); fetchAllModels(); }}
              inputProps={{ readOnly: true, style: { cursor: 'pointer' } }}
              error={submitted && !model}
              helperText={submitted && !model ? 'Select a model' : ' '}
              sx={fieldSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
                endAdornment: clearAdornment(Boolean(model), () => setModel('')),
              }}
            />

            <Popover
              open={Boolean(modelpickerAnchor)}
              anchorEl={modelpickerAnchor}
              onClose={() => setModelpickerAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              slotProps={{ paper: { sx: { ...PAPER_SX, width: modelpickerAnchor ? Math.max(modelpickerAnchor.offsetWidth, 280) : 350 } } }}
            >
              {searchBox(modelpickerSearch, setModelpickerSearch, 'Search models...')}
              {pickerList({
                items: filteredModels.map((m) => ({ ...m, key: m.id })),
                error: modelsError,
                onRetry: fetchAllModels,
                empty: 'No models found.',
                isSelected: (m) => m.id === model,
                onPick: (m) => { setModel(m.id); setModelpickerAnchor(null); },
                label: (m) => m.modelName,
              })}
            </Popover>

            <TextField
              size="small"
              label="Select Posting Date"
              value={postingDate ? dateLabel(postingDate) : ''}
              onClick={(e) => { setDatepickerAnchor(e.currentTarget); setDatepickerSearch(''); fetchAllPostingDates(); }}
              inputProps={{ readOnly: true, style: { cursor: 'pointer' } }}
              error={submitted && !postingDate}
              helperText={submitted && !postingDate ? 'Select a posting date' : ' '}
              sx={fieldSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
                endAdornment: clearAdornment(Boolean(postingDate), () => setPostingDate('')),
              }}
            />

            <Popover
              open={Boolean(datepickerAnchor)}
              anchorEl={datepickerAnchor}
              onClose={() => setDatepickerAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              slotProps={{ paper: { sx: { ...PAPER_SX, width: datepickerAnchor ? Math.max(datepickerAnchor.offsetWidth, 280) : 350 } } }}
            >
              {searchBox(datepickerSearch, setDatepickerSearch, 'Search dates...')}
              {pickerList({
                items: filteredPostingDates.map((d) => ({ ...d, key: d.value })),
                error: postingDatesError,
                onRetry: fetchAllPostingDates,
                empty: 'No dates found.',
                isSelected: (d) => d.value === postingDate,
                onPick: (d) => { setPostingDate(d.value); setDatepickerAnchor(null); },
                label: (d) => d.label,
              })}
            </Popover>
          </Box>

          <Box flex="1" sx={{ overflow: 'auto', px: { xs: 0, sm: 2.5 }, pb: 2.5 }}>
            {ranFor && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Results for</Typography>
                <Chip size="small" label={`Instrument ${ranFor.instrumentId}`} />
                <Chip size="small" label={modelName(ranFor.modelId)} />
                <Chip size="small" label={dateLabel(ranFor.postingDate)} />
                {resultsStale && (
                  <Typography variant="caption" sx={{ color: '#b45309', fontWeight: 600 }}>
                    — the selection has changed; run the diagnostic again to update.
                  </Typography>
                )}
              </Box>
            )}
            <EnhancedDataGridTabs data={diagnosticData} ran={Boolean(ranFor)} />
          </Box>
        </Box>
      </CustomTabPanel>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ top: '55px', '@media (min-width:600px)': { top: '55px' } }}
        slots={{ transition: Slide }} slotProps={{ transition: { direction: 'left' } }}
      >
        <Alert
          onClose={handleToastClose}
          severity={toast.severity}
          variant="standard"
          sx={{
            borderRadius: 3, fontWeight: 600, fontSize: '0.85rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)', minWidth: 280,
            bgcolor: toast.severity === 'success' ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.10)',
            border: toast.severity === 'success' ? '1px solid rgba(22,163,74,0.3)' : '1px solid rgba(220,38,38,0.3)',
            color: toast.severity === 'success' ? '#15803d' : '#dc2626',
            '& .MuiAlert-icon': { color: toast.severity === 'success' ? '#16a34a' : '#dc2626' },
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
      </Container>
    </Box>
  );
};


export default InstrumentDiagnosticPage;
