"use client"
import React from 'react'
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import CachedRoundedIcon from '@mui/icons-material/CachedRounded';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Transaction from '../component/transaction';
import CustomTabPanel from '../component/custom-tab-panel'
import FileUploadComponent from '../component/file-upload'
import AddTransactionDialog from '../component/add-transaction'
import AddAttributeDialog from '../component/add-attribute';
import Aggregation from '../component/aggregation'
import Attribute from '../component/attribute'
import { Container, Dialog, DialogContent, DialogTitle, Tooltip, Divider, Typography, Slide, Chip, Card, Snackbar, Alert } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { dataloaderApi } from '../services/api-client';
import AddAggregationDialog from '../component/add-aggregation';
import GridHeader from '../component/gridHeader';
import { useTenant } from "../tenant-context";
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
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


export default function RulePage() {
  const { tenant } = useTenant();
  const theme = useTheme();
  const [openFileUpload, setOpenFileUpload] = React.useState(false);
  const [reTransactionfreshKey, setTransactionRefreshKey] = React.useState(0);
  const [refreshAttributeKey, setRefreshAttributeKey] = React.useState(0);
  const [refreshAggregationKey, setRefreshAggregationKey] = React.useState(0);
  const [refreshAccountTypeKey, setRefreshAccountTypeKey] = React.useState(0);
  const [isAddTransactionDialogOpen, setIsAddTransactionDialogOpen] = React.useState(false);
  const [isAddAttributeDialogOpen, setIsAddAttributeDialogOpen] = React.useState(false);
  const [isAddAggregationDialogOpen, setIsAddAggregationDialogOpen] = React.useState(false);
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
    dataloaderApi.get('/validation-logs/ref/by-type/ACCOUNTING_RULES')
      .then(res => setValidationLogs(res.data ?? []))
      .catch(err => console.error('Failed to fetch validation logs:', err))
      .finally(() => setValidationLogsLoading(false));
  }, []);

  const handleOpenValidationLog = () => {
    setOpenValidationLog(true);
    fetchValidationLogs();
  };
  const handleRefresh = () => {    if (panelIndex === 0) {
      setTransactionRefreshKey(prevKey => prevKey + 1);
    } else if (panelIndex === 1) {
      setRefreshAttributeKey(prevKey => prevKey + 1);
    } else if (panelIndex === 2) {
      setRefreshAggregationKey(prevKey => prevKey + 1);
    } else if (panelIndex === 3) {
      setRefreshAccountTypeKey(prevKey => prevKey + 1);
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
    setTransactionRefreshKey(k => k + 1);
    setRefreshAttributeKey(k => k + 1);
    setRefreshAggregationKey(k => k + 1);
    setRefreshAccountTypeKey(k => k + 1);
    showToast('Rules uploaded successfully — tables refreshed.');
  };

  const handleFileDrop = () => {

    const serviceURL = '/accounting/rule/upload';
    const formData = new FormData();
    for (let i = 0; i < acceptedFiles.length; i++) {
      formData.append('files', acceptedFiles[i]);
    }

    dataloaderApi.post(serviceURL, formData)
      .then(response => {
        // Handle success response if needed
        showToast('Rules uploaded successfully.');
      })
      .catch(error => {
        console.error('Upload error:', error);
        showToast('Failed to upload rules file. Please try again.', 'error');
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

  const [panelIndex, setPanelIndex] = React.useState(0);

  const handleTransactionChange = (event, newValue) => {
    setPanelIndex(newValue);
  };

  const handleAdd = () => {
    if (panelIndex === 0) {
      setIsAddTransactionDialogOpen(true);
    } else if (panelIndex === 1) {
      setIsAddAttributeDialogOpen(true);
    } else if (panelIndex === 2) {
      setIsAddAggregationDialogOpen(true);
    } else if (panelIndex === 3) {
      setIsAddAccountTypeDialogOpen(true);
    }
  }

  const handleAddTransactionCloseDialog = (didSave) => {
    setIsAddTransactionDialogOpen(false);
    if (didSave) {
      setTransactionRefreshKey(k => k + 1);
      showToast('Transaction saved successfully.');
    }
  };

  const handleAddAttributeCloseDialog = (didSave) => {
    setIsAddAttributeDialogOpen(false);
    if (didSave) {
      setRefreshAttributeKey(k => k + 1);
      showToast('Attribute saved successfully.');
    }
  };

  const handleAddAggregationCloseDialog = (didSave) => {
    setIsAddAggregationDialogOpen(false);
    if (didSave) {
      setRefreshAggregationKey(k => k + 1);
      showToast('Balance saved successfully.');
    }
  };

  const handleAddAccountTypeCloseDialog = (didSave) => {
    setIsAddAccountTypeDialogOpen(false);
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
          mb: 4,
        }}>
          <Box>
            <Typography variant="h5" fontWeight={600} color="text.primary" sx={{ letterSpacing: '-0.5px' }}>
              Accounting Rules
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
                  '&:hover': { bgcolor: 'rgba(239,68,68,0.06)', boxShadow: 3, transform: 'scale(1.08)' },
                  '&:active': { transform: 'scale(0.94)' },
                }}
              >
                <FactCheckOutlinedIcon sx={{ color: '#ef4444' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Upload Activity Files">
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
          </Box>
        </Box>
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
            <Tab label="Transactions" sx={{ textTransform: 'none' }} />
            <Tab label="Attributes" sx={{ textTransform: 'none' }} />
            <Tab label="Balances" sx={{ textTransform: 'none' }} />

          </Tabs>
        </Box>
        <CustomTabPanel value={panelIndex} index={0}>
          <Transaction refreshData={setTransactionRefreshKey} key={reTransactionfreshKey} onToast={showToast}></Transaction>
        </CustomTabPanel>
        <CustomTabPanel value={panelIndex} index={1}>
          <Attribute refreshData={setRefreshAttributeKey} key={refreshAttributeKey} onToast={showToast}> </Attribute>
        </CustomTabPanel>
        <CustomTabPanel value={panelIndex} index={2}>
          <Aggregation refreshData={setRefreshAggregationKey} key={refreshAggregationKey} onToast={showToast} />
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
                    Accounting Rules Upload
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
        <DialogTitle sx={{ p: 0, flexShrink: 0 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 3, pt: 2.5, pb: 2,
              background: `linear-gradient(135deg, ${alpha('#ef4444', 0.07)} 0%, ${alpha('#f97316', 0.04)} 100%)`,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <img src="fyntrac.png" alt="Fyntrac" style={{ width: 64, height: 'auto' }} />
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.4 }}>
                  <Chip
                    icon={<FactCheckOutlinedIcon sx={{ fontSize: '12px !important', color: '#ef4444 !important' }} />}
                    label="Accounting Rules"
                    size="small"
                    sx={{
                      height: 20, fontSize: '0.68rem', fontWeight: 700,
                      bgcolor: 'rgba(239,68,68,0.1)', color: '#dc2626',
                      border: '1px solid rgba(239,68,68,0.25)', borderRadius: 1,
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
                sx={{ color: 'text.secondary', bgcolor: 'action.hover', borderRadius: 2, '&:hover': { bgcolor: 'rgba(239,68,68,0.1)', color: 'error.main' } }}
              >
                <HighlightOffOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <DataGrid
            rows={validationLogs}
            loading={validationLogsLoading}
            getRowId={(row) => row.id}
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            disableRowSelectionOnClick
            columns={[
              { field: 'sourceTable', headerName: 'Source Table', width: 150,
                renderCell: (p) => <Box sx={{ fontWeight: 600, fontSize: '0.82rem', color: '#1e293b' }}>{p.value}</Box> },
              { field: 'sourceColumn', headerName: 'Column', width: 140,
                renderCell: (p) => <Box sx={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#475569' }}>{p.value}</Box> },
              { field: 'sourceColumnValue', headerName: 'Value', width: 130,
                renderCell: (p) => <Box sx={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#64748b' }}>{p.value ?? '—'}</Box> },
              { field: 'rowNum', headerName: 'Row #', width: 80, align: 'center', headerAlign: 'center',
                renderCell: (p) => <Box sx={{ fontSize: '0.82rem', color: '#64748b' }}>{p.value ?? '—'}</Box> },
              { field: 'errorCode', headerName: 'Error Code', width: 130,
                renderCell: (p) => (
                  <Chip label={p.value} size="small" sx={{
                    height: 20, fontSize: '0.68rem', fontWeight: 700, fontFamily: 'monospace',
                    bgcolor: 'rgba(239,68,68,0.08)', color: '#dc2626',
                    border: '1px solid rgba(239,68,68,0.2)', borderRadius: 1,
                  }} />
                ) },
              { field: 'severity', headerName: 'Severity', width: 110, align: 'center', headerAlign: 'center',
                renderCell: (p) => {
                  const isError = p.value === 'ERROR';
                  return (
                    <Chip label={p.value} size="small" sx={{
                      height: 20, fontSize: '0.68rem', fontWeight: 700,
                      bgcolor: isError ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)',
                      color: isError ? '#dc2626' : '#a16207',
                      border: `1px solid ${isError ? 'rgba(239,68,68,0.25)' : 'rgba(234,179,8,0.25)'}`,
                      borderRadius: 1,
                    }} />
                  );
                } },
              { field: 'errorCategory', headerName: 'Category', width: 110,
                renderCell: (p) => <Box sx={{ fontSize: '0.8rem', color: '#64748b' }}>{p.value ?? '—'}</Box> },
              { field: 'message', headerName: 'Message', flex: 1, minWidth: 200,
                renderCell: (p) => (
                  <Tooltip title={p.value} placement="top-start">
                    <Box sx={{ fontSize: '0.82rem', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                      {p.value}
                    </Box>
                  </Tooltip>
                ) },
              { field: 'jobId', headerName: 'Job ID', width: 90, align: 'center', headerAlign: 'center',
                renderCell: (p) => <Box sx={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' }}>{p.value ?? '—'}</Box> },
              { field: 'createdTimestamp', headerName: 'Timestamp', width: 160,
                renderCell: (p) => (
                  <Box sx={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {p.value ? new Date(p.value).toLocaleString() : '—'}
                  </Box>
                ) },
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
              '& .MuiDataGrid-row': { transition: 'background 0.15s', '&:hover': { bgcolor: alpha('#ef4444', 0.03) } },
              '& .MuiDataGrid-cell': { borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' },
              '& .MuiDataGrid-footerContainer': { borderTop: '1px solid', borderColor: 'divider', bgcolor: alpha('#ef4444', 0.02) },
            }}
          />
        </DialogContent>
      </Dialog>
        <AddTransactionDialog open={isAddTransactionDialogOpen} onClose={handleAddTransactionCloseDialog} />
        <AddAttributeDialog open={isAddAttributeDialogOpen} onClose={handleAddAttributeCloseDialog} />
        <AddAggregationDialog open={isAddAggregationDialogOpen} onClose={handleAddAggregationCloseDialog} />
        
      </>
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
