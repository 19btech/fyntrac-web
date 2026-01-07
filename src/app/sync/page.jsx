"use client"
import React from 'react'
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { styled } from '@mui/material/styles';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import CachedRoundedIcon from '@mui/icons-material/CachedRounded';
import FileUploadComponent from '../component/file-upload'
import AddChartofAccount from '../component/add-chart-of-account'
import AddSubledgerMapping from '../component/add-subledger-mapping';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Tooltip, Typography } from '@mui/material';
import RecentLoad from '../component/recent-load'
import axios from 'axios';
import '../common.css';
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


export default function SyncPage() {

  const { tenant } = useTenant();
  const [openFileUpload, setOpenFileUpload] = React.useState(false);
  const [refreshChartOfAccountKey, setRefreshChartOfAccountKey] = React.useState(0);
  const [refreshSubledgerMapping, setRefreshSubledgerMapping] = React.useState(0);
  const [isAddChartOfAccountDialogOpen, setIsAddChartOfAccountDialogOpen] = React.useState(false);
  const [isAddSubledgerMappingDialogOpen, setIsAddSubledgerMappingDialogOpen] = React.useState(false);
  
  const handleRefresh = () => {
    localStorage.removeItem('attributeMetadata');
    if(panelIndex === 0) {
      setRefreshChartOfAccountKey(prevKey => prevKey + 1);
    }else if(panelIndex === 1){
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

  const handleAdd =  () => {
    if(panelIndex === 0) {
      setIsAddChartOfAccountDialogOpen(true);
    }else if(panelIndex === 1) {
      setIsAddSubledgerMappingDialogOpen(true);
    }
  }

  const handleAddChartOfAccountCloseDialog = () => {
    setIsAddChartOfAccountDialogOpen(false);
  };

  const handleAddSubledgerMappingCloseDialog = () => {
    setIsAddSubledgerMappingDialogOpen(false);
  };

  return (
    <>
    <Grid container spacing={3}>
        <Grid size="auto">
          <div className='left'>
            <GridHeader>
            Ingest
            </GridHeader>
          </div>
        </Grid>
        <Grid size={6} />

        <Grid size="grow">
          <div className='right'>
          <Stack direction="row" spacing={1}>
             <Tooltip title="Upload" arrow>
                <IconButton aria-label="upload activity file" onClick={handleOpenFileUpload} sx={{
                  '&:hover': {
                    backgroundColor: 'darkgrey',
                  },
                }}>
                  <FileUploadOutlinedIcon />
                </IconButton>
                </Tooltip>
                <Tooltip title="Refresh page" arrow>
             
                <IconButton aria-label="refresh"  onClick={handleRefresh} sx={{
                  '&:hover': {
                    backgroundColor: 'darkgrey',
                  },
                }}>
                  <CachedRoundedIcon />
                </IconButton>
                </Tooltip>
              </Stack>
          </div>
        </Grid>
      </Grid>
<Divider />
          
        <Box sx={{ height: '1rem', }} />
          <Box>
            <Box sx={{ width: '95rem', borderBottom: 0, borderColor: 'divider', alignItems: 'flex-start', margin: 0, padding: 0 }}>
            <Accordion defaultExpanded>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1-content"
          id="panel1-header"
          
        >
          <Typography sx={{fontFamily: 'Inter'}}>
            Recent loads
          </Typography>
          
        </AccordionSummary>
        <Divider />
        <AccordionDetails>
         <RecentLoad />
        </AccordionDetails>
      </Accordion>
      <Box sx={{ height: '1rem', }} />
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel2-content"
          id="panel2-header"
        >
          History
        </AccordionSummary>
        <AccordionDetails>
          work in progress !!!.
        </AccordionDetails>
      </Accordion>

            </Box>
            
          </Box>
      <>
      <Dialog open={openFileUpload} onClose={handleCloseFileUpload}>
        <DialogTitle>Upload Files</DialogTitle>
        <DialogContent>
          <FileUploadComponent
            onDrop={handleFileDrop}
            text="Drag and drop your images here"
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
          <AddChartofAccount open={isAddChartOfAccountDialogOpen} onClose={handleAddChartOfAccountCloseDialog} />
          <AddSubledgerMapping open={isAddSubledgerMappingDialogOpen} onClose={handleAddSubledgerMappingCloseDialog} />
      </>
    </>
  )
}
