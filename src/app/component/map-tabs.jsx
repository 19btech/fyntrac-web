import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Tab,
  Tabs,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  Tooltip,
} from '@mui/material';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import SearchOffOutlinedIcon from '@mui/icons-material/SearchOffOutlined';
import { DataGrid } from '@mui/x-data-grid';

// Helper function moved to top level
const formatHeaderName = (key) => {
  if (!key || typeof key !== 'string') return 'Unknown';

  // Split by underscore and capitalize each word
  return key.split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Generated row id (a row's own "id" may be missing, null or repeated).
const ROW_ID = '__rowId';
const getRowId = (row) => row[ROW_ID];

// A calendar date sent as midnight UTC (or date-only) is shown as that date in every time zone.
const MIDNIGHT_UTC = /^\d{4}-\d{2}-\d{2}(T00:00:00(\.0+)?Z)?$/;

function EmptyCard({ icon: Icon, title, text }) {
  return (
    <Card variant="outlined">
      <CardContent
        sx={{
          padding: 6,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Icon sx={{ fontSize: 40, color: 'text.disabled' }} />
        <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
          {title}
        </Typography>
        <Typography variant="body2" color="text.disabled" sx={{ maxWidth: 360 }}>
          {text}
        </Typography>
      </CardContent>
    </Card>
  );
}

/**
 * Diagnostic results: one tab per result table, each a grid of its rows.
 *   data: { [tabName]: rows[] }   ran: whether a diagnostic has completed (for the empty state)
 */
function MapAsRowsDataGridTabs({ data, ran = false }) {
  const [selectedTab, setSelectedTab] = useState(0);

  // Transform your data structure: object with tab names as keys and arrays as values
  const tabData = useMemo(() => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return [];
    }

    return Object.entries(data).map(([tabName, rows]) => ({
      tabName,
      rows: Array.isArray(rows) ? rows.map((row, index) => ({
        ...(row && typeof row === 'object' ? row : { value: row }),
        [ROW_ID]: `${tabName}_${index + 1}`,
      })) : []
    }));
  }, [data]);

  // New results start on their first tab (the previous tab may not exist any more).
  useEffect(() => { setSelectedTab(0); }, [data]);
  const currentTab = selectedTab < tabData.length ? selectedTab : 0;

  if (tabData.length === 0) {
    return ran ? (
      <EmptyCard
        icon={SearchOffOutlinedIcon}
        title="No diagnostic data found"
        text="The diagnostic ran, but there is no data for this instrument, model and posting date."
      />
    ) : (
      <EmptyCard
        icon={FilterAltOutlinedIcon}
        title="No results to display"
        text="Select an instrument, model, and posting date above, then run the diagnostic to see results."
      />
    );
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ padding: 2 }}>
        <Paper sx={{ borderBottom: 0, borderColor: 'divider', mb: 1 }}>
          <Tabs
            value={currentTab}
            onChange={(_, value) => setSelectedTab(value)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {tabData.map(({ tabName, rows }) => (
              <Tab
                key={tabName}
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body2">{tabName}</Typography>
                    <Chip label={rows.length} size="small" sx={{ height: 18, fontSize: '0.68rem', fontWeight: 700 }} />
                  </Stack>
                }
              />
            ))}
          </Tabs>
        </Paper>

        {tabData.map(({ tabName, rows }, index) => (
          <TabPanel key={tabName} value={currentTab} index={index}>
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

    // Detect reference custom table events: instrumentid or attributeid field value === 'system'
    const isReferenceEvent = rows.some(row => {
      const instrumentVal = Object.entries(row).find(([k]) => k.toLowerCase() === 'instrumentid')?.[1];
      const attributeVal = Object.entries(row).find(([k]) => k.toLowerCase() === 'attributeid')?.[1];
      return instrumentVal === 'system' || attributeVal === 'system';
    });

    // Lowercase versions of cols hidden for reference custom table events
    const referenceHiddenCols = new Set(['attributeid', 'instrumentid', 'postingdate', 'effectivedate']);

    // Get all unique keys from all rows for columns
    const allKeys = Array.from(
      new Set(rows.flatMap(row =>
        row && typeof row === 'object' ? Object.keys(row) : []
      ))
    )
      .filter(key => key !== ROW_ID)
      .filter(key => key.replace(/^_+/, '').toLowerCase() !== 'id') // Hide 'id'/'_id' column for all events
      .filter(key => !isReferenceEvent || !referenceHiddenCols.has(key.toLowerCase())); // Hide extra cols for reference events

    // Define the priority columns that should come first
    const priorityColumns = ['InstrumentId', 'AttributeId', 'PostingDate', 'EffectiveDate'];

    // Separate priority columns from other columns (case-insensitive, use actual key from data)
    const priorityCols = priorityColumns
      .map(p => allKeys.find(k => k.toLowerCase() === p.toLowerCase()))
      .filter(Boolean);
    const otherCols = allKeys.filter(key => !priorityColumns.some(p => p.toLowerCase() === key.toLowerCase()));

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
        height: 460,
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
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={getRowId}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        pageSizeOptions={[10, 25, 50, 100]}
        disableRowSelectionOnClick
        showToolbar
        slotProps={{ toolbar: { csvOptions: { fileName: `diagnostic-${tabName}` } } }}
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
        }}
      />
    </Box>
  );
}

const centered = (content) => (
  <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', minWidth: 0 }}>{content}</Box>
);

// Full precision: up to 10 decimals, so small rates and amounts are never rounded away.
export const formatDiagnosticNumber = (value) =>
  (Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString(undefined, { maximumFractionDigits: 10 }));

export const formatDiagnosticDate = (value) => {
  if (typeof value !== 'string' || !MIDNIGHT_UTC.test(value)) return null;
  const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString(undefined, { timeZone: 'UTC' });
};

// Center-aligned value renderer
function CenterAlignedValueRenderer({ value }) {
  // Handle undefined or null values first
  if (value === null || value === undefined || value === '') {
    return centered(<Chip label="-" size="small" color="default" variant="outlined" />);
  }

  if (typeof value === 'boolean') {
    return centered(
      <Chip
        label={value ? 'true' : 'false'}
        size="small"
        color={value ? 'success' : 'error'}
        variant="outlined"
      />
    );
  }

  if (typeof value === 'number') {
    return centered(
      <Typography variant="body2" sx={{ fontFamily: 'monospace' }} title={String(value)}>
        {formatDiagnosticNumber(value)}
      </Typography>
    );
  }

  if (typeof value === 'string') {
    const date = formatDiagnosticDate(value);
    return centered(<Typography variant="body2">{date ?? value}</Typography>);
  }

  if (Array.isArray(value)) {
    return centered(
      <Tooltip title={<Box component="span" sx={{ whiteSpace: 'pre-wrap' }}>{value.map(String).join('\n')}</Box>}>
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
      </Tooltip>
    );
  }

  if (typeof value === 'object') {
    let text;
    try {
      text = JSON.stringify(value);
    } catch {
      return centered(<Chip label="[Object]" size="small" color="warning" variant="outlined" />);
    }
    return centered(
      <Tooltip title={<Box component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>{JSON.stringify(value, null, 2)}</Box>}>
        <Box
          sx={{
            p: 0.5,
            backgroundColor: 'grey.50',
            borderRadius: 1,
            maxWidth: 250,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
            {text}
          </Typography>
        </Box>
      </Tooltip>
    );
  }

  return centered(<Typography variant="body2">{String(value)}</Typography>);
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
