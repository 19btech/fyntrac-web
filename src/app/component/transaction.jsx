'use client';
import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import IconButton from '@mui/material/IconButton';
import { Edit } from '@mui/icons-material';
import AddTransactionDialog from '../component/add-transaction';
import axios from 'axios';
import { useTenant } from "../tenant-context";

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
        <DataGrid
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
      </div>
      <AddTransactionDialog open={open} onClose={() => setOpen(false)} editData={editData} />
    </>
  );
}

export default Transaction;
