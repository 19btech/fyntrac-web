"use client"
import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { dataloaderApi } from '../services/api-client';
import {
    Typography,
    Box,
    Switch,
    IconButton,
    Tooltip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    CircularProgress,
    Alert,
} from '@mui/material';
import SuccessAlert from '../component/success-alert';
import ErrorAlert from '../component/error-alert';
import { styled, alpha } from '@mui/material/styles';
import { useTenant } from "../tenant-context";
import { DeleteOutlineOutlined, EditOutlined } from '@mui/icons-material';
import dynamic from 'next/dynamic';

// Dynamically import the EventConfiguration component (modal/dialog)
const EventConfigurationModal = dynamic(() => import('./event-configuration'), {
    ssr: false
});

const Android12Switch = styled(Switch)(({ theme }) => ({
    padding: 8,
    '& .MuiSwitch-track': {
        borderRadius: 22 / 2,
        '&::before, &::after': {
            content: '""',
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 16,
            height: 16,
        },
        '&::before': {
            backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
                theme.palette.getContrastText(theme.palette.primary.main),
            )}" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>')`,
            left: 12,
        },
        '&::after': {
            backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
                theme.palette.getContrastText(theme.palette.primary.main),
            )}" d="M19,13H5V11H19V13Z" /></svg>')`,
            right: 12,
        },
    },
    '& .MuiSwitch-thumb': {
        boxShadow: 'none',
        width: 16,
        height: 16,
        margin: 2,
    },
}));

const TRIGGER_LABELS = {
    ON_MODEL_EXECUTION: 'On Model Execution',
    ON_INSTRUMENT_ADD: 'On Instrument Add',
    ON_TRANSACTION_POST: 'On Transaction Post',
    ON_ATTRIBUTE_CHANGE: 'On Attribute Change',
    ON_CUSTOM_DATA_TRIGGER: 'On Custom Data Trigger',
    ON_REPLAY: 'On Replay',
};

// Soft-deleted events are never listed.
const liveEvents = (data) => (Array.isArray(data) ? data.filter(e => e && !e.isDeleted) : []);

