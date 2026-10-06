"use client"
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { alpha, useTheme } from '@mui/material/styles';

import CachedRoundedIcon from '@mui/icons-material/CachedRounded';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import Tab from '@mui/material/Tab';
import CustomTabPanel from '../component/custom-tab-panel';
import { Container, Tabs, Divider, Card, Snackbar, Alert, Slide, Typography } from '@mui/material';
import { dataloaderApi } from '../services/api-client';
import Tooltip from '@mui/material/Tooltip';
import '../common.css';

import { useTenant } from "../tenant-context";
import CustomTablesList from '../component/custom-tables';
import dynamic from 'next/dynamic';

// Dynamically import the CustomTableModal component
const CreateTableDialog = dynamic(() => import('../component/custom-table'), {
    ssr: false
});

export default function CustomTablesMain() {
    const theme = useTheme();
    const [panelIndex, setPanelIndex] = React.useState(0);
    const [modelRefreshKey, setModelRefreshKey] = React.useState(0);
    const headerLabel = 'Setup Custom Tables';
    const [openCustomTableModal, setOpenCustomTableModal] = React.useState(false);
    const [tableType, setTableType] = React.useState('REFERENCE');
    const initialRows = [];
    const [rows, setRows] = useState(initialRows);
    const { tenant, user } = useTenant();
    const baseURL = "";
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
    };

    const fetchCustomTables = () => {

        dataloaderApi.get(fetchCustomTablesCall, {
            headers: headers
        })
            .then(response => {
                const data = Array.isArray(response.data?.data) ? response.data.data : [];
                setRows(data.filter(t => t && !t.isDeleted));
            })
            .catch(error => {
                console.error('Error fetching custom tables:', error);
                setSnackbar({ open: true, message: 'Reference tables could not be loaded. Use Refresh to try again.', severity: 'error' });
            });
    };

    // On load and whenever a list changes (create, edit, delete, Refresh), so the reference tables
    // offered to operational tables are current.
    useEffect(() => {
        fetchCustomTables();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modelRefreshKey]);

    const handleTableTypeChange = (event, newValue) => {
        setPanelIndex(newValue);
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


    // Handler used by the create-table dialog when it finishes (success or cancel).
    // The modal calls onClose(true) on a successful save and onClose() on cancel.
    // We must always close (false) and, on success, refresh the page-level data so
    // the new table appears in the grid.
    const handleDialogClose = (result) => {
        setOpenCustomTableModal(false);
        if (result === true) {
            setModelRefreshKey(prev => prev + 1);
            setSnackbar({
                open: true,
                message: 'Custom table created successfully!',
                severity: 'success'
            });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
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
                    <Tooltip title="Add Table">
                        <IconButton aria-label="add" onClick={() => setOpenCustomTableModal(true)} sx={{ bgcolor: 'white', boxShadow: 1, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', '&:hover': { bgcolor: 'grey.50', boxShadow: 3, transform: 'scale(1.08)' }, '&:active': { transform: 'scale(0.94)' } }}>
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
            </Card>
            {tableType === 'OPERATIONAL' && (
                <CreateTableDialog open={openCustomTableModal} onClose={handleDialogClose} tableType={'OPERATIONAL'} tables={rows} />
            )}

            {tableType === 'REFERENCE' && (
                <CreateTableDialog open={openCustomTableModal} onClose={handleDialogClose} tableType={'REFERENCE'} tables={rows} />
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                sx={{ top: '55px', '@media (min-width:600px)': { top: '55px' } }}
                slots={{ transition: Slide }} slotProps={{ transition: { direction: 'left' } }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    variant="standard"
                    sx={{
                        borderRadius: 3, fontWeight: 600, fontSize: '0.85rem',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.18)', minWidth: 280,
                        bgcolor: snackbar.severity === 'success' ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.10)',
                        border: snackbar.severity === 'success' ? '1px solid rgba(22,163,74,0.3)' : '1px solid rgba(220,38,38,0.3)',
                        color: snackbar.severity === 'success' ? '#15803d' : '#dc2626',
                        '& .MuiAlert-icon': { color: snackbar.severity === 'success' ? '#16a34a' : '#dc2626' },
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
        </Box>


    )
}