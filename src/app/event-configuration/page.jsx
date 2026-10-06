"use client"
import React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { alpha, useTheme } from '@mui/material/styles';

import CachedRoundedIcon from '@mui/icons-material/CachedRounded';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import Tab from '@mui/material/Tab';
import EventConfigurations from '../component/event-conigurations';
import CustomTabPanel from '../component/custom-tab-panel';
import { Container, Tabs, Divider, Card, Typography } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import '../common.css';

import { useTenant } from "../tenant-context";
import EventConfiguration from '../component/event-configuration';
import SuccessAlert from '../component/success-alert';

export default function EventConfigurationMain() {
    const { tenant } = useTenant();
    const theme = useTheme();
    const [panelIndex, setPanelIndex] = React.useState(0); // Initialize with the first tab index
    const [modelRefreshKey, setModelRefreshKey] = React.useState(0); // Example state for refresh key
    const headerLabel = 'Setup Events';
    const [openEventConfiguration, setOpenEventConfiguration] = React.useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = React.useState(false);
    const [successMessage, setSuccessMessage] = React.useState('');

    // Close handler for the page-level Add Event modal.
    // The modal calls onClose(true, message) on a successful save and onClose() on cancel.
    // Passing the raw setState as onClose caused setOpenEventConfiguration(true) on save,
    // which reopened the empty modal. This handler always closes and, on success, refreshes
    // the grid and shows a success toast.
    const handleEventConfigurationClose = (result, message) => {
        setOpenEventConfiguration(false);
        if (result === true) {
            setModelRefreshKey(prev => prev + 1);
            // Delay toast until after the dialog close animation (~300ms) so the
            // scrollbar reappear / viewport-width shift doesn't move the Snackbar.
            setTimeout(() => {
                setSuccessMessage(message || 'Event configuration saved successfully!');
                setShowSuccessMessage(true);
            }, 350);
        }
    };

    const handleModelChange = (event, newValue) => {
        setPanelIndex(newValue); // Update the panel index
    };

    const handleRefresh = () => {
        setModelRefreshKey(prev => prev + 1);
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
                // No hover lift: the whole grid would jump.
                '&:hover': { transform: 'none' },
                overflow: 'hidden',
            }}>
            <Box>
                <Box sx={{ width: '100%', display: 'flex', borderBottom: 1, borderColor: 'divider', alignItems: 'flex-start', margin: 0, padding: 0 }}>
                    <Tabs sx={{ width: '100%' }} value={panelIndex} onChange={handleModelChange} aria-label="Loaded Configurations">
                        <Tab label="Event Configurations" sx={{ textTransform: 'none' }} />
                    </Tabs>
                </Box>
                <CustomTabPanel value={panelIndex} index={0}>
                    <EventConfigurations refreshData={setModelRefreshKey} key={modelRefreshKey}> </EventConfigurations>
                </CustomTabPanel>
            </Box>
            </Card>
            <EventConfiguration open={openEventConfiguration} onClose={handleEventConfigurationClose} />
            <SuccessAlert
                open={showSuccessMessage}
                message={successMessage}
                onClose={() => setShowSuccessMessage(false)}
            />
        </Container>
        </Box>

    )
}