function EventConfigurationsList({ refreshData }) {
    const { tenant, user } = useTenant();

    const initialRows = [];

    const [rowsPerPage] = useState(10);
    const [isDataFetched, setIsDataFetched] = useState(false);
    const [loadingRows, setLoadingRows] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [statusBusyId, setStatusBusyId] = useState(null);
    const [rows, setRows] = useState(initialRows);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showErrorMessage, setShowErrorMessage] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [open, setOpen] = useState(false);
    const [editData, setEditData] = useState(null);
    const [loadingEditId, setLoadingEditId] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Delete confirmation dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState(null);

    const fetchEventConfiguration = (eventId) => {
        setLoadingEditId(eventId);
        dataloaderApi.get(`/fyntrac/event-configurations/get/${eventId}`)
            .then(response => {
                setEditData(response.data);
                setOpen(true);
            })
            .catch(error => {
                console.error('Error fetching Event configuration [EventId]:', eventId, error);
                setErrorMessage(error.response?.data?.message || `Event "${eventId}" could not be opened. Please try again.`);
                setShowErrorMessage(true);
            })
            .finally(() => setLoadingEditId(null));
    };

    async function updateEventConfigurationStatus(id, isActive) {
        try {
            const response = await dataloaderApi.put(
                `/fyntrac/event-configurations/update/status/${id}/${isActive}`,
                null,
                { headers: { 'X-User-Id': user?.id || '' } }
            );
            return response.data;
        } catch (error) {
            console.error('Error updating status:', error.response?.data || error.message || error);
            throw error;
        }
    }

    async function deleteEventConfiguration(eventId) {
        try {
            const response = await dataloaderApi.delete(
                `/fyntrac/event-configurations/delete/${eventId}`,
                { headers: { 'X-User-Id': user?.id || '' } }
            );
            return response.data;
        } catch (error) {
            console.error('Error deleting:', error.response?.data || error.message || error);
            throw error;
        }
    }

    const handleEventConfigurationAction = async (row, isActive) => {
        if (statusBusyId) return;
        setStatusBusyId(row.eventId);
        try {
            const response = await updateEventConfigurationStatus(row.eventId, isActive);
            const saved = typeof response?.isActive === 'boolean' ? response.isActive : isActive;
            setRows(prevRows =>
                prevRows.map(r =>
                    r.eventId === row.eventId ? { ...r, isActive: saved } : r
                )
            );

            setSuccessMessage(`${row.eventName || row.eventId} is now ${saved ? 'active' : 'inactive'}.`);
            setShowSuccessMessage(true);
        } catch (error) {
            console.error('Error in handleEventConfigurationAction:', error);
            setErrorMessage(error.response?.data?.message || error.message || 'An error occurred');
            setShowErrorMessage(true);
        } finally {
            setStatusBusyId(null);
        }
    };

    // Open delete confirmation dialog
    const handleDeleteClick = (row) => {
        setEventToDelete(row);
        setDeleteDialogOpen(true);
    };

    // Handle confirmed delete
    const handleConfirmDelete = async () => {
        if (!eventToDelete || deleting) return;
        setDeleting(true);

        try {
            await deleteEventConfiguration(eventToDelete.eventId);
            setRows(prevRows => prevRows.filter(r => r.eventId !== eventToDelete.eventId));

            setSuccessMessage('Event configuration deleted successfully!');
            setShowSuccessMessage(true);
            refreshGridData();

            // Close the confirmation dialog
            setDeleteDialogOpen(false);
            setEventToDelete(null);
        } catch (error) {
            console.error('Error in handleConfirmDelete:', error);
            // The event still exists: keep the dialog open and say why.
            setErrorMessage(error.response?.data?.message || error.message || 'An error occurred while deleting');
            setShowErrorMessage(true);
        } finally {
            setDeleting(false);
        }
    };

    // Handle cancel delete
    const handleCancelDelete = () => {
        if (deleting) return;
        setDeleteDialogOpen(false);
        setEventToDelete(null);
    };

    // Function to refresh the grid data
    const refreshGridData = () => {
        fetchModels();
        setRefreshTrigger(prev => prev + 1);
    };

    const columns = [
        { field: 'eventId', headerName: 'Event Id', width: 200, editable: false },
        {
            field: 'eventName',
            headerName: 'Event Name',
            width: 250,
            editable: false,
        },
        {
            field: 'triggerType',
            headerName: 'Trigger Type',
            width: 200,
            editable: false,
            valueGetter: (_value, row) => {
                const type = row.triggerSetup?.triggerType ?? row.triggerType;
                return type ? (TRIGGER_LABELS[type] ?? type) : '—';
            },
        },
        {
            field: 'priority',
            headerName: 'Priority',
            width: 110,
            editable: false,
        },
        {
            field: 'description',
            headerName: 'Description',
            flex: 1,
            minWidth: 200,
            editable: false,
        },
        {
            field: 'isActive',
            headerName: 'Active / Inactive',
            width: 150,
            editable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                    <Tooltip title={params.row.isActive ? 'Active - Click to deactivate' : 'Inactive - Click to activate'}>
                        <Android12Switch
                            checked={Boolean(params.row.isActive)}
                            disabled={statusBusyId === params.row.eventId}
                            onChange={(e) => {
                                e.stopPropagation();
                                handleEventConfigurationAction(params.row, !params.row.isActive);
                            }}
                            sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                    color: '#1e88e5',
                                    '&:hover': {
                                        backgroundColor: 'rgba(30, 136, 229, 0.08)',
                                    },
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                    backgroundColor: '#1e88e5',
                                },
                                '& .MuiSwitch-switchBase:not(.Mui-checked)': {
                                    color: '#6d6d6d',
                                    '&:hover': {
                                        backgroundColor: 'rgba(109, 109, 109, 0.08)',
                                    },
                                },
                                '& .MuiSwitch-switchBase:not(.Mui-checked) + .MuiSwitch-track': {
                                    backgroundColor: '#6d6d6d',
                                },
                            }}
                        />
                    </Tooltip>
                </Box>
            ),
        },
        {
            field: 'action',
            headerName: 'Action',
            headerAlign: 'center',
            width: 110,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', height: '100%' }}>
                    <Tooltip title='Edit Event Configuration' placement="left">
                        <IconButton
                            size="small"
                            onClick={() => handleEdit(params.row)}
                            disabled={loadingEditId === params.row.eventId}
                            sx={{ color: '#14213d', bgcolor: alpha('#14213d', 0.06), borderRadius: 1.5, '&:hover': { bgcolor: alpha('#14213d', 0.14) } }}
                        >
                            {loadingEditId === params.row.eventId
                                ? <CircularProgress size={14} thickness={5} sx={{ color: '#14213d' }} />
                                : <EditOutlined sx={{ fontSize: 16 }} />
                            }
                        </IconButton>
                    </Tooltip>
                    <Tooltip title='Delete Event Configuration' placement="right">
                        <IconButton size="small" onClick={() => handleDeleteClick(params.row)}
                            sx={{ color: '#ef4444', bgcolor: alpha('#ef4444', 0.06), borderRadius: 1.5, '&:hover': { bgcolor: alpha('#ef4444', 0.14) } }}>
                            <DeleteOutlineOutlined sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
    ];

    const handleEdit = (rowData) => {
        fetchEventConfiguration(rowData.eventId);
    };

    const fetchModels = () => {
        setLoadingRows(true);
        dataloaderApi.get('/fyntrac/event-configurations/all')
            .then(response => {
                setRows(liveEvents(response.data));
                setLoadError('');
            })
            .catch(error => {
                console.error('Error fetching event configurations:', error);
                setLoadError(error.response?.data?.message || 'Events could not be loaded.');
                setRows([]);
            })
            .finally(() => setLoadingRows(false));
    };

    // Fetch data when the component mounts or when refreshTrigger changes
    useEffect(() => {
        fetchModels();
        setIsDataFetched(true);
    }, [isDataFetched, refreshData, refreshTrigger]);

    return (
        <div>
            {loadError && (
                <Alert
                    severity="error"
                    variant="outlined"
                    sx={{ mb: 1.5, borderRadius: 2 }}
                    action={<Button color="inherit" size="small" onClick={fetchModels} sx={{ fontWeight: 700 }}>Retry</Button>}
                >
                    {loadError}
                </Alert>
            )}

            <Box
                sx={{
                    width: '100%',
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
                    animation: 'fadeInUp 0.35s ease both',
                    '@keyframes fadeInUp': {
                        from: { opacity: 0, transform: 'translateY(12px)' },
                        to: { opacity: 1, transform: 'translateY(0)' },
                    },
                }}
            >
                <DataGrid
                    rows={rows}
                    columns={columns}
                    initialState={{
                        pagination: { paginationModel: { pageSize: rowsPerPage } },
                    }}
                    pageSizeOptions={[5, 10, 20]}
                    paginationMode='client'
                    disableRowSelectionOnClick
                    autoHeight
                    loading={loadingRows}
                    localeText={{ noRowsLabel: loadError ? 'Events could not be loaded.' : 'No events yet.' }}
                    sx={{
                        border: 0,
                        fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
                        fontSize: '0.85rem',
                        '& *': { fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' },
                        '& .MuiDataGrid-columnHeaders': {
                            bgcolor: '#f8fafc',
                            color: '#475569',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
                            letterSpacing: 0.5,
                            textTransform: 'uppercase',
                            borderBottom: '2px solid #e2e8f0',
                        },
                        '& .MuiDataGrid-columnHeader': { bgcolor: '#f8fafc' },
                        '& .MuiDataGrid-columnSeparator': { display: 'none' },
                        '& .MuiDataGrid-scrollbarFiller': { bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
                        '& .MuiDataGrid-filler': { bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
                        '& .MuiDataGrid-sortIcon, & .MuiDataGrid-menuIconButton': { color: '#94a3b8' },
                        '& .MuiDataGrid-row': {
                            transition: 'background 0.15s',
                            '&:hover': { bgcolor: alpha('#14213d', 0.03) },
                            '&.Mui-selected': { bgcolor: alpha('#14213d', 0.06) },
                        },
                        '& .MuiDataGrid-cell': {
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            display: 'flex',
                            alignItems: 'center',
                        },
                        '& .MuiDataGrid-footerContainer': {
                            borderTop: '1px solid',
                            borderColor: 'divider',
                            bgcolor: alpha('#14213d', 0.02),
                        },
                        '& .MuiTablePagination-root': {
                            fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
                            fontSize: '0.8rem',
                        },
                    }}
                />
            </Box>

            {/* Event Configuration Modal */}
            <EventConfigurationModal
                open={open}
                onClose={(result, message) => {
                    setOpen(false);
                    setEditData(null);

                    if (result === true) {
                        refreshGridData();
                        setSuccessMessage(message || 'Event configuration saved successfully!');
                        setShowSuccessMessage(true);
                    }
                }}
                editData={editData}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleCancelDelete}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
            >
                <DialogTitle id="delete-dialog-title">
                    Confirm Delete
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="delete-dialog-description">
                        Are you sure you want to delete the event configuration "{eventToDelete?.eventName}" (ID: {eventToDelete?.eventId})?
                        This action cannot be undone. Models that read this event will fail on their next run until
                        they are updated.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelDelete} color="primary" disabled={deleting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        color="error"
                        variant="contained"
                        disabled={deleting}
                        autoFocus
                    >
                        {deleting ? 'Deleting…' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Alerts */}
            {showSuccessMessage && (
                <SuccessAlert
                    title="Success!"
                    message={successMessage}
                    open={showSuccessMessage}
                    onClose={() => setShowSuccessMessage(false)}
                />
            )}
            {showErrorMessage && (
                <ErrorAlert
                    title="Error!"
                    message={errorMessage}
                    open={showErrorMessage}
                    onClose={() => setShowErrorMessage(false)}
                />
            )}
        </div>
    );
}

export default EventConfigurationsList;