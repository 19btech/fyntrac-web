'use client';

import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { IconButton, Tooltip, Box, Chip, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { EditOutlined, DeleteOutlineOutlined } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import AddChartOfAccountDialog from '../component/add-chart-of-account';
import { dataloaderApi } from '../services/api-client';
import { useTenant } from "../tenant-context";
import { apiErrorMessage, attributeMetadataKey } from './rules-shared';

function ChartOfAccount({ refreshData, onToast }) {
  const { tenant } = useTenant();
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([
    { field: 'accountNumber', headerName: 'Account Number', width: 200 },
    { field: 'accountName', headerName: 'Account Name', width: 200 },
    { field: 'accountSubtype', headerName: 'Account Subtype', width: 200 },
  ]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [rowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  // What still uses the item being deleted (shown in the confirmation), or null.
  const [deleteRefs, setDeleteRefs] = useState(null);

  const handleDeleteClick = (row) => {
    setRowToDelete(row);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!rowToDelete || deleting) return;
    setDeleting(true);
    try {
      await dataloaderApi.delete(`/chartofaccount/delete/${rowToDelete.id}`);
      
      onToast?.(`${rowToDelete.accountName} deleted successfully.`);
      setDeleteDialogOpen(false);
      setRowToDelete(null);
      setDeleteRefs(null);
      fetchChartOfAccountData();
    } catch (error) {
      console.error('Delete failed:', error);
      // Keep the dialog open: the item still exists, and the reason is shown.
      onToast?.(apiErrorMessage(error, `${rowToDelete.accountName} could not be deleted. Please try again.`), 'error');
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

  // Columns: drawn from the cached attribute list straight away, then always re-read from the
  // service (attributes may have been added, renamed or made reclassable since).
  useEffect(() => {
    if (typeof window === 'undefined' || !tenant) return;
    try {
      const cachedMetadata = localStorage.getItem(attributeMetadataKey(tenant));
      if (cachedMetadata) generateColumns(JSON.parse(cachedMetadata));
    } catch { /* unreadable cache: the fetch below replaces it */ }
    fetchAttributeMetadata();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant]);

  useEffect(() => {
    fetchChartOfAccountData();
  }, [refreshData]);

  const fetchAttributeMetadata = () => {
    dataloaderApi.get(`/attribute/get/isreclassable/attributes`, {
      headers: {
        'X-Tenant': tenant,
        Accept: '*/*',
      },
    })
      .then(response => {
        const metadata = Array.isArray(response.data) ? response.data : [];
        try { localStorage.setItem(attributeMetadataKey(tenant), JSON.stringify(metadata)); } catch { /* storage full */ }
        generateColumns(metadata);
      })
      .catch(error => {
        console.error('Error fetching attribute metadata:', error);
        setFetchError(`Unable to load the attribute columns: ${apiErrorMessage(error, 'the service did not respond')}. Use Refresh to try again.`);
        setLoading(false);
      });
  };

  const generateColumns = (metadata) => {
    const baseColumns = [
      { field: 'accountNumber', headerName: 'Account Number', width: 200 },
      { field: 'accountName', headerName: 'Account Name', width: 200 },
      {
        field: 'accountSubtype',
        headerName: 'Account Subtype',
        width: 200,
        renderCell: (params) => (
          <Chip
            label={params.value}
            size="small"
            sx={{
              height: 22, fontSize: '0.72rem', fontWeight: 700,
              bgcolor: 'rgba(234,179,8,0.1)', color: '#a16207',
              border: '1px solid rgba(234,179,8,0.28)', borderRadius: 1.5,
              fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
            }}
          />
        ),
      },
    ];

    const dynamicColumns = metadata.map(attr => {
      let colType = getColumnType(attr.dataType);

      // 🛑 EMERGENCY FIX: Force PORTFOLIO to be a string
      // The backend says it's a Date, but the data ("ABC") proves it is a String.
      if (attr.attributeName === 'PORTFOLIO') {
        colType = 'string';
      }

      return {
        field: attr.attributeName,
        headerName: toProperCase(attr.attributeName),
        type: colType,
        width: 200,
        valueGetter: (params) => {
          // MUI v6+ passes an object, older versions pass the value directly.
          // We handle both safely:
          const value = params.value !== undefined ? params.value : params;

          if (!value) return null;

          // Only convert to Date if it is TRULY a date column
          if (colType === 'date') {
            // A date-only value (yyyy-mm-dd) is that calendar day here too — not midnight UTC,
            // which shows as the previous day west of UTC.
            const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
            const date = dateOnly ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])) : new Date(value);
            // Safety check: If "ABC" somehow gets here, treat it as null to prevent crash
            return isNaN(date.getTime()) ? null : date;
          }
          return value;
        },
      };
    });

    const editColumn = {
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
            disabled={params.row.__noId}
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
    };

    const deleteColumn = {
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
            disabled={params.row.__noId}
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
    };

    setColumns([...baseColumns, ...dynamicColumns, editColumn, deleteColumn]);
    setLoading(false);
  };

  const toProperCase = (str) =>
    str
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const getColumnType = (type) => {
    switch (type?.toUpperCase()) {
      case 'STRING': return 'string';
      case 'NUMBER': return 'number';
      case 'DATE': return 'date';
      case 'BOOLEAN': return 'boolean';
      default: return 'string';
    }
  };

  const handleEdit = (rowData) => {
    setEditData(rowData);
    setOpen(true);
  };

  const fetchChartOfAccountData = () => {
    setLoading(true);
    dataloaderApi.get(`/chartofaccount/get/all`, {
      headers: {
        'X-Tenant': tenant,
        Accept: '*/*',
      },
    })
      .then(response => {
        const data = Array.isArray(response.data) ? response.data : [];
        const dataWithIds = data.map((item, index) => ({
          // Attribute values become columns; the account's own fields win on a name clash.
          ...(item.attributes || {}),
          ...item,
          // Rows without an id get a display-only one (never sent to the service).
          id: item.id ?? `row-${index + 1}`,
          __noId: item.id == null,
        }));
        setRows(dataWithIds);
        setFetchError(null);
      })
      .catch(error => {
        console.error('Error fetching chart of account:', error);
        setFetchError(`Unable to load Chart of Accounts: ${apiErrorMessage(error, 'the service did not respond')}. Use Refresh to try again.`);
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      {fetchError && (
        <Alert severity="error" variant="standard" sx={{
          mb: 2, borderRadius: 2, fontSize: '0.85rem', fontWeight: 600,
          bgcolor: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)',
          color: '#dc2626', '& .MuiAlert-icon': { color: '#dc2626' },
        }}>
          {fetchError}
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
          pageSizeOptions={[5, 10, 20]}
          initialState={{ pagination: { paginationModel: { pageSize: rowsPerPage } } }}
          paginationMode="client"
          disableRowSelectionOnClick
          autoHeight
          loading={loading}
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
      <AddChartOfAccountDialog
        open={open}
        onClose={(didSave) => {
          setOpen(false);
          if (didSave) {
            fetchChartOfAccountData();
            onToast?.('Chart of account saved successfully.');
          }
        }}
        editData={editData}
      />
      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Chart of Account</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete account <strong>{rowToDelete?.accountName}</strong>? This action cannot be undone.
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

export default ChartOfAccount;
