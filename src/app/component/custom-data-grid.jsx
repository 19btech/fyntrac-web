import React, { useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ViewHeadlineIcon from '@mui/icons-material/ViewHeadline';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import TableRowsIcon from '@mui/icons-material/TableRows';
import DensitySmallIcon from '@mui/icons-material/DensitySmall';
import {
  DataGrid,
  Toolbar,
  ToolbarButton,
  ColumnsPanelTrigger,
  FilterPanelTrigger,
  useGridApiContext,
  gridDensitySelector,
  useGridSelector,
} from '@mui/x-data-grid';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import FilterListIcon from '@mui/icons-material/FilterList';
import CustomTabPanel from '../component/custom-tab-panel';

// Density options matching the old GridToolbarDensitySelector
const DENSITY_OPTIONS = [
  { value: 'compact',    label: 'Compact',    icon: <ViewHeadlineIcon fontSize="small" /> },
  { value: 'standard',   label: 'Standard',   icon: <TableRowsIcon fontSize="small" />   },
  { value: 'comfortable',label: 'Comfortable',icon: <ViewStreamIcon fontSize="small" />   },
];

// Custom Toolbar Component
function CustomToolbar() {
  const apiRef = useGridApiContext();
  const currentDensity = useGridSelector(apiRef, gridDensitySelector);
  const [densityAnchor, setDensityAnchor] = useState(null);

  return (
    <Toolbar>
      {/* Columns panel trigger — replaces deprecated GridToolbarColumnsButton */}
      <Tooltip title="Columns">
        <ColumnsPanelTrigger render={<ToolbarButton />}>
          <ViewColumnIcon fontSize="small" />
        </ColumnsPanelTrigger>
      </Tooltip>

      {/* Filter panel trigger — replaces deprecated GridToolbarFilterButton */}
      <Tooltip title="Filters">
        <FilterPanelTrigger render={<ToolbarButton />}>
          <FilterListIcon fontSize="small" />
        </FilterPanelTrigger>
      </Tooltip>

      {/* Density selector — replaces deprecated GridToolbarDensitySelector */}
      <Tooltip title="Change density">
        <ToolbarButton onClick={(e) => setDensityAnchor(e.currentTarget)}>
          <DensitySmallIcon fontSize="small" />
        </ToolbarButton>
      </Tooltip>
      <Menu
        anchorEl={densityAnchor}
        open={Boolean(densityAnchor)}
        onClose={() => setDensityAnchor(null)}
      >
        {DENSITY_OPTIONS.map((opt) => (
          <MenuItem
            key={opt.value}
            selected={currentDensity === opt.value}
            onClick={() => {
              apiRef.current.setDensity(opt.value);
              setDensityAnchor(null);
            }}
          >
            <ListItemIcon>{opt.icon}</ListItemIcon>
            <ListItemText>{opt.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      <Box sx={{ flexGrow: 1 }} />
    </Toolbar>
  );
}

// Main DataGrid Component
export default function CustomDataGrid({ columns, rows }) {
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);

  const rowsWithId = rows.map((row, index) => ({
    id: row._id ?? index, // fallback to index if _id not present
    ...row
  }));

  const initialState = {
    pagination: { paginationModel: { pageSize: rowsPerPage } },
    density: 'compact',
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
    <div style={{ width: '100%', overflow: 'auto' }}>
      {columns.length === 0 || rows.length === 0 ? ( // Check for both columns and rows
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="auto"
        >
          <Typography variant="h6" color="textSecondary">
            No filter applied
          </Typography>
        </Box>
      ) : (

        <DataGrid
          columns={columns}
          rows={rows}
          getRowId={(row, index) => row.id ?? index}
          
          slots={{
            toolbar: CustomToolbar, // Use the custom toolbar
          }}
          initialState={initialState} // Set the initial state
          pageSize={rowsPerPage}
          page={currentPage}
          onPageChange={(newPage) => setCurrentPage(newPage)}
          pageSizeOptions={[5, 10, 20]}
          pagination
          paginationMode='client'
          disableSelectionOnClick // Disable selection on row click
        />

      )}
    </div>
  );
}