'use client';
import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import IconButton from '@mui/material/IconButton';
import { Edit } from '@mui/icons-material';
import AddTransactionDialog from '../component/add-transaction';
import axios from 'axios';
import { useTenant } from "../tenant-context";
import { Box } from '@mui/material';

function Transaction({ refreshData }) {
  const { tenant } = useTenant();
  const [rows, setRows] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const handleEdit = (rowData) => {
    setEditData(rowData);
    setOpen(true);
  };

  const columns = [
    { field: 'name', headerName: 'Transaction Name', width: 400 },
    {
      field: 'isReplayable',
      headerName: 'Is Replayable',
      width: 150,
      renderCell: (params) => (
        <input type="checkbox" checked={params.value} readOnly />
      ),
    },
    {
      field: 'exclusive',
      headerName: 'Exclusive',
      width: 150,
      renderCell: (params) => (
        <input type="checkbox" checked={params.value} readOnly />
      ),
    },
    {
      field: 'isGL',
      headerName: 'Journal',
      width: 150,
      renderCell: (params) => (
        <input type="checkbox" checked={params.value} readOnly />
      ),
    },
    {
      field: 'edit',
      headerName: 'Edit',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton onClick={() => handleEdit(params.row)}>
          <Edit />
        </IconButton>
      ),
    },
  ];

  const fetchTransactionData = async () => {
    console.log('Tenant...', tenant);
    try {
      const url = `${process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI}/transaction/get/all`;
      const response = await axios.get(url, {
        headers: {
          'X-Tenant': tenant,
          Accept: '*/*',
        },
      });
      const data = response.data || [];
      const dataWithIds = data.map((item, index) => ({
        ...item,
        id: item.id || index + 1, // fallback if no ID
      }));
      setRows(dataWithIds);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  useEffect(() => {
    fetchTransactionData();
  }, [refreshData]);

  const handleCellEditCommit = (params) => {
    const updatedRows = rows.map((row) =>
      row.id === params.id ? { ...row, [params.field]: params.value } : row
    );
    setRows(updatedRows);
  };

  return (
    <>
      <div style={{ height: 600, width: '100%' }}>
        <Box
      sx={{
        height: 400,
        width: '100%',
        '& .super-app-theme--header': {
          backgroundColor: 'rgba(25, 118, 210, 0.08)',
          fontWeight: 'bold',
          whiteSpace: 'normal',
          lineHeight: '1.2',
          padding: '8px 12px',
        },
        '& .MuiDataGrid-columnHeaderTitle': {
          fontWeight: 'bold',
          fontSize: '0.875rem',
          whiteSpace: 'normal',
          lineHeight: '1.2',
          overflow: 'visible',
        },
        '& .MuiDataGrid-cell': {
          whiteSpace: 'normal',
          lineHeight: '1.2',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        '& .MuiDataGrid-virtualScroller': {
          overflowX: 'auto',
        },
        '& .MuiDataGrid-root': {
          overflow: 'auto',
        },
      }}
    >
        <DataGrid
                sx={{
          border: 1,
          borderColor: 'divider',
          '& .MuiDataGrid-cell:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            borderBottom: '2px solid',
            borderBottomColor: 'divider',
          },
          '& .MuiDataGrid-virtualScrollerContent': {
            width: 'auto',
            minWidth: '100%',
          },
        }}
          rows={rows}
          columns={columns}
          pagination
          pageSize={rowsPerPage}
          onPageSizeChange={(newSize) => setRowsPerPage(newSize)}
          page={currentPage}
          onPageChange={(params) => setCurrentPage(params)}
          pageSizeOptions={[5, 10, 20]}
          paginationMode="client"
          disableRowSelectionOnClick
          editMode="row"
          onCellEditCommit={handleCellEditCommit}
          getRowId={(row) => row.id}
        />
        </Box>
      </div>
      <AddTransactionDialog open={open} onClose={() => setOpen(false)} editData={editData} />
    </>
  );
}

export default Transaction;
