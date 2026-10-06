'use client';
import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { IconButton, Tooltip, Box, Chip, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { EditOutlined, DeleteOutlineOutlined } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import AddTransactionDialog from '../component/add-transaction';
import { dataloaderApi } from '../services/api-client';
import { useTenant } from "../tenant-context";
import { apiErrorMessage, countOf } from './rules-shared';

function Transaction({ refreshData, onToast }) {
  const { tenant } = useTenant();
  const [rows, setRows] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  // What still uses the item being deleted (shown in the confirmation), or null.
  const [deleteRefs, setDeleteRefs] = useState(null);
  const [loading, setLoading] = useState(true);


  const handleEdit = (rowData) => {
    setEditData(rowData);
    setOpen(true);
  };

  const handleDeleteClick = (row) => {
    setRowToDelete(row);
    setDeleteRefs(null);
    setDeleteDialogOpen(true);
    // Balances and subledger mappings that use this transaction.
    const name = String(row.name || '').toLowerCase();
    Promise.all([
      dataloaderApi.get('/aggregation/get/all').catch(() => ({ data: [] })),
      dataloaderApi.get('/subledgermapping/get/all').catch(() => ({ data: [] })),
    ]).then(([agg, sml]) => {
      const balances = [...new Set((agg.data || []).filter(a => a.transactionName?.toLowerCase() === name).map(a => a.metricName))];
      const mappings = (sml.data || []).filter(m => m.transactionName?.toLowerCase() === name).length;
      const refs = [];
      if (balances.length) refs.push(`balance${balances.length === 1 ? '' : 's'} ${balances.join(', ')}`);
      if (mappings) refs.push(countOf(mappings, 'subledger mapping'));
      setDeleteRefs(refs);
    });
  };

  const handleConfirmDelete = async () => {
    if (!rowToDelete || deleting) return;
    setDeleting(true);
    try {
      await dataloaderApi.delete(`/transaction/delete/name/${encodeURIComponent(rowToDelete.name)}`);
      
      onToast?.(`${rowToDelete.name} deleted successfully.`);
      setDeleteDialogOpen(false);
      setRowToDelete(null);
      setDeleteRefs(null);
      fetchTransactionData();
    } catch (error) {
      console.error('Delete failed:', error);
      // Keep the dialog open: the item still exists, and the reason is shown.
      onToast?.(apiErrorMessage(error, `${rowToDelete.name} could not be deleted. Please try again.`), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    if (deleting) return;
    setDeleteDialogOpen(false);
    setRowToDelete(null);
    setDeleteRefs(null);
  };

  const BoolChip = ({ value }) => value
    ? <Chip label="Yes" size="small" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(22,163,74,0.1)', color: '#15803d', border: '1px solid rgba(22,163,74,0.28)', borderRadius: 1.5 }} />
    : <Chip label="No" size="small" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, bgcolor: 'rgba(100,116,139,0.07)', color: '#64748b', border: '1px solid rgba(100,116,139,0.18)', borderRadius: 1.5 }} />;

  const columns = [
    {
      field: 'name',
      headerName: 'Transaction Name',
      flex: 2,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ fontWeight: 500, fontSize: '0.85rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', color: 'text.primary' }}>
          {params.value}
        </Box>
      ),
    },
    {
      field: 'exclusive',
      headerName: 'Reportable',
      flex: 1,
      minWidth: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => <BoolChip value={!!params.value} />,
    },
    {
      field: 'isGL',
      headerName: 'Journal',
      flex: 1,
      minWidth: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => <BoolChip value={!!params.value} />,
    },
    {
      field: 'isReplayable',
      headerName: 'Replayable',
      flex: 1,
      minWidth: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => <BoolChip value={!!params.value} />,
    },
    {
      field: 'edit',
      headerName: '',
      width: 64,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Tooltip title="Edit" placement="left">
          <IconButton
            size="small"
            onClick={() => handleEdit(params.row)}
            sx={{
              color: '#14213d',
              bgcolor: alpha('#14213d', 0.06),
              borderRadius: 1.5,
              '&:hover': { bgcolor: alpha('#14213d', 0.14) },
            }}
          >
            <EditOutlined sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      ),
    },
    {
      field: 'delete',
      headerName: '',
      width: 64,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Tooltip title="Delete" placement="left">
          <IconButton
            size="small"
            onClick={() => handleDeleteClick(params.row)}
            sx={{
              color: '#dc2626',
              bgcolor: 'rgba(220,38,38,0.06)',
              borderRadius: 1.5,
              '&:hover': { bgcolor: 'rgba(220,38,38,0.14)' },
            }}
          >
            <DeleteOutlineOutlined sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const fetchTransactionData = async () => {
    setLoading(true);
    try {
      const response = await dataloaderApi.get('/transaction/get/all');
      const data = response.data || [];
      setRows(data.map((item, index) => ({ ...item, id: item.id || index + 1 })));
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactionData();
  }, [refreshData]);

  return (
    <>
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
          loading={loading}
          getRowId={(row) => row.id}
          pageSizeOptions={[5, 10, 20]}
          initialState={{ pagination: { paginationModel: { pageSize: rowsPerPage } } }}
          paginationMode="client"
          disableRowSelectionOnClick
          autoHeight
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
      <AddTransactionDialog
        open={open}
        onClose={(didSave) => {
          setOpen(false);
          if (didSave) {
            fetchTransactionData();
            onToast?.('Transaction saved successfully.');
          }
        }}
        editData={editData}
      />
      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Transaction</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{rowToDelete?.name}</strong>? This action cannot be undone.
            {deleteRefs?.length > 0 && (
              <Box component="span" sx={{ display: 'block', mt: 1.5, color: '#b45309' }}>
                Still used by {deleteRefs.join('; ')}. Those references will point at a deleted item — update them as well.
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={handleCancelDelete} disabled={deleting} variant="text" sx={{ textTransform: 'none', borderRadius: 2 }}>No</Button>
          <Button onClick={handleConfirmDelete} disabled={deleting} variant="contained" color="error" sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}>{deleting ? 'Deleting…' : 'Delete'}</Button>
        </DialogActions>
      </Dialog>

    </>
  );
}

export default Transaction;
