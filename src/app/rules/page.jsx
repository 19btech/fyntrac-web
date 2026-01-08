"use client"
import React from 'react'
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
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
import AddAccountTypeDialog from '../component/add-account-type';
import Aggregation from '../component/aggregation'
import Attribute from '../component/attribute'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Tooltip, Divider } from '@mui/material';
import axios from 'axios';
import AddAggregationDialog from '../component/add-aggregation';
import GridHeader from '../component/gridHeader';
import { useTenant } from "../tenant-context";

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
  const [openFileUpload, setOpenFileUpload] = React.useState(false);
  const [reTransactionfreshKey, setTransactionRefreshKey] = React.useState(0);
  const [refreshAttributeKey, setRefreshAttributeKey] = React.useState(0);
  const [refreshAggregationKey, setRefreshAggregationKey] = React.useState(0);
  const [refreshAccountTypeKey, setRefreshAccountTypeKey] = React.useState(0);
  const [isAddTransactionDialogOpen, setIsAddTransactionDialogOpen] = React.useState(false);
  const [isAddAttributeDialogOpen, setIsAddAttributeDialogOpen] = React.useState(false);
  const [isAddAggregationDialogOpen, setIsAddAggregationDialogOpen] = React.useState(false);
  const [isAddAccountTypeDialogOpen, setIsAddAccountTypeDialogOpen] = React.useState(false);
  const handleRefresh = () => {
    if (panelIndex === 0) {
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
    <>

      <Grid container spacing={3}>
        <Grid size="auto">
          <div className='left'>
            <GridHeader>
              Accounting Rules
            </GridHeader>
          </div>
        </Grid>
        <Grid size={6} />

        <Grid size="grow">
          <div className='right'>
            <Stack direction="row" spacing={1}>

              <IconButton aria-label="upload rule file" onClick={handleOpenFileUpload} sx={{
                '&:hover': {
                  backgroundColor: 'darkgrey',
                },
              }}>
                <Tooltip title="Upload File">
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


      <>
        <Dialog open={openFileUpload} onClose={handleCloseFileUpload}>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogContent>
            <FileUploadComponent
              onDrop={handleFileDrop}
              text="Drag and drop your files here"
              iconColor="#3f51b5"
              borderColor="#3f51b5"
              filesLimit={5}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseFileUpload} color="primary">
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

      </>
      <>
        <AddTransactionDialog open={isAddTransactionDialogOpen} onClose={handleAddTransactionCloseDialog} />
        <AddAttributeDialog open={isAddAttributeDialogOpen} onClose={handleAddAttributeCloseDialog} />
        <AddAggregationDialog open={isAddAggregationDialogOpen} onClose={handleAddAggregationCloseDialog} />
        <AddAccountTypeDialog open={isAddAccountTypeDialogOpen} onClose={handleAddAccountTypeCloseDialog} />
      </>
    </>
  )
}
