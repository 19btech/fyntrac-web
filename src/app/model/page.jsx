"use client"
import React, { useEffect } from 'react';
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
import CustomTabPanel from '../component/custom-tab-panel';
import ModelUploadComponent from '../component/model-upload';
import { DialogTitle, Tabs, TabPanel, List, ListItem, Paper, Button, Dialog, DialogActions, DialogContent, Divider } from '@mui/material';
import axios from 'axios';
import Tooltip from '@mui/material/Tooltip';
import GridHeader from '../component/gridHeader';
import ExecuteModel from '../component/execute-model';
import '../common.css';
import PythonIcon from '../icons/python-icon';

import Editor from "@monaco-editor/react";
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import ArrowBackIosNewOutlinedIcon from '@mui/icons-material/ArrowBackIosNewOutlined';

import ListItemIcon from '@mui/material/ListItemIcon';

import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';

import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

import Collapse from '@mui/material/Collapse';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';
import FileUploadComponent from '../component/file-upload';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import DataFileList from '../component/data-file-list';
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

export default function ModelPage() {
   const { tenant } = useTenant();
  const [openFileUpload, setOpenFileUpload] = React.useState(false);
  const [openTestDataFileUpload, setOpenTestDataFileUpload] = React.useState(false);
  const [panelIndex, setPanelIndex] = React.useState(0); // Initialize with the first tab index
  const [modelRefreshKey, setModelRefreshKey] = React.useState(0); // Example state for refresh key
  const [openExecuteModel, setOpenExecuteModel] = React.useState(false);
  const [openPythonModel, setOpenPythonModel] = React.useState(false);
  const [headerLabel, setHeaderLabel] = React.useState('Model');
  const [open, setOpen] = React.useState(true);
  const [activityDataOpen, setActivityDataOpen] = React.useState(true);
  const [refDataOpen, setRefDataOpen] = React.useState(true);
  const [refDataFiles, setRefDataFiles] = React.useState([]);
  const [activityDataFiles, setActivityDataFiles] = React.useState([]);
  const [outputDataFiles, setOutputDataFiles] = React.useState([]);
  const [projectDataFiles, setProjectDataFiles] = React.useState([]);
  // define the tenant name once
  const TENANT_NAME = `Test_${tenant}`;

  const [tabValue, setTabValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleClick = () => {
    setOpen(!open);
  };

  const handleActivityDataClick = () => {
    setActivityDataOpen(!activityDataOpen);
  };

  const handleRefDataClick = () => {
    setRefDataOpen(!refDataOpen);
  };

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

  const handleCloseTestDataFileUpload = () => {
    setOpenTestDataFileUpload(false);
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
    setOpenExecuteModel(true);

    const executeModel = `${process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI}/model/play-ground/execute-model`;


    axios.post(executeModel, {
      headers: {
        'X-Tenant': TENANT_NAME,
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      responseType: 'blob' // ✅ required
    })
      .then(response => {
        console.info('Model execution message sent successfully', response);
      })
      .catch(error => {
        console.error('Error Model Execution:', error);
      });

  };

  const openPythonModelScreen = () => {
    setHeaderLabel('Python Model');
    setOpenPythonModel(true);
  };

  const closePythonModelScreen = () => {
    setHeaderLabel('Model');
    setOpenPythonModel(false);
  };

  useEffect(() => {
    fetchRefDataFiles();
    fetchActivityDataFiles();
    fetchOutputDataFiles();
    fetchProjectDataFiles();
  }, []);

  const handleFileClick = (file) => {
    const downloadFile = `${process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI}/model/play-ground/download/file`;

    console.log('Download Request:', downloadFile, file);

    axios.post(downloadFile, file, {
      headers: {
        'X-Tenant': TENANT_NAME,
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      responseType: 'blob' // ✅ required
    })
      .then(response => {
        const url = window.URL.createObjectURL(
          new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        );

        // Use backend-provided filename, fallback to default
        const disposition = response.headers['content-disposition'];
        let fileName = file.name;
        if (disposition && disposition.includes("filename=")) {
          fileName = disposition.split("filename=")[1].replace(/"/g, '');
        }

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();

        // cleanup
        link.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error('Error downloading Excel file:', error);
      });
  };

  const fetchRefDataFiles = async () => {
    try {
      const url = `${process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI}/model/play-ground/get/ref-data-files`;
      console.log('url:', url);
      const response = await axios.get(url, {
        headers: {
          'X-Tenant': TENANT_NAME,
          Accept: '*/*',
        },
      });
      const data = response.data || [];
      console.log(data);
      setRefDataFiles(data);
    } catch (error) {
      console.error('Error fetching ref data files:', error);
    }
  };


  const fetchActivityDataFiles = async () => {
    try {
      const url = `${process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI}/model/play-ground/get/activity-data-files`;
      const response = await axios.get(url, {
        headers: {
          'X-Tenant': TENANT_NAME,
          Accept: '*/*',
        },
      });
      const data = response.data || [];
      console.log(data);
      setActivityDataFiles(data);
    } catch (error) {
      console.error('Error fetching ref data files:', error);
    }
  };

  const fetchOutputDataFiles = async () => {
    try {
      const url = `${process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI}/model/play-ground/get/output-data-files`;
      const response = await axios.get(url, {
        headers: {
          'X-Tenant': TENANT_NAME,
          Accept: '*/*',
        },
      });
      const data = response.data || [];
      console.log(data);
      setOutputDataFiles(data);
    } catch (error) {
      console.error('Error fetching ref data files:', error);
    }
  };

  const fetchProjectDataFiles = async () => {
    try {
      const url = `${process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI}/model/play-ground/get/project-data-files`;
      const response = await axios.get(url, {
        headers: {
          'X-Tenant': TENANT_NAME,
          Accept: '*/*',
        },
      });
      const data = response.data || [];
      console.log(data);
      setProjectDataFiles(data);
    } catch (error) {
      console.error('Error fetching ref data files:', error);
    }
  };

  const handleTestDataFileDrop = (acceptedFiles) => {

    const serviceURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/model/play-ground/test-data/upload';
    const formData = new FormData();
    for (let i = 0; i < acceptedFiles.length; i++) {
      formData.append('files', acceptedFiles[i]);
    }

    axios.post(serviceURL, formData, {
      headers: {
        'X-Tenant': TENANT_NAME,
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



  return (


    <>
      {openPythonModel ? (
        <>
          <Grid container spacing={2}>
            <Grid size="auto">
              <div className='left'>
                <GridHeader>
                  {headerLabel}
                </GridHeader>
              </div>
            </Grid>
            <Grid size={6} />

            <Grid size="grow">
              <div className='right'>
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Back to main model screen" arrow>
                    <IconButton aria-label="Back to previous screen" onClick={closePythonModelScreen} sx={{
                      '&:hover': {
                        backgroundColor: 'darkgrey',
                      },
                    }}>
                      <ArrowBackIosNewOutlinedIcon />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Save model" arrow>
                    <IconButton aria-label="refresh" onClick={handleRefresh} sx={{
                      '&:hover': {
                        backgroundColor: 'darkgrey',
                      },
                    }}>
                      <SaveOutlinedIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Deploy model" arrow>
                    <IconButton aria-label="upload rule file" onClick={handleOpenFileUpload} sx={{
                      '&:hover': {
                        backgroundColor: 'darkgrey',
                      },
                    }}>
                      <RocketLaunchOutlinedIcon />
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

          <Box sx={{ flexGrow: 1, height: "85vh", p: 2, minWidth: "95vh", }}>



            <Grid container spacing={0} sx={{ height: "83vh", }}>

              {/* Column 1: Chat Window */}
              <Grid xs={3}>   {/* Was 4 → reduced to give more space to editor */}
                <Paper
                  elevation={3}
                  sx={{
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    minWidth: "22vw",   // ✅ ensures column never gets too thin
                  }}
                >
                  <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
                    <p>Chat window AI</p>
                  </Box>
                </Paper>
              </Grid>

              {/* Column 2: Icon Menu */}
              <Grid xs={4} sx={{ paddingLeft: 2, height: '100vh' }}>



                <Paper
                  elevation={3}
                  sx={{
                    height: '83vh',
                    overflow: "auto",
                    width: '17vw',
                    borderTopLeftRadius: '12px',
                    borderBottomLeftRadius: '12px',
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* --- top fixed section (optional) --- */}
                  <Box sx={{ flex: '0 0 auto' }}>
                    {/* e.g. logo, title */}
                  </Box>

                  {/* --- scrollable section --- */}
                  <Box
                    sx={{
                      flex: '1 1 auto',
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      minWidth: '15vw',
                    }}
                  >

                    <nav aria-label="Data setup">
                      <List>
                        <ListItem disablePadding>
                          <ListItemButton>
                            <ListItemIcon>
                              <Tooltip title="Upload test data" arrow>
                                <IconButton
                                  aria-label="add"
                                  onClick={() => setOpenTestDataFileUpload(true)}
                                  sx={{
                                    "&:hover": { backgroundColor: "darkgrey" },
                                  }}
                                >
                                  <FileUploadOutlinedIcon />
                                </IconButton>
                              </Tooltip>
                            </ListItemIcon>
                            <ListItemText primary="Setup Data" />
                          </ListItemButton>
                        </ListItem>
                      </List>
                    </nav>

                    <Divider sx={{ p: 0 }} />

                    {/* everything else — including Collapse content */}
                    <ListItemButton onClick={handleClick}>
                      <Box sx={{ display: "flex", alignItems: "left", mr: 0 }}>
                        {open ? <ExpandLess /> : <ExpandMore />}
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "left", flexGrow: 1 }}>
                        <ListItemText primary="Input Data" />
                      </Box>
                    </ListItemButton>

                    <Collapse in={open} timeout="auto" unmountOnExit>
                      <Box sx={{ paddingLeft: 3 }}>
                        <ListItemButton onClick={handleActivityDataClick}>
                          <Box sx={{ display: "flex", alignItems: "left", mr: 0 }}>
                            {activityDataOpen ? <ExpandLess /> : <ExpandMore />}
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "left", flexGrow: 1 }}>
                            <ListItemText primary="Activity Data" />
                          </Box>
                        </ListItemButton>

                        <Collapse in={activityDataOpen} timeout="auto" unmountOnExit>
                          <List component="div" disablePadding>
                            <DataFileList files={activityDataFiles} onFileClick={handleFileClick} />
                          </List>
                        </Collapse>
                      </Box>

                      <Box sx={{ paddingLeft: 3 }}>

                        <ListItemButton onClick={handleRefDataClick}>
                          {/* Collapse icon on far left */}
                          <Box sx={{ display: "flex", alignItems: "left", mr: 0 }}>
                            {refDataOpen ? <ExpandLess /> : <ExpandMore />}
                          </Box>

                          {/* Middle section: Inbox icon + text */}
                          <Box sx={{ display: "flex", alignItems: "left", flexGrow: 1 }}>
                            <ListItemText primary="Accounting Rules" />
                          </Box>


                        </ListItemButton>

                        <Collapse in={refDataOpen} timeout="auto" unmountOnExit>
                          <List component="div" disablePadding>
                            <DataFileList files={refDataFiles} onFileClick={handleFileClick} />
                          </List>
                        </Collapse>
                      </Box>
                    </Collapse>

                    <Divider sx={{ p: 2 }} />

                    <ListItemButton onClick={handleClick}>
                      {/* Collapse icon on far left */}
                      <Box sx={{ display: "flex", alignItems: "center", mr: 1 }}>
                        {open ? <ExpandLess /> : <ExpandMore />}
                      </Box>

                      {/* Middle section: Inbox icon + text */}
                      <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
                        <ListItemText primary="Output Data" />
                      </Box>

                      {/* Right section: extra icons */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <RefreshOutlinedIcon />
                        <DeleteForeverOutlinedIcon />
                      </Box>
                    </ListItemButton>

                    <Collapse in={open} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        <ListItemButton sx={{ pl: 4 }}>
                          <ListItemIcon>
                            <CalendarViewMonthIcon />
                          </ListItemIcon>
                          <ListItemText primary="Starred" />
                        </ListItemButton>
                      </List>
                    </Collapse>


                    <Divider sx={{ p: 2 }} />

                    <ListItemButton onClick={handleClick}>
                      {/* Collapse icon on far left */}
                      <Box sx={{ display: "flex", alignItems: "center", mr: 1 }}>
                        {open ? <ExpandLess /> : <ExpandMore />}
                      </Box>

                      {/* Middle section: Inbox icon + text */}
                      <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
                        <ListItemText primary="Project Files" />
                      </Box>

                    </ListItemButton>

                    <Collapse in={open} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        <ListItemButton sx={{ pl: 4 }}>
                          <ListItemIcon>
                            <CalendarViewMonthIcon />
                          </ListItemIcon>
                          <ListItemText primary="Starred" />
                        </ListItemButton>
                      </List>
                    </Collapse>
                  </Box>
                </Paper>
              </Grid>

              <Grid xs={5} >
                <Paper sx={{ alignItems: "left", height: "83vh", width: "39vw", overflow: "auto", paddingLeft: 1, }}>

                  <Box
                    sx={{
                      border: "1px solid #ccc",           // light gray border
                      borderTopLeftRadius: "8px",         // round top-left corner
                      borderTopRightRadius: "8px",        // round top-right corner
                      borderBottomLeftRadius: 0,
                      borderBottomRightRadius: 0,
                      overflow: "hidden",
                      width: "17%",
                    }}
                  >
                    <Tabs
                      value={tabValue}
                      onChange={handleChange}
                      slotProps={{
                        style: { display: "none" },       // ✅ hides the underline indicator
                      }}
                      sx={{
                        minHeight: 25,
                        ".MuiTab-root": {
                          minHeight: 25,
                          textTransform: "none",          // ✅ keeps your case
                        },
                      }}
                    >
                      <Tab label="Model.py" />
                    </Tabs>
                  </Box>


                  {tabValue === 0 && (

                    <Editor
                      defaultLanguage="python"
                      defaultValue="// Start coding here..."
                      theme="vs-dark"
                    />)}
                </Paper>
              </Grid>


            </Grid>
          </Box>

        </>

      )
        : (<>
          <Grid container spacing={3}>
            <Grid size="auto">
              <div className='left'>
                <GridHeader>
                  {headerLabel}
                </GridHeader>
              </div>
            </Grid>
            <Grid size={6} />

            <Grid size="grow">
              <div className='right'>
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Python model page" arrow>
                    <IconButton aria-label="Python model" onClick={openPythonModelScreen} sx={{
                      '&:hover': {
                        backgroundColor: 'darkgrey',
                      },
                    }}>
                      <PythonIcon />
                    </IconButton>
                  </Tooltip>

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
                <Tab label="Loaded Models" sx={{ textTransform: 'none' }} />
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

          <><ExecuteModel open={openExecuteModel} onClose={setOpenExecuteModel} /></>
        </>)
      }

      <>
        <Dialog open={openTestDataFileUpload} onClose={handleCloseTestDataFileUpload}>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogContent>
            <FileUploadComponent
              onDrop={handleTestDataFileDrop}
              text="Drag and drop your images here"
              iconColor="#3f51b5"
              borderColor="#3f51b5"
              filesLimit={5}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseTestDataFileUpload} color="primary">
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

      </>
    </>
  )
}
