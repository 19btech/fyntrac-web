"use client"
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';

import CachedRoundedIcon from '@mui/icons-material/CachedRounded';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import FileUploadComponent from '../component/file-upload'
import Tab from '@mui/material/Tab';
import CustomTabPanel from '../component/custom-tab-panel';
import { Button, Tabs, Divider, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import axios from 'axios';
import Tooltip from '@mui/material/Tooltip';
import GridHeader from '../component/gridHeader';
import '../common.css';

import { useTenant } from "../tenant-context";
import CustomTablesList from '../component/custom-tables';
import dynamic from 'next/dynamic';

// Dynamically import the CustomTableModal component
const CreateTableDialog = dynamic(() => import('../component/custom-table'), {
    ssr: false
});

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

export default function CustomTablesMain() {
    const [panelIndex, setPanelIndex] = React.useState(0);
    const [modelRefreshKey, setModelRefreshKey] = React.useState(0);
    const [headerLabel, setHeaderLabel] = React.useState('Custom Tables');
    const [openCustomTableModal, setOpenCustomTableModal] = React.useState(false);
    const [tableType, setTableType] = React.useState('REFERENCE');
    const initialRows = [];
    const [rows, setRows] = useState(initialRows);
    const { tenant, user } = useTenant();
    const [isDataFetched, setIsDataFetched] = useState(false);
    const [openFileUpload, setOpenFileUpload] = React.useState(false);
    const baseURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI;
    const fetchCustomTablesCall = `${baseURL}/fyntrac/custom-table/reference-tables`;
    const [snackbar, setSnackbar] = React.useState({
        open: false,
        message: '',
        severity: 'success'
    });

    const headers = {
        'X-Tenant': tenant,
        'X-User-Id': user?.id || '',
        Accept: '*/*',
        'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
    };
    const fetchCustomTables = () => {

        console.log('Attempting to fetch from:', fetchCustomTablesCall);
        axios.get(fetchCustomTablesCall, {
            headers: headers
        })
            .then(response => {
                console.log('Custom Tables', response.data.data);
                setRows(response.data.data);
            })
            .catch(error => {
                console.error('Error fetching custom tables:', error);
            });
    };

    // Fetch data when the component mounts or when refreshTrigger changes
    useEffect(() => {
        fetchCustomTables();
        setIsDataFetched(true);
    }, [isDataFetched]);

    const handleTableTypeChange = (event, newValue) => {
        setPanelIndex(newValue);
        console.log('Panel index changed:', newValue);
        if (newValue === 1) {
            setTableType('OPERATIONAL');
        } else {
            setTableType('REFERENCE');
        }
    };

    const handleRefresh = () => {
        setModelRefreshKey(prev => prev + 1);
    };

    // This function should be passed as onSuccess


    const handleSuccess = async (tableData) => {
        console.log('Table created successfully:', tableData);

        // Show success message
        setSnackbar({
            open: true,
            message: `Table "${tableData.tableName}" created successfully!`,
            severity: 'success'
        });

        // Add delay before showing success message
        await new Promise(resolve => setTimeout(resolve, 5000)); // 1 second delay

        setOpenCustomTableModal(true);

        // You could also refresh your tables list here
        // fetchTables(); // if you have a function to refresh the table list
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const handleFileDrop = (acceptedFiles) => {

        const serviceURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/fyntrac/custom-table/data-upload';
        const formData = new FormData();
        for (let i = 0; i < acceptedFiles.length; i++) {
            formData.append('files', acceptedFiles[i]);
        }

        axios.post(serviceURL, formData, {
            headers: headers
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


    const handleCloseFileUpload = () => {
        setOpenFileUpload(false);
    };

    const handleOpenFileUpload = () => {
        setOpenFileUpload(true);
    };
    return (
        <>
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

                            <IconButton aria-label="upload rule file" onClick={handleOpenFileUpload} sx={{
                                '&:hover': {
                                    backgroundColor: 'darkgrey',
                                },
                            }}>
                                <Tooltip title="Upload File">
                                    <FileUploadOutlinedIcon />
                                </Tooltip>
                            </IconButton>

                            <Tooltip title="Refresh page" arrow>
                                <IconButton aria-label="refresh" onClick={handleRefresh} sx={{
                                    '&:hover': {
                                        backgroundColor: 'darkgrey',
                                    },
                                }}>
                                    <CachedRoundedIcon />
                                </IconButton>
                            </Tooltip>

                            <IconButton
                                aria-label="add"
                                onClick={() => setOpenCustomTableModal(true)}
                                sx={{
                                    '&:hover': {
                                        backgroundColor: 'darkgrey',
                                    },
                                }}
                            >
                                <AddOutlinedIcon />
                            </IconButton>
                        </Stack>
                    </div>
                </Grid>
            </Grid>

            <Divider />

            <Box>
                <Box sx={{ width: '100%', display: 'flex', borderBottom: 1, borderColor: 'divider', alignItems: 'flex-start', margin: 0, padding: 0 }}>
                    <Tabs sx={{ width: '90rem' }} value={panelIndex} onChange={handleTableTypeChange} aria-label="Custom Tables">
                        <Tab label="Reference Tables" sx={{ textTransform: 'none' }} />
                        <Tab label="Operational Tables" sx={{ textTransform: 'none' }} />
                    </Tabs>
                </Box>
                <CustomTabPanel value={panelIndex} index={0}>
                    <CustomTablesList refreshData={setModelRefreshKey} tableType={'REFERENCE'} key={modelRefreshKey} referenceTables={rows} />
                </CustomTabPanel>
                <CustomTabPanel value={panelIndex} index={1}>
                    <CustomTablesList refreshData={setModelRefreshKey} tableType={'OPERATIONAL'} key={modelRefreshKey} referenceTables={rows} />
                </CustomTabPanel>
            </Box>
            {tableType === 'OPERATIONAL' && (
                <CreateTableDialog open={openCustomTableModal} onSuccess={handleSuccess} onClose={setOpenCustomTableModal} tableType={'OPERATIONAL'} tables={rows} />
            )}

            {tableType === 'REFERENCE' && (
                <CreateTableDialog open={openCustomTableModal} onSuccess={handleSuccess} onClose={setOpenCustomTableModal} tableType={'REFERENCE'} />
            )}

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
        </>


    )
}