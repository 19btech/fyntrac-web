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

  const handleAddTransactionCloseDialog = () => {
    setIsAddTransactionDialogOpen(false);
  };

  const handleAddAttributeCloseDialog = () => {
    setIsAddAttributeDialogOpen(false);
  };

  const handleAddAggregationCloseDialog = () => {
    setIsAddAggregationDialogOpen(false);
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
              Accounting Rules
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ display: 'flex', gap: 1 }}>
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
          <Transaction refreshData={setTransactionRefreshKey} key={reTransactionfreshKey}></Transaction>
        </CustomTabPanel>
        <CustomTabPanel value={panelIndex} index={1}>
          <Attribute refreshData={setRefreshAttributeKey} key={refreshAttributeKey}> </Attribute>
        </CustomTabPanel>
        <CustomTabPanel value={panelIndex} index={2}>
          <Aggregation refreshData={setRefreshAggregationKey} key={refreshAggregationKey} />
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
        <AddTransactionDialog open={isAddTransactionDialogOpen} onClose={handleAddTransactionCloseDialog} />
        <AddAttributeDialog open={isAddAttributeDialogOpen} onClose={handleAddAttributeCloseDialog} />
        <AddAggregationDialog open={isAddAggregationDialogOpen} onClose={handleAddAggregationCloseDialog} />
        
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
