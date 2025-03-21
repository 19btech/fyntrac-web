import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarExport,
  GridToolbarDensitySelector,
} from '@mui/x-data-grid';
import CustomTabPanel from '../component/custom-tab-panel';
// Custom Toolbar Component
function CustomToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarDensitySelector
        slotProps={{ tooltip: { title: 'Change density' } }}
      />
      <Box sx={{ flexGrow: 1 }} /> {/* Spacer to push the export button to the right */}
      {/* <GridToolbarExport
        sx={{ color: 'lightgrey', "&:hover": { backgroundColor: "darkgrey" } }}
        slotProps={{
          tooltip: { title: 'Export data' },
          button: { variant: 'outlined' },

        }}
      /> */}
    </GridToolbarContainer>
  );
}

// Main DataGrid Component
export default function CustomDataGrid({ columns, rows }) {
  const initialState = {
    columns: {
      columnVisibilityModel: {
        // Hide all columns except the first 5
        ...columns.reduce((acc, column, index) => {
          acc[column.field] = index < 7; // Show only the first 5 columns
          return acc;
        }, {}),
      },
    },
  };

  return (
    <div style={{ height: '65vh', width: '100%' }}>
      {columns.length === 0 || rows.length === 0 ? ( // Check for both columns and rows
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="100%"
        >
          <Typography variant="h6" color="textSecondary">
            No filter applied
          </Typography>
        </Box>
      ) : (

        <DataGrid
          columns={columns}
          rows={rows}
          slots={{
            toolbar: CustomToolbar, // Use the custom toolbar
          }}
          initialState={initialState} // Set the initial state
          pageSize={5}
          rowsPerPageOptions={[5, 10, 20]}
          disableSelectionOnClick // Disable selection on row click
        />

      )}
    </div>
  );
}