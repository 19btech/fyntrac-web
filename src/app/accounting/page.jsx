"use client"
import React from 'react'
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2'
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
import { Button, Dialog, Typography, DialogContent, DialogTitle, Divider, Tooltip } from '@mui/material';
import axios from 'axios';
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
  const [openFileUpload, setOpenFileUpload] = React.useState(false);
  const [refreshChartOfAccountKey, setRefreshChartOfAccountKey] = React.useState(0);
  const [refreshSubledgerMapping, setRefreshSubledgerMapping] = React.useState(0);
  const [refreshAccountTypeKey, setRefreshAccountTypeKey] = React.useState(0);
  const [isAddChartOfAccountDialogOpen, setIsAddChartOfAccountDialogOpen] = React.useState(false);
  const [isAddSubledgerMappingDialogOpen, setIsAddSubledgerMappingDialogOpen] = React.useState(false);
  const [isAddAccountTypeDialogOpen, setIsAddAccountTypeDialogOpen] = React.useState(false);

  const handleRefresh = () => {
    localStorage.removeItem('attributeMetadata');
    if (panelIndex === 0) {
      setRefreshChartOfAccountKey(prevKey => prevKey + 1);
    } else if (panelIndex === 1) {
      setRefreshSubledgerMapping(prevKey => prevKey + 1);
    }

  };

  const handleOpenFileUpload = () => {
    setOpenFileUpload(true);
  };
  const handleCloseFileUpload = () => {
    setOpenFileUpload(false);
  };

  const handleFileDrop = (acceptedFiles) => {

    const serviceURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/accounting/rule/upload';
    const formData = new FormData();
    for (let i = 0; i < acceptedFiles.length; i++) {
      formData.append('files', acceptedFiles[i]);
    }

    axios.post(serviceURL, formData, {
      headers: {
        'X-Tenant': tenant,
        Accept: '*/*',
        'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
      }
    })
      .then(response => {
        // Handle success response if needed
      })
      .catch(error => {
        console.error('Upload error:', error);
        // Handle error if needed
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
    <>

      <Grid container spacing={3}>
        <Grid size="auto">
          <div className='left'>
            <GridHeader>
              Journal Mapping
            </GridHeader>
          </div>
        </Grid>
        <Grid size={6} />

        <Grid size="grow">
          <div className='right'>
            <Stack direction="row" spacing={1}>

              <IconButton aria-label="Upload Activity Files" onClick={handleOpenFileUpload} sx={{
                '&:hover': {
                  backgroundColor: 'darkgrey',
                },
              }}>
                <Tooltip title="Upload Activity Files">
                  <FileUploadOutlinedIcon />
                </Tooltip>
              </IconButton>


              <IconButton aria-label="refresh" onClick={handleRefresh} sx={{
                '&:hover': {
                  backgroundColor: 'darkgrey',
                },
              }}>
                <Tooltip title="Refresh">
                  <CachedRoundedIcon />
                </Tooltip>
              </IconButton>
              <IconButton aria-label="add" onClick={handleAdd} sx={{
                '&:hover': {
                  backgroundColor: 'darkgrey',
                },
              }}>
                <Tooltip title="Add">
                  <AddOutlinedIcon />
                </Tooltip>
              </IconButton>
            </Stack>
          </div>
        </Grid>
      </Grid>
      <Divider />
      <Box sx={{ height: '1rem', }} />
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


      <>
        <Dialog open={openFileUpload} onClose={handleCloseFileUpload}>
          <DialogTitle>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
              }}
            >
              {/* Top Left: Image */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',  // Change 'left' to 'flex-start'
                  gap: 1,
                  width: 'fit-content' // Ensures the Box doesn't take more space than needed
                }}
              >
                <img
                  src="fyntrac.png"
                  alt="Logo"
                  style={{
                    width: '100px',
                    height: 'auto',  // Maintain aspect ratio
                    maxWidth: '100%' // Ensures responsiveness
                  }}
                />
                <Typography variant="h6">Activity Upload</Typography>
              </Box>
              <Tooltip title='Close'>
                <IconButton
                  onClick={handleCloseFileUpload}
                  edge="end"
                  aria-label="close"
                  sx={{
                    color: 'grey.500',
                    '&:hover': { color: 'black' },
                  }}
                >
                  <HighlightOffOutlinedIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </DialogTitle>
          <DialogContent>
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
    </>
  )
}
