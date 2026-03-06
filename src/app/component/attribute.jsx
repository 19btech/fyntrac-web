import React, { useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import IconButton from '@mui/material/IconButton';
import { Edit } from '@mui/icons-material';
import AddAttributeDialog from '../component/add-attribute'
import { dataloaderApi } from '../services/api-client';
import CustomDataGrid from "@/app/component/custom-data-grid";
import { useTenant } from "../tenant-context";
function Attribute({ refreshData }) {
  const { tenant } = useTenant();
  const columns = [
    { field: 'userField', headerName: 'User Field Name', width: 200, editable: false },
    { field: 'attributeName', headerName: 'Attribute Name', width: 200, editable: false },
    { field: 'dataType', headerName: 'Data Type', width: 100, editable: false },

    {
      field: 'isNullable',
      headerName: 'Nullable',
      width: 150,
      editable: false,
      renderCell: (params) => (
        <input type="checkbox" checked={params.value} readOnly />
      ),
    },
    {
      field: 'isReclassable',
      headerName: 'Reclassable',
      width: 150,
      editable: false,
      renderCell: (params) => (
        <input type="checkbox" checked={params.value} readOnly />
      ),
    },
    {
      field: 'isVersionable',
      headerName: 'Versionable',
      width: 150,
      editable: false,
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

  const initialRows = [];

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [rows, setRows] = useState(initialRows);

  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const handleEdit = (rowData) => {
    setEditData(rowData); // Set the data to be edited
    setOpen(true); // Open the dialog
  };


  const fetchAttributeData = () => {
    dataloaderApi.get('/attribute/get/all')
      .then(response => {
        setRows(response.data);
      })
      .catch(error => {
        // Handle error if needed
      });
  };

  // Fetch data when the component mounts
  React.useEffect(() => {
    fetchAttributeData();
    setIsDataFetched(true);
  }, [isDataFetched || refreshData]);

  const handleAddRow = () => {
    const newRow = { id: rows.length + 1, name: '', exclusive: '', isGL: '' };
    setRows([newRow, ...rows]);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(0);
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
      <><AddAttributeDialog open={open} onClose={setOpen} editData={editData} /></>
    </div>

  );
}

export default Attribute;
