"use client"
import React, { useEffect } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { styled, alpha, useTheme } from '@mui/material/styles';

import CachedRoundedIcon from '@mui/icons-material/CachedRounded';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import Tab from '@mui/material/Tab';
import EventConfigurations from '../component/event-conigurations';
import CustomTabPanel from '../component/custom-tab-panel';
import { Container, Tabs, Divider, Card, Typography } from '@mui/material';
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
    const theme = useTheme();
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
        setModelRefreshKey(prev => prev + 1);
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
                        {headerLabel}
                    </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Refresh page" arrow>
                        <IconButton aria-label="refresh" onClick={handleRefresh} sx={{ bgcolor: 'white', boxShadow: 1, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', '&:hover': { bgcolor: 'grey.50', boxShadow: 3, transform: 'scale(1.08)' }, '&:active': { transform: 'scale(0.94)' } }}>
                            <CachedRoundedIcon color="action" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Add Event">
                        <IconButton aria-label="add" onClick={() => setOpenEventConfiguration(true)} sx={{ bgcolor: 'white', boxShadow: 1, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', '&:hover': { bgcolor: 'grey.50', boxShadow: 3, transform: 'scale(1.08)' }, '&:active': { transform: 'scale(0.94)' } }}>
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
                    <Tabs sx={{ width: '90rem' }} value={panelIndex} onChange={handleModelChange} aria-label="Loaded Configurations">
                        <Tab label="Event Configurations" sx={{ textTransform: 'none' }} />
                    </Tabs>
                </Box>
                <CustomTabPanel value={panelIndex} index={panelIndex}>
                    <EventConfigurations refreshData={setModelRefreshKey} key={modelRefreshKey}> </EventConfigurations>
                </CustomTabPanel>
            </Box>
            </Card>
            <EventConfiguration open={openEventConfiguration} onClose={setOpenEventConfiguration} />
        </Container>
        </Box>

    )
}
