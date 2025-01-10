"use client"
import React from 'react'
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import CachedRoundedIcon from '@mui/icons-material/CachedRounded';
import PlayCircleOutlineOutlinedIcon from '@mui/icons-material/PlayCircleOutlineOutlined';
import Tab from '@mui/material/Tab';
import Models from '../component/models';
import CustomTabPanel from '../component/custom-tab-panel'
import ModelUploadComponent from '../component/model-upload'
import { Button, Dialog, DialogActions, DialogContent, Divider, Tabs } from '@mui/material';
import axios from 'axios';
import Tooltip from '@mui/material/Tooltip';
import GridHeader from '../component/gridHeader';
import '../common.css';

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

export default function ModelPage() {
  const [openFileUpload, setOpenFileUpload] = React.useState(false);
  const [panelIndex, setPanelIndex] = React.useState(0); // Initialize with the first tab index
  const [modelRefreshKey, setModelRefreshKey] = React.useState(0); // Example state for refresh key

  const handleModelChange = (event, newValue) => {
    setPanelIndex(newValue); // Update the panel index
  };

  const handleRefresh = () => {

  };

  const handleOpenFileUpload = () => {
    setOpenFileUpload(true);
  };
  const handleCloseFileUpload = () => {
    setOpenFileUpload(false);
  };

  const handleFileDrop = (acceptedFiles, modelName, modelOrderId) => {
    // You can handle the uploaded files here
    setTimeout(() => {
      handleCloseFileUpload();
      setOpenFileUpload(true);
    }, 10000) // Close the dialog after handling the files
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handlePlay = () => {

  }


  return (
    <>

      <Grid container spacing={3}>
        <Grid size="auto">
          <div className='left'>
            <GridHeader>
              Models
            </GridHeader>
          </div>
        </Grid>
        <Grid size={6} />

        <Grid size="grow">
          <div className='right'>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Refresh page" arrow>
                <IconButton aria-label="refresh" onClick={handleRefresh} sx={{
                  '&:hover': {
                    backgroundColor: 'darkgrey',
                  },
                }}>
                  <CachedRoundedIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Upload Rule File" arrow>
                <IconButton aria-label="upload rule file" onClick={handleOpenFileUpload} sx={{
                  '&:hover': {
                    backgroundColor: 'darkgrey',
                  },
                }}>
                  <FileUploadOutlinedIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Execute model" arrow>
                <IconButton aria-label="add" onClick={handlePlay} sx={{
                  '&:hover': {
                    backgroundColor: 'darkgrey',
                  },
                }}>
                  <PlayCircleOutlineOutlinedIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </div>
        </Grid>
      </Grid>


      <Divider />

      <Box>
      <Box sx={{ width: '100%', display: 'flex', borderBottom: 1, borderColor: 'divider', alignItems: 'flex-start', margin: 0, padding: 0 }}>
          <Tabs sx={{ width: '90rem' }} value={panelIndex} onChange={handleModelChange} aria-label="Loaded Models">
            <Tab label="Loaded Models" sx={{ textTransform: 'none' }}/>
          </Tabs>
        </Box>
        <CustomTabPanel value={panelIndex} index={panelIndex}>
          <Models refreshData={setModelRefreshKey} key={modelRefreshKey}> </Models>
        </CustomTabPanel>
      </Box>

      <div>
        <Dialog open={openFileUpload} onClose={handleCloseFileUpload}>
          <DialogContent>
            <ModelUploadComponent
              onDrop={handleFileDrop}
              text="Drag and drop your images here"
              iconColor="#3f51b5"
              borderColor="#3f51b5"
              filesLimit={1}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseFileUpload} color="primary">
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

      </div>

    </>
  )
}
