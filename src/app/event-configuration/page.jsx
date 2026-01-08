"use client"
import React, { useEffect } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';

import CachedRoundedIcon from '@mui/icons-material/CachedRounded';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import Tab from '@mui/material/Tab';
import EventConfigurations from '../component/event-conigurations';
import CustomTabPanel from '../component/custom-tab-panel';
import { Tabs, Divider } from '@mui/material';
import axios from 'axios';
import Tooltip from '@mui/material/Tooltip';
import GridHeader from '../component/gridHeader';
import '../common.css';

import { useTenant } from "../tenant-context";
import EventConfiguration from '../component/event-configuration';
// import EventConfiguration from '../component/event-configuration';

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

export default function EventConfigurationMain() {
    const { tenant } = useTenant();
    const [panelIndex, setPanelIndex] = React.useState(0); // Initialize with the first tab index
    const [modelRefreshKey, setModelRefreshKey] = React.useState(0); // Example state for refresh key
    const [headerLabel, setHeaderLabel] = React.useState('Setup Events');
    const [open, setOpen] = React.useState(false);
    const [openEventConfiguration, setOpenEventConfiguration] = React.useState(false);

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

                            <Tooltip title="Refresh page" arrow>
                                <IconButton aria-label="refresh" onClick={handleRefresh} sx={{
                                    '&:hover': {
                                        backgroundColor: 'darkgrey',
                                    },
                                }}>
                                    <CachedRoundedIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Add Event">
                                <IconButton
                                    aria-label="add"
                                    onClick={() => setOpenEventConfiguration(true)}   // ✅ Correct
                                    sx={{
                                        '&:hover': {
                                            backgroundColor: 'darkgrey',
                                        },
                                    }}
                                >

                                    <AddOutlinedIcon />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </div>
                </Grid>
            </Grid >


            <Divider />

            <Box>
                <Box sx={{ width: '100%', display: 'flex', borderBottom: 1, borderColor: 'divider', alignItems: 'flex-start', margin: 0, padding: 0 }}>
                    <Tabs sx={{ width: '90rem' }} value={panelIndex} onChange={handleModelChange} aria-label="Loaded Configurations">
                        <Tab label="Event Configurations" sx={{ textTransform: 'none' }} />
                    </Tabs>
                </Box>
                <CustomTabPanel value={panelIndex} index={panelIndex}>
                    <EventConfigurations refreshData={setModelRefreshKey} key={modelRefreshKey}> </EventConfigurations>
                </CustomTabPanel>
            </Box>
            <EventConfiguration open={openEventConfiguration} onClose={setOpenEventConfiguration} />
        </>

    )
}
