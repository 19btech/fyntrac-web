import React, { useState, useMemo } from 'react';
import {
  Box,
  Tab,
  Tabs,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';

// Helper function moved to top level
const formatHeaderName = (key) => {
  if (!key || typeof key !== 'string') return 'Unknown';
  
  // Split by underscore and capitalize each word
  return key.split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

function MapAsRowsDataGridTabs({ data }) {
  const [selectedTab, setSelectedTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  // Transform your data structure: object with tab names as keys and arrays as values
  const tabData = useMemo(() => {
    if (!data || typeof data !== 'object') {
      return [];
    }

    return Object.entries(data).map(([tabName, rows]) => ({
      tabName,
      rows: Array.isArray(rows) ? rows.map((row, index) => ({
        id: `${tabName}_${index + 1}`, // Unique ID for each row
        ...row
      })) : []
    }));
  }, [data]);

  // Show empty state if no data
  if (tabData.length === 0) {
    return (
      <Card variant="outlined">
        <CardContent sx={{ padding: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No data available to display
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ padding: 2 }}>
        <Paper sx={{ borderBottom: 0, borderColor: 'divider', mb: 1 }}>
          <Tabs 
            value={selectedTab} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
          >
            {tabData.map(({ tabName, rows }, index) => (
              <Tab 
                key={tabName} 
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body2">{tabName}</Typography>
                  </Stack>
                } 
              />
            ))}
          </Tabs>
        </Paper>

        {tabData.map(({ tabName, rows }, index) => (
          <TabPanel key={tabName} value={selectedTab} index={index}>
            <DataGridTable rows={rows} tabName={tabName} />
          </TabPanel>
        ))}
      </CardContent>
    </Card>
  );
}

function DataGridTable({ rows, tabName }) {
  const columns = useMemo(() => {
    if (!rows || !Array.isArray(rows) || rows.length === 0) return [];

    // Get all unique keys from all rows for columns
    const allKeys = Array.from(
      new Set(rows.flatMap(row => 
        row && typeof row === 'object' ? Object.keys(row) : []
      ))
    ).filter(key => key !== 'id'); // Remove 'id' as it's our row identifier

    // Define the priority columns that should come first
    const priorityColumns = ['InstrumentId', 'AttributeId', 'PostingDate', 'EffectiveDate'];
    
    // Separate priority columns from other columns
    const priorityCols = priorityColumns.filter(col => allKeys.includes(col));
    const otherCols = allKeys.filter(col => !priorityColumns.includes(col));

    // Create columns array with priority columns first
    return [
      ...priorityCols.map(key => ({
        field: key,
        headerName: formatHeaderName(key),
        width: 180,
        minWidth: 150,
        headerClassName: 'super-app-theme--header',
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => <CenterAlignedValueRenderer value={params.value} />,
      })),
      ...otherCols.map(key => ({
        field: key,
        headerName: formatHeaderName(key),
        width: 250,
        minWidth: 200,
        headerClassName: 'super-app-theme--header',
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => <CenterAlignedValueRenderer value={params.value} />,
      }))
    ];
  }, [rows]);

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="textSecondary">
          No data available for {tabName || 'this tab'}
        </Typography>
      </Paper>
    );
  }

  return (
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
        rows={rows}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10, 25, 50]}
        disableSelectionOnClick
        components={{
          Toolbar: GridToolbar,
        }}
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
        autoHeight={false}
      />
    </Box>
  );
}

// Center-aligned value renderer
function CenterAlignedValueRenderer({ value }) {
  // Handle undefined or null values first
  if (value === null || value === undefined || value === '') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <Chip label="-" size="small" color="default" variant="outlined" />
      </Box>
    );
  }

  if (typeof value === 'boolean') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <Chip 
          label={value ? 'true' : 'false'} 
          size="small" 
          color={value ? 'success' : 'error'} 
          variant="outlined" 
        />
      </Box>
    );
  }

  if (typeof value === 'number') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {value.toLocaleString()}
        </Typography>
      </Box>
    );
  }

  if (typeof value === 'string') {
    // Check if it's a date string
    if (value.includes('T00:00:00.000Z')) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return (
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <Typography variant="body2">
                {date.toLocaleDateString()}
              </Typography>
            </Box>
          );
        }
      } catch (error) {
        // Fall through to regular string display
      }
    }
    
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <Typography variant="body2">{value}</Typography>
      </Box>
    );
  }

  if (Array.isArray(value)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {value.slice(0, 3).map((item, index) => (
            <Chip 
              key={index}
              label={String(item)} 
              size="small" 
              variant="outlined" 
            />
          ))}
          {value.length > 3 && (
            <Chip 
              label={`+${value.length - 3}`} 
              size="small" 
              variant="filled" 
            />
          )}
        </Stack>
      </Box>
    );
  }

  if (typeof value === 'object') {
    try {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <Box 
            sx={{ 
              p: 0.5, 
              backgroundColor: 'grey.50',
              borderRadius: 1,
              maxWidth: 250,
              overflow: 'hidden'
            }}
          >
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
              {JSON.stringify(value)}
            </Typography>
          </Box>
        </Box>
      );
    } catch (error) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <Chip label="[Object]" size="small" color="warning" variant="outlined" />
        </Box>
      );
    }
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <Typography variant="body2">{String(value)}</Typography>
    </Box>
  );
}

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export default MapAsRowsDataGridTabs;