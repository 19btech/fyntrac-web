"use client"
import React from 'react'
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import CachedRoundedIcon from '@mui/icons-material/CachedRounded';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
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
import { Container, Button, Dialog, Typography, DialogContent, DialogTitle, Divider, Tooltip, Slide, Chip, Card, Snackbar, Alert } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { dataloaderApi } from '../services/api-client';
import GridHeader from '../component/gridHeader';
import { useTenant } from "../tenant-context";
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';

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


export default function AccountingPage() {
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

  const handleRefresh = () => {
    localStorage.removeItem('attributeMetadata');
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

  const [panelIndex, setPanelIndex] = React.useState(0);

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

  const handleAddChartOfAccountCloseDialog = () => {
    setIsAddChartOfAccountDialogOpen(false);
  };

  const handleAddSubledgerMappingCloseDialog = () => {
    setIsAddSubledgerMappingDialogOpen(false);
  };

  const handleAddAccountTypeCloseDialog = () => {
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
              Journal Mapping
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ display: 'flex', gap: 1 }}>
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
            <Tab label="Account Type" sx={{ textTransform: 'none' }} />
            <Tab label="Subledger Mapping" sx={{ textTransform: 'none' }} />
            <Tab label="Chart of Accounts" sx={{ textTransform: 'none' }} />
          </Tabs>
        </Box>

        <CustomTabPanel value={panelIndex} index={0}>
          <AccountType refreshData={setRefreshAccountTypeKey} key={refreshAccountTypeKey} />
        </CustomTabPanel>

        <CustomTabPanel value={panelIndex} index={1}>
          <SubledgerMapping refreshData={setRefreshSubledgerMapping} key={refreshSubledgerMapping} />
        </CustomTabPanel>

        <CustomTabPanel value={panelIndex} index={2}>
          <ChartOfAccount refreshData={setRefreshChartOfAccountKey} key={refreshChartOfAccountKey} />
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
          slotProps={{ transition: { direction: 'up' } }}
          PaperProps={{
            sx: {
              borderRadius: 4,
              boxShadow: '0 32px 64px rgba(0,0,0,0.14)',
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
            }
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
              onDrop={handleCloseFileUpload}
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
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
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
