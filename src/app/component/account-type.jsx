import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import IconButton from '@mui/material/IconButton';
import { Edit } from '@mui/icons-material';
import AddAccountTypeDialog from '../component/add-account-type';
import axios from 'axios';

function AccountType({ refreshData }) {
  const columns = [
    { field: 'accountSubType', headerName: 'Account Subtype', width: 200, editable: false },
    { field: 'accountType', headerName: 'Account Type', width: 200, editable: false },
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

  const initialRows = [];
  const [rowsPerPage, setRowsPerPage] = useState(10); // Initial rows per page is set to 5
  const [currentPage, setCurrentPage] = useState(0);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [rows, setRows] = useState(initialRows);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const handleEdit = (rowData) => {
    setEditData(rowData); // Set the data to be edited
    setOpen(true); // Open the dialog
  };

  const fetchAccountTypeData = () => {
    const fetchAccountTypeDataCall =
      process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/accounttype/get/all';

    axios
      .get(fetchAccountTypeDataCall, {
        headers: {
          'X-Tenant': process.env.NEXT_PUBLIC_TENANT,
          Accept: '*/*',
        },
      })
      .then((response) => {
        setRows(response.data); // Populate rows with fetched data
      })
      .catch((error) => {
        console.error('Error fetching account type data:', error);
      });
  };

  useEffect(() => {
    fetchAccountTypeData();
    setIsDataFetched(true);
  }, [isDataFetched || refreshData]);

  const handleRowsPerPageChange = (newPageSize) => {
    setRowsPerPage(newPageSize); // Update rows per page state
    setCurrentPage(0); // Reset page to 0 when page size changes
  };

  const handleCellEditCommit = (params) => {
    const updatedRows = rows.map((row) =>
      row.id === params.id ? { ...row, [params.field]: params.props.value } : row
    );
    setRows(updatedRows);
  };

  return (
    <div>
      <div style={{ height: 'auto', width: '100%' }}>
                    <DataGrid
                      rows={rows}
                      columns={columns}
                      initialState={{
                        pagination: { paginationModel: { pageSize: rowsPerPage } },
                      }}
                      
                     pageSize={rowsPerPage}
                      page={currentPage}
                      onPageChange={(newPage) => setCurrentPage(newPage)}
                      pageSizeOptions={[5, 10, 20]}
                      pagination
                    paginationMode='client'
                      disableSelectionOnClick
                      editMode="row"
                      onCellEditCommit={handleCellEditCommit}
                    />
                  </div>
      <AddAccountTypeDialog open={open} onClose={setOpen} editData={editData} />
    </div>
  );
}

export default AccountType;
