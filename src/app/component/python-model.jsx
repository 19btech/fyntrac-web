"use client"
import React from 'react'
import Stack from '@mui/material/Stack';
import PlayCircleOutlineOutlinedIcon from '@mui/icons-material/PlayCircleOutlineOutlined';
import Tab from '@mui/material/Tab';
import Models from '../component/models';
import CustomTabPanel from '../component/custom-tab-panel';
import { Button, Dialog, DialogActions, DialogContent, Divider, Tabs } from '@mui/material';
import axios from 'axios';
import GridHeader from '../component/gridHeader';
import '../common.css';
import { Typography } from "@mui/material";
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import ArrowBackIosNewOutlinedIcon from '@mui/icons-material/ArrowBackIosNewOutlined';
import { Paper, Box, IconButton, Tooltip } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { Chat } from "@mui/icons-material";
import { Settings } from "@mui/icons-material";
import { Code } from "@mui/icons-material";
import Editor from "@monaco-editor/react";

function PythonModel({ setOpenPythonModel }) {

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
        setOpenExecuteModel(true);
    };
    return (
        <>
            <Grid container spacing={3}>
                <Grid size="auto">
                    <div className='left'>
                        <GridHeader>
                            Python Model Builder
                        </GridHeader>
                    </div>
                </Grid>
                <Grid size={6} />

                <Grid size="grow">
                    <div className='right'>
                        <Stack direction="row" spacing={1}>
                            <Tooltip title="Back to main model screen" arrow>
                                <IconButton aria-label="python model" onClick={() => setOpenPythonModel(false)} sx={{
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

            <Box sx={{ flexGrow: 1, height: "81vh", p: 2, minWidth: "95vh", }}>
                <Grid container spacing={2} sx={{ height: "100%" }}>

                    {/* Column 1: Chat Window */}
                    <Grid xs={3}>   {/* Was 4 → reduced to give more space to editor */}
                        <Paper
                            elevation={3}
                            sx={{
                                height: "100%",
                                p: 2,
                                display: "flex",
                                flexDirection: "column",
                                minWidth: "25vw",   // ✅ ensures column never gets too thin
                            }}
                        >
                            <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
                                <p>Chat window (ChatGPT)</p>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Column 2: Icon Menu */}
                    <Grid xs={2}>
                        <Paper
                            elevation={3}
                            sx={{
                                height: "100%",
                                p: 2,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "flex-start",
                                gap: 2,
                                minWidth: "15vw",  // ✅ prevents icons column from collapsing
                            }}
                        >
                            <Tooltip title="Chat" arrow>
                                <IconButton>
                                    <Chat />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Settings" arrow>
                                <IconButton>
                                    <Settings />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Code" arrow>
                                <IconButton>
                                    <Code />
                                </IconButton>
                            </Tooltip>
                        </Paper>
                    </Grid>

                    {/* Column 3: Monaco Editor */}
                    <Grid xs={7}>   {/* Was 6 → gave it more space */}
                        <Paper elevation={3} sx={{ height: "100%", p: 2, minWidth: "38vw", }}>
                            <Editor
                                height="100%"
                                defaultLanguage="javascript"
                                defaultValue="// Start coding here..."
                                theme="vs-dark"
                            />
                        </Paper>
                    </Grid>

                </Grid>
            </Box>

        </>
    );
}

export default PythonModel;
