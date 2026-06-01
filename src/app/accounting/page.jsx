"use client"
import React from 'react'
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import CachedRoundedIcon from '@mui/icons-material/CachedRounded';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import DatasetOutlinedIcon from '@mui/icons-material/DatasetOutlined';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import ChartOfAccount from '../component/chart-off-account';
import SubledgerMapping from '../component/subledger-mapping'
import AddAccountTypeDialog from '../component/add-account-type'
import AccountType from '../component/account-type'
import CustomTabPanel from '../component/custom-tab-panel'
import FileUploadComponent from '../component/file-upload'
import AddChartofAccount from '../component/add-chart-of-account'
import AddSubledgerMapping from '../component/add-subledger-mapping';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { Container, Button, Badge, Dialog, Typography, DialogContent, DialogTitle, Divider, Tooltip, Slide, Chip, Card, Snackbar, Alert } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { dataloaderApi } from '../services/api-client';
import GridHeader from '../component/gridHeader';
import { useTenant } from "../tenant-context";
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import { DataGrid } from '@mui/x-data-grid';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});


function ValidationNoRows({ severityFilter, context }) {
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

export default function AccountingPage({ initialTab = 0 }) {
  const { tenant } = useTenant();
  const theme = useTheme();
  const [openFileUpload, setOpenFileUpload] = React.useState(false);
  const [refreshChartOfAccountKey, setRefreshChartOfAccountKey] = React.useState(0);
  const [refreshSubledgerMapping, setRefreshSubledgerMapping] = React.useState(0);
  const [refreshAccountTypeKey, setRefreshAccountTypeKey] = React.useState(0);
  const [isAddChartOfAccountDialogOpen, setIsAddChartOfAccountDialogOpen] = React.useState(false);
  const [isAddSubledgerMappingDialogOpen, setIsAddSubledgerMappingDialogOpen] = React.useState(false);
  const [isAddAccountTypeDialogOpen, setIsAddAccountTypeDialogOpen] = React.useState(false);
  const [toast, setToast] = React.useState({ open: false, message: '', severity: 'success' });
  const showToast = (message, severity = 'success') => setToast({ open: true, message, severity });
  const handleToastClose = (_, reason) => { if (reason === 'clickaway') return; setToast(p => ({ ...p, open: false })); };

  // ── Validation Log ──────────────────────────────────────────────────────────
  const [openValidationLog, setOpenValidationLog] = React.useState(false);
  const [validationLogs, setValidationLogs] = React.useState([]);
  const [validationLogsLoading, setValidationLogsLoading] = React.useState(false);

  const fetchValidationLogs = React.useCallback(() => {
    setValidationLogsLoading(true);
    dataloaderApi.get('/validation-logs/ref/by-type/JOURNAL_MAPPING')
      .then(res => setValidationLogs(res.data ?? []))
      .catch(err => console.error('Failed to fetch validation logs:', err))
      .finally(() => setValidationLogsLoading(false));
  }, []);

  const handleOpenValidationLog = () => {
    setOpenValidationLog(true);
    setSeverityFilter('all');
    fetchValidationLogs();
  };

  const [stripDismissed, setStripDismissed] = React.useState(false);
  const [severityFilter, setSeverityFilter] = React.useState('all');

  const [resolvedIds, setResolvedIds] = React.useState(() => {
    try { return new Set(JSON.parse(sessionStorage.getItem('resolved_JOURNAL_MAPPING') ?? '[]')); }
    catch { return new Set(); }
  });

  const unresolvedLogs = React.useMemo(() =>
    validationLogs.filter(r => !resolvedIds.has(String(r.id))),
    [validationLogs, resolvedIds]
  );

  const validationIssueCount = unresolvedLogs.length;
  const hasValidationIssues = validationIssueCount > 0;

  const recheckValidationIssues = React.useCallback(() => {
    if (!tenant) return;
    dataloaderApi.get('/validation-logs/ref/by-type/JOURNAL_MAPPING')
      .then(res => {
        setValidationLogs(res.data ?? []);
        if ((res.data ?? []).length === 0) setStripDismissed(false);
      })
      .catch(() => {});
  }, [tenant]);

  React.useEffect(() => { recheckValidationIssues(); }, [recheckValidationIssues]);

  const filteredLogs = React.useMemo(() => {
    if (severityFilter === 'all') return unresolvedLogs;
    return unresolvedLogs.filter(r =>
      severityFilter === 'error' ? r.severity === 'ERROR' : r.severity === 'WARNING'
    );
  }, [unresolvedLogs, severityFilter]);

  const handleMarkResolved = (row) => {
    setResolvedIds(prev => {
      const next = new Set(prev);
      next.add(String(row.id));
      try { sessionStorage.setItem('resolved_JOURNAL_MAPPING', JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const handleMarkAllResolved = () => {
    const count = filteredLogs.length;
    setResolvedIds(prev => {
      const next = new Set(prev);
      filteredLogs.forEach(r => next.add(String(r.id)));
      try { sessionStorage.setItem('resolved_JOURNAL_MAPPING', JSON.stringify([...next])); } catch {}
      return next;
    });
    showToast(`${count} issue${count !== 1 ? 's' : ''} marked as resolved.`, 'success');
  };

  const handleRefresh = () => {
    // Clear tenant-scoped attribute metadata cache
    localStorage.removeItem(`attributeMetadata_${tenant}`);
    if (panelIndex === 0) {
      setRefreshAccountTypeKey(prevKey => prevKey + 1);
    } else if (panelIndex === 1) {
      setRefreshSubledgerMapping(prevKey => prevKey + 1);
    } else if (panelIndex === 2) {
      setRefreshChartOfAccountKey(prevKey => prevKey + 1);
    }
  };

  const handleOpenFileUpload = () => {
    setOpenFileUpload(true);
  };
  const handleCloseFileUpload = () => {
    setOpenFileUpload(false);
  };
  const handleFileUploadComplete = () => {
    setOpenFileUpload(false);
    setRefreshAccountTypeKey(k => k + 1);
    setRefreshSubledgerMapping(k => k + 1);
    setRefreshChartOfAccountKey(k => k + 1);
    showToast('Reference data uploaded successfully — tables refreshed.');
  };

  const handleFileDrop = (acceptedFiles) => {

    const serviceURL = '/accounting/rule/upload';
    const formData = new FormData();
    for (let i = 0; i < acceptedFiles.length; i++) {
      formData.append('files', acceptedFiles[i]);
    }

    dataloaderApi.post(serviceURL, formData)
      .then(response => {
        // Handle success response if needed
        showToast('Accounting rules uploaded successfully.');
      })
      .catch(error => {
        console.error('Upload error:', error);
        showToast('Failed to upload accounting rules.', 'error');
      });

    // You can handle the uploaded files here
    handleCloseFileUpload(); // Close the dialog after handling the files
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const [panelIndex, setPanelIndex] = React.useState(initialTab);

  React.useEffect(() => {
    setPanelIndex(initialTab);
  }, [initialTab]);

  const handleTransactionChange = (event, newValue) => {
    setPanelIndex(newValue);
  };

  const handleAdd = () => {
    if (panelIndex === 0) {
      setIsAddAccountTypeDialogOpen(true);
    } else if (panelIndex === 1) {
      setIsAddSubledgerMappingDialogOpen(true);
    } else if (panelIndex === 2) {
      setIsAddChartOfAccountDialogOpen(true);
    }
  }

  const handleAddChartOfAccountCloseDialog = (didSave) => {
    setIsAddChartOfAccountDialogOpen(false);
    if (didSave) {
      setRefreshChartOfAccountKey(k => k + 1);
      showToast('Chart of account saved successfully.');
      recheckValidationIssues();
    }
  };

  const handleAddSubledgerMappingCloseDialog = (didSave) => {
    setIsAddSubledgerMappingDialogOpen(false);
    if (didSave) {
      setRefreshSubledgerMapping(k => k + 1);
      showToast('Subledger mapping saved successfully.');
      recheckValidationIssues();
    }
  };

  const handleAddAccountTypeCloseDialog = (didSave) => {
    setIsAddAccountTypeDialogOpen(false);
    if (didSave) {
      setRefreshAccountTypeKey(k => k + 1);
      showToast('Account type saved successfully.');
      recheckValidationIssues();
    }
  };
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
          mb: (hasValidationIssues && !stripDismissed) ? 0 : 4,
        }}>
          <Box>
            <Typography variant="h5" fontWeight={600} color="text.primary" sx={{ letterSpacing: '-0.5px' }}>
              Journal Mapping
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Validation Log">
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
                <Badge badgeContent={validationIssueCount} color="error" max={99}
                  sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', height: 16, minWidth: 16 } }}>
                  <WarningAmberOutlinedIcon sx={{ color: '#d97706' }} />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title="Upload Reference Data Files">
              <IconButton aria-label="Upload Activity Files" onClick={handleOpenFileUpload} sx={{ bgcolor: 'white', boxShadow: 1, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', '&:hover': { bgcolor: 'grey.50', boxShadow: 3, transform: 'scale(1.08)' }, '&:active': { transform: 'scale(0.94)' } }}>
                <FileUploadOutlinedIcon color="action" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton aria-label="refresh" onClick={handleRefresh} sx={{ bgcolor: 'white', boxShadow: 1, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', '&:hover': { bgcolor: 'grey.50', boxShadow: 3, transform: 'scale(1.08)' }, '&:active': { transform: 'scale(0.94)' } }}>
                <CachedRoundedIcon color="action" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Add">
              <IconButton aria-label="add" onClick={handleAdd} sx={{ bgcolor: 'white', boxShadow: 1, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', '&:hover': { bgcolor: 'grey.50', boxShadow: 3, transform: 'scale(1.08)' }, '&:active': { transform: 'scale(0.94)' } }}>
                <AddOutlinedIcon color="action" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download Sample Ref Data">
              <IconButton aria-label="Download Sample Ref Data" component="a" href="/RefData_Sample.xlsx" download="RefData_Sample.xlsx" sx={{ bgcolor: 'white', boxShadow: 1, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', '&:hover': { bgcolor: 'grey.50', boxShadow: 3, transform: 'scale(1.08)' }, '&:active': { transform: 'scale(0.94)' } }}>
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

        <Card elevation={0} sx={{
          borderRadius: 3,
          boxShadow: `0px 2px 4px ${alpha(theme.palette.grey[300], 0.4)}, 0px 0px 2px ${alpha(theme.palette.grey[400], 0.2)}`,
          bgcolor: 'background.paper',
          transition: 'box-shadow 0.3s, transform 0.2s ease-in-out',
          '&:hover': {
            boxShadow: `0px 12px 24px ${alpha(theme.palette.grey[400], 0.3)}`,
            transform: 'translateY(-2px)',
          },
          overflow: 'hidden',
        }}>
          <Box>
            <Box sx={{ width: '100%', display: 'flex', borderBottom: 1, borderColor: 'divider', alignItems: 'flex-start', margin: 0, padding: 0 }}>
              <Tabs sx={{ width: '90rem' }} value={panelIndex} onChange={handleTransactionChange} aria-label="Accounting Configuration">
                <Tab label="Account Type" sx={{ textTransform: 'none' }} />
                <Tab label="Subledger Mapping" sx={{ textTransform: 'none' }} />
                <Tab label="Chart of Accounts" sx={{ textTransform: 'none' }} />
              </Tabs>
            </Box>

            <CustomTabPanel value={panelIndex} index={0}>
              <AccountType refreshData={setRefreshAccountTypeKey} key={refreshAccountTypeKey} onToast={showToast} />
            </CustomTabPanel>

            <CustomTabPanel value={panelIndex} index={1}>
              <SubledgerMapping refreshData={setRefreshSubledgerMapping} key={refreshSubledgerMapping} onToast={showToast} />
            </CustomTabPanel>

            <CustomTabPanel value={panelIndex} index={2}>
              <ChartOfAccount refreshData={setRefreshChartOfAccountKey} key={refreshChartOfAccountKey} onToast={showToast} />
            </CustomTabPanel>
          </Box>
        </Card>


        <>
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
                      Journal Mapping Upload
                    </Typography>
                  </Box>
                </Box>
                <Tooltip title="Close" placement="left">
                  <IconButton
                    onClick={handleCloseFileUpload}
                    size="small"
                    sx={{
                      color: 'text.secondary',
                      bgcolor: 'action.hover',
                      borderRadius: 2,
                      '&:hover': { bgcolor: 'error.50', color: 'error.main' },
                    }}
                  >
                    <HighlightOffOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <FileUploadComponent
                onDrop={handleFileUploadComplete}
                text="Drag and drop your files here"
                iconColor="#3f51b5"
                borderColor="#3f51b5"
                filesLimit={5}
              />
            </DialogContent>
          </Dialog>

        </>
        <>
          <AddChartofAccount open={isAddChartOfAccountDialogOpen} onClose={handleAddChartOfAccountCloseDialog} />
          <AddSubledgerMapping open={isAddSubledgerMappingDialogOpen} onClose={handleAddSubledgerMappingCloseDialog} />
          <AddAccountTypeDialog open={isAddAccountTypeDialogOpen} onClose={handleAddAccountTypeCloseDialog} />
        </>

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
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                height: '80vh',
                display: 'flex',
                flexDirection: 'column',
              },
            },
          }}
        >
          {/* Header */}
          <DialogTitle sx={{ p: 0, flexShrink: 0 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                px: 3,
                pt: 2.5,
                pb: 2,
                background: `linear-gradient(135deg, ${alpha('#2563EB', 0.08)} 0%, ${alpha('#2563EB', 0.03)} 100%)`,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <img src="fyntrac.png" alt="Fyntrac" style={{ width: 64, height: 'auto' }} />
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.4 }}>
                    <Chip
                      icon={<WarningAmberOutlinedIcon sx={{ fontSize: '12px !important', color: '#2563EB !important' }} />}
                      label="Journal Mapping"
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
                    {validationLogs.length} record{validationLogs.length !== 1 ? 's' : ''}
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

          {/* Body */}
          <DialogContent sx={{ p: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Severity Filter Bar */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#f8fafc', flexWrap: 'wrap' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mr: 0.5 }}>Filter:</Typography>
              {[
                { key: 'all', label: `All (${unresolvedLogs.length})` },
                { key: 'error', label: `Errors (${unresolvedLogs.filter(r => r.severity === 'ERROR').length})` },
                { key: 'warning', label: `Warnings (${unresolvedLogs.filter(r => r.severity === 'WARNING').length})` },
              ].map(({ key, label }) => (
                <Chip key={key} label={label} size="small" onClick={() => setSeverityFilter(key)} sx={{
                  cursor: 'pointer', fontWeight: severityFilter === key ? 700 : 500, fontSize: '0.72rem',
                  bgcolor: severityFilter === key ? (key === 'error' ? alpha('#dc2626', 0.1) : key === 'warning' ? alpha('#d97706', 0.1) : alpha('#2563EB', 0.1)) : 'transparent',
                  color: severityFilter === key ? (key === 'error' ? '#dc2626' : key === 'warning' ? '#d97706' : '#2563EB') : 'text.secondary',
                  border: '1px solid', borderColor: severityFilter === key ? (key === 'error' ? alpha('#dc2626', 0.3) : key === 'warning' ? alpha('#d97706', 0.3) : alpha('#2563EB', 0.3)) : alpha('#94a3b8', 0.3),
                }} />
              ))}
              <Box sx={{ flex: 1 }} />
              <Button size="small" onClick={handleMarkAllResolved} disabled={filteredLogs.length === 0} sx={{
                fontSize: '0.72rem', fontWeight: 700, color: '#16a34a',
                border: '1px solid', borderColor: alpha('#16a34a', 0.35), borderRadius: 1.5, px: 1.5,
                '&:hover': { bgcolor: alpha('#16a34a', 0.06), borderColor: '#16a34a' },
              }}>✓ Mark All Resolved</Button>
            </Box>
            <Box sx={{ flex: 1, overflow: 'hidden', px: 3 }}>
            <DataGrid
              rows={filteredLogs}
              loading={validationLogsLoading}
              getRowId={(row) => row.id}
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              disableRowSelectionOnClick
              slots={{ noRowsOverlay: ValidationNoRows }}
              slotProps={{ noRowsOverlay: { severityFilter, context: 'journal' } }}
              columns={[
                {
                  field: 'sourceTable',
                  headerName: 'Source Table',
                  width: 150,
                  renderCell: (p) => (
                    <Box sx={{ fontWeight: 600, fontSize: '0.82rem', color: '#1e293b' }}>{p.value}</Box>
                  ),
                },
                {
                  field: 'sourceColumn',
                  headerName: 'Column',
                  width: 140,
                  renderCell: (p) => (
                    <Box sx={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#475569' }}>{p.value}</Box>
                  ),
                },
                {
                  field: 'sourceColumnValue',
                  headerName: 'Value',
                  width: 130,
                  renderCell: (p) => (
                    <Box sx={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#64748b' }}>{p.value ?? '—'}</Box>
                  ),
                },
                {
                  field: 'rowNum',
                  headerName: 'Row #',
                  width: 80,
                  align: 'center',
                  headerAlign: 'center',
                  renderCell: (p) => (
                    <Box sx={{ fontSize: '0.82rem', color: '#64748b' }}>{p.value ?? '—'}</Box>
                  ),
                },
                {
                  field: 'errorCode',
                  headerName: 'Error Code',
                  width: 130,
                  renderCell: (p) => (
                    <Chip
                      label={p.value}
                      size="small"
                      sx={{
                        height: 20, fontSize: '0.68rem', fontWeight: 700,
                        bgcolor: 'rgba(239,68,68,0.08)', color: '#dc2626',
                        border: '1px solid rgba(239,68,68,0.2)', borderRadius: 1,
                        fontFamily: 'monospace',
                      }}
                    />
                  ),
                },
                {
                  field: 'severity',
                  headerName: 'Severity',
                  width: 110,
                  align: 'center',
                  headerAlign: 'center',
                  renderCell: (p) => {
                    const isError = p.value === 'ERROR';
                    return (
                      <Chip
                        label={p.value}
                        size="small"
                        sx={{
                          height: 20, fontSize: '0.68rem', fontWeight: 700,
                          bgcolor: isError ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)',
                          color: isError ? '#dc2626' : '#a16207',
                          border: `1px solid ${isError ? 'rgba(239,68,68,0.25)' : 'rgba(234,179,8,0.25)'}`,
                          borderRadius: 1,
                        }}
                      />
                    );
                  },
                },
                {
                  field: 'errorCategory',
                  headerName: 'Category',
                  width: 110,
                  renderCell: (p) => (
                    <Box sx={{ fontSize: '0.8rem', color: '#64748b' }}>{p.value ?? '—'}</Box>
                  ),
                },
                {
                  field: 'message',
                  headerName: 'Message',
                  flex: 1,
                  minWidth: 200,
                  renderCell: (p) => (
                    <Tooltip title={p.value} placement="top-start">
                      <Box sx={{ fontSize: '0.82rem', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                        {p.value}
                      </Box>
                    </Tooltip>
                  ),
                },
                {
                  field: 'jobId',
                  headerName: 'Job ID',
                  width: 90,
                  align: 'center',
                  headerAlign: 'center',
                  renderCell: (p) => (
                    <Box sx={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' }}>{p.value ?? '—'}</Box>
                  ),
                },
                {
                  field: 'createdTimestamp',
                  headerName: 'Timestamp',
                  width: 160,
                  renderCell: (p) => (
                    <Box sx={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {p.value ? new Date(p.value).toLocaleString() : '—'}
                    </Box>
                  ),
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
                  ),
                },
              ]}
              sx={{
                border: 0,
                flex: 1,
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
                '& .MuiDataGrid-row': {
                  transition: 'background 0.15s',
                  '&:hover': { bgcolor: alpha('#2563EB', 0.03) },
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid', borderColor: 'divider',
                  display: 'flex', alignItems: 'center',
                },
                '& .MuiDataGrid-footerContainer': {
                  borderTop: '1px solid', borderColor: 'divider',
                  bgcolor: alpha('#2563EB', 0.02),
                },
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
          style={{ top: '55px' }}
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
  )
}
