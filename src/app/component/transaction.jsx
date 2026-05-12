'use client';
import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { IconButton, Tooltip, Checkbox, Box, Chip } from '@mui/material';
import { EditOutlined } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import AddTransactionDialog from '../component/add-transaction';
import { dataloaderApi } from '../services/api-client';
import { useTenant } from "../tenant-context";

function Transaction({ refreshData }) {
  const { tenant } = useTenant();
  const [rows, setRows] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const handleEdit = (rowData) => {
    setEditData(rowData);
    setOpen(true);
  };

  const handleToggle = (id, field) => {
    setRows(prev => prev.map(row => row.id === id ? { ...row, [field]: !row[field] } : row));
  };

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
      renderCell: (params) => (
        <Checkbox
          checked={!!params.value}
          onChange={() => handleToggle(params.row.id, 'exclusive')}
          size="small"
          sx={{ color: '#14213d', '&.Mui-checked': { color: '#14213d' } }}
        />
      ),
    },
    {
      field: 'isGL',
      headerName: 'Journal',
      flex: 1,
      minWidth: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Checkbox
          checked={!!params.value}
          onChange={() => handleToggle(params.row.id, 'isGL')}
          size="small"
          sx={{ color: '#14213d', '&.Mui-checked': { color: '#14213d' } }}
        />
      ),
    },
    {
      field: 'isReplayable',
      headerName: 'Replayable',
      flex: 1,
      minWidth: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Checkbox
          checked={!!params.value}
          onChange={() => handleToggle(params.row.id, 'isReplayable')}
          size="small"
          sx={{ color: '#14213d', '&.Mui-checked': { color: '#14213d' } }}
        />
      ),
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
  ];

  const fetchTransactionData = async () => {
    try {
      const response = await dataloaderApi.get('/transaction/get/all');
      const data = response.data || [];
      setRows(data.map((item, index) => ({ ...item, id: item.id || index + 1 })));
    } catch (error) {
      console.error('Error fetching transactions:', error);
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
      <AddTransactionDialog open={open} onClose={() => setOpen(false)} editData={editData} />
    </>
  );
}

export default Transaction;
