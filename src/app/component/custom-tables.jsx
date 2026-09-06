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
    Chip
} from '@mui/material';
import SuccessAlert from '../component/success-alert';
import ErrorAlert from '../component/error-alert';
import { styled, alpha } from '@mui/material/styles';
import { useTenant } from "../tenant-context";
import { DeleteOutlineOutlined, EditOutlined, Add, DataArray } from '@mui/icons-material';
import dynamic from 'next/dynamic';

// Dynamically import the CustomTableModal component
const CreateTableDialog = dynamic(() => import('./custom-table'), {
    ssr: false
});

function CustomTablesList({ refreshData, tableType, referenceTables }) {
    const { tenant, user } = useTenant();

    const initialRows = [];

    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [isDataFetched, setIsDataFetched] = useState(false);
    const [rows, setRows] = useState(initialRows);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showErrorMessage, setShowErrorMessage] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [open, setOpen] = useState(false);
    const [editData, setEditData] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Delete confirmation dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [tableToDelete, setTableToDelete] = useState(null);
    // Operational tables that will also be soft-deleted if tableToDelete is a REFERENCE table
    // they depend on. Informational only - the backend cascades the delete regardless; this is
    // just so the confirmation dialog can tell the user upfront.
    const [dependentTables, setDependentTables] = useState([]);

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

    const fetchCustomTable = (tableId, fallbackRow) => {
        dataloaderApi.get(`/fyntrac/custom-table/get/${tableId}`)
            .then(response => {
                const metadata = response.data;
                console.log('Custom table [TableId]:', tableId, metadata.data);
                setEditData(metadata);
                setOpen(true);
            })
            .catch(error => {
                console.warn('Could not fetch custom table detail, using row data as fallback.');
                // Fall back to opening the modal with available row data
                if (fallbackRow) {
                    setEditData({ data: fallbackRow });
                    setOpen(true);
                }
            });
    };

    async function updateCustomTableStatus(id, isActive) {
        try {
            const response = await dataloaderApi.put(`/fyntrac/custom-table/update/status/${id}/${isActive}`);
            return response.data;
        } catch (error) {
            console.error('Error updating status:', error.response?.data || error.message || error);
            throw error;
        }
    }

    async function deleteCustomTable(tableId) {
        try {
            // Soft delete: the backend flags isDeleted on the definition (and cascades across
            // a REFERENCE/OPERATIONAL pair - see CustomTableDefinitionService.softDeleteById).
            // It never drops the physical collection or its data.
            const response = await dataloaderApi.delete(`/fyntrac/custom-table/delete/${tableId}`);
            // ApiResponseRecord shape: { success, message, data, error }. `data` here is the
            // list of table-definition ids that were soft-deleted (the requested one, plus any
            // cascaded REFERENCE/OPERATIONAL counterpart).
            return response.data?.data ?? [];
        } catch (error) {
            console.error('Error deleting table:', error.response?.data || error.message || error);
            throw error;
        }
    }

    const handleCustomTableAction = async (row, isActive) => {
        try {
            const response = await updateCustomTableStatus(row.id, isActive);
            row.isActive = response.isActive;
            setRows(prevRows =>
                prevRows.map(r =>
                    r.id === row.id ? { ...r, isActive: isActive } : r
                )
            );

            setSuccessMessage('Status updated successfully!');
            setShowSuccessMessage(true);
        } catch (error) {
            console.error('Error in handleCustomTableAction:', error);
            setErrorMessage(error.response?.data?.message || error.message || 'An error occurred');
            setShowErrorMessage(true);
        }
    };

    // Open delete confirmation dialog. For a REFERENCE table, look up which OPERATIONAL tables
    // still depend on it so the dialog can tell the user they'll be soft-deleted too - the
    // backend cascades this automatically, this is purely informational.
    const handleDeleteClick = async (row) => {
        setTableToDelete(row);
        setDependentTables([]);
        setDeleteDialogOpen(true);

        if (tableType === 'REFERENCE') {
            try {
                const opResponse = await dataloaderApi.get('/fyntrac/custom-table/operational-tables');
                const opTables = Array.isArray(opResponse.data?.data) ? opResponse.data.data : [];
                const dependents = opTables
                    .filter(t => t && !t.isDeleted && t.referenceTable === row.tableName)
                    .map(t => t.tableName)
                    .filter(Boolean);
                setDependentTables(dependents);
            } catch (depErr) {
                console.error('Failed to look up operational dependencies before delete:', depErr);
            }
        }
    };

    // Handle confirmed delete. Soft delete cascades server-side across a REFERENCE/OPERATIONAL
    // pair (see CustomTableDefinitionService.softDeleteById) - nothing to block here, the physical
    // data is never touched.
    const handleConfirmDelete = async () => {
        if (!tableToDelete) return;

        try {
            const deletedIds = await deleteCustomTable(tableToDelete.id);
            setRows(prevRows =>
                prevRows.map(r =>
                    deletedIds.includes(r.id) ? { ...r, isDeleted: true } : r
                )
            );

            setSuccessMessage(
                dependentTables.length > 0
                    ? `Custom table deleted successfully, along with linked operational table` +
                      `${dependentTables.length > 1 ? 's' : ''}: ${dependentTables.join(', ')}.`
                    : 'Custom table deleted successfully!'
            );
            setShowSuccessMessage(true);
            refreshGridData();

            // Close the confirmation dialog
            setDeleteDialogOpen(false);
            setTableToDelete(null);
            setDependentTables([]);
        } catch (error) {
            console.error('Error in handleConfirmDelete:', error);
            setErrorMessage(error.response?.data?.error || error.response?.data?.message || error.message || 'An error occurred while deleting');
            setShowErrorMessage(true);
            // Close the confirmation dialog even on error
            setDeleteDialogOpen(false);
            setTableToDelete(null);
            setDependentTables([]);
        }
    };

    // Handle cancel delete
    const handleCancelDelete = () => {
        setDeleteDialogOpen(false);
        setTableToDelete(null);
        setDependentTables([]);
    };

    // Function to refresh the grid data
    const refreshGridData = () => {
        fetchCustomTables();
        setRefreshTrigger(prev => prev + 1);
        // Also bump the parent page key so the reference-table list (used by the
        // operational tab's reference dropdown) refetches.
        if (typeof refreshData === 'function') {
            refreshData(prev => (typeof prev === 'number' ? prev + 1 : 1));
        }
    };

    const handleViewData = (tableId) => {
        console.log('View data for table:', tableId);
        // Navigate to data view page
    };

    const handleEdit = (rowData) => {
        // Sample rows have string IDs (e.g. 's-ref-1') — open modal directly
        if (typeof rowData.id === 'string' && rowData.id.startsWith('s-')) {
            setEditData({ data: rowData });
            setOpen(true);
        } else {
            fetchCustomTable(rowData.id, rowData);
        }
    };

    const columns = [
        {
            field: 'tableName',
            headerName: 'Table Name',
            width: 200,
            editable: false,
            renderCell: (params) => (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",        // **vertical centering**
                        height: "100%",
                        width: "100%"
                    }}
                >
                    <Typography
                        variant="subtitle2"
                        fontWeight="bold"
                        color="primary"
                        sx={{ lineHeight: 1 }}         // keeps text cleanly centered
                    >
                        {params.value}
                    </Typography>
                </Box>
            )
        },
        {
            field: 'description',
            headerName: 'Description',
            flex: 1,
            minWidth: 150,
            editable: false,
        },
        {
            field: 'tableType',
            headerName: 'Type',
            width: 150,
            editable: false,
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    sx={{
                        bgcolor: params.value === 'OPERATIONAL'
                            ? 'rgba(249,115,22,0.12)'
                            : 'rgba(14,165,233,0.12)',
                        color: params.value === 'OPERATIONAL'
                            ? '#c2410c'
                            : '#0369a1',
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        letterSpacing: 0.5,
                        minWidth: 100,
                        borderRadius: 1,
                        '& .MuiChip-label': { px: 1 },
                    }}
                    size="small"
                />
            ),
        },
        {
            field: 'referenceColumn',
            headerName: 'Reference Field',
            width: 150,
            editable: false,
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    size="small"
                    sx={{
                        bgcolor: 'rgba(34,197,94,0.10)',
                        color: '#15803d',
                        fontWeight: 600,
                        fontSize: '0.72rem',
                        borderRadius: 1,
                    }}
                />
            ),
        },
        {
            field: 'columns',
            headerName: 'Columns',
            width: 120,
            editable: false,
            renderCell: (params) => (
                <Chip
                    label={`${params.value.length} columns`}
                    size="small"
                    sx={{
                        bgcolor: 'rgba(99,102,241,0.10)',
                        color: '#4338ca',
                        fontWeight: 600,
                        fontSize: '0.72rem',
                        borderRadius: 1,
                    }}
                />
            ),
        },
        {
            field: 'primaryKeys',
            headerName: 'Primary Keys',
            width: 200,
            editable: false,
            renderCell: (params) => (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',   // ✅ vertical centering
                        height: '100%',
                        width: '100%',
                        gap: 0.5,
                        flexWrap: 'wrap',
                    }}
                >
                    {params.value.slice(0, 2).map((pk, idx) => (
                        <Chip
                            key={idx}
                            label={pk}
                            size="small"
                            sx={{
                                bgcolor: 'rgba(20,33,61,0.08)',
                                color: '#14213d',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                borderRadius: 1,
                                lineHeight: 1,
                            }}
                        />
                    ))}

                    {params.value.length > 2 && (
                        <Chip
                            label={`+${params.value.length - 2}`}
                            size="small"
                            sx={{
                                bgcolor: 'rgba(148,163,184,0.15)',
                                color: '#475569',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                borderRadius: 1,
                                lineHeight: 1,
                            }}
                        />
                    )}
                </Box>
            ),
        }
        ,
        {
            field: 'action',
            headerName: 'Action',
            headerAlign: 'center',
            width: 110,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', height: '100%' }}>
                    <Tooltip title='Edit Custom Table' placement="left">
                        <IconButton size="small" onClick={() => handleEdit(params.row)}
                            sx={{ color: '#14213d', bgcolor: alpha('#14213d', 0.06), borderRadius: 1.5, '&:hover': { bgcolor: alpha('#14213d', 0.14) } }}>
                            <EditOutlined sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title='Delete Custom Table' placement="right">
                        <IconButton size="small" onClick={() => handleDeleteClick(params.row)}
                            sx={{ color: '#ef4444', bgcolor: alpha('#ef4444', 0.06), borderRadius: 1.5, '&:hover': { bgcolor: alpha('#ef4444', 0.14) } }}>
                            <DeleteOutlineOutlined sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
    ];

    const fetchCustomTables = () => {
        const endpoint = tableType === 'OPERATIONAL'
            ? '/fyntrac/custom-table/operational-tables'
            : '/fyntrac/custom-table/reference-tables';

        dataloaderApi.get(endpoint)
            .then(response => {
                console.log('Custom Tables', response.data.data);
                const data = response.data.data;
                if (Array.isArray(data) && data.length > 0) {
                    setRows(data);
                }
                // else keep sample rows
            })
            .catch(error => {
                // keep sample rows on error
            });
    };

    // Fetch data when the component mounts or when refreshTrigger changes.
    //
    // This always hits the backend rather than ever seeding from the `referenceTables` prop.
    // That prop reflects the parent's own `rows` state, and every mutation here (delete, create,
    // the page's Refresh button) remounts this component via a `key` bump on the parent - which
    // resets refreshTrigger back to 0, making "first load of this instance" indistinguishable
    // from "true first load of the page". The parent kicks off its own re-fetch in the same click
    // handler that bumps the key, so at remount time its `rows` is one round-trip behind: seeding
    // from it here previously left a just-deleted (or just-created) row showing until a second
    // refresh caught up. Always fetching fresh avoids that race entirely.
    useEffect(() => {
        fetchCustomTables();
        setIsDataFetched(true);
    }, [isDataFetched, refreshData, refreshTrigger]);

    return (
        <div>
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
                    key={refreshTrigger}
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

            {/* Custom Table Modal */}
            {tableType === 'REFERENCE' && (<CreateTableDialog
                open={open}
                onClose={(result) => {
                    console.log('Parent: Modal onClose called with result:', result);
                    setOpen(false);
                    setEditData(null);

                    if (result === true) {
                        console.log('Parent: Refreshing grid data...');
                        refreshGridData();
                    }
                }}
                tableType={'REFERENCE'}
                tables={rows}
                editData={editData}
            />)}

            {tableType === 'OPERATIONAL' && (<CreateTableDialog
                open={open}
                onClose={(result) => {
                    console.log('Parent: Modal onClose called with result:', result);
                    setOpen(false);
                    setEditData(null);

                    if (result === true) {
                        console.log('Parent: Refreshing grid data...');
                        refreshGridData();
                    }
                }}
                tableType={'OPERATIONAL'}
                tables={referenceTables}
                editData={editData}

            />)}

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
                    <DialogContentText id="delete-dialog-description" component="div">
                        Are you sure you want to delete the custom table "{tableToDelete?.tableName}"?
                        It will be hidden from the list; its underlying data is not removed.
                        {dependentTables.length > 0 && (
                            <Box sx={{ mt: 1.5 }}>
                                <strong>Note:</strong> operational table{dependentTables.length > 1 ? 's' : ''}{' '}
                                <strong>{dependentTables.join(', ')}</strong>{' '}
                                {dependentTables.length > 1 ? 'reference' : 'references'} this table and will be
                                deleted as well.
                            </Box>
                        )}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelDelete} color="primary">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        color="error"
                        variant="contained"
                        autoFocus
                    >
                        Delete
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

export default CustomTablesList;