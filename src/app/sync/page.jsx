"use client";

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Collapse,
  Tooltip,
  useTheme,
  alpha,
  Divider
} from '@mui/material';

// Icons
import RefreshIcon from '@mui/icons-material/Refresh';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SyncIcon from '@mui/icons-material/Sync';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import TableViewIcon from '@mui/icons-material/TableView';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// --- MOCK DATA ---
const recentUploadData = {
  id: '1766561048165',
  jobName: 'transactionActivityUploadJob',
  startTime: '2025-12-24 12:54:08',
  endTime: '2025-12-24 12:54:22',
  status: 'COMPLETED',
  details: [
    { tableName: 'TransactionActivity', populated: '1,233', failed: '12' },
    { tableName: 'InstrumentAttributeHistory', populated: '848', failed: '2' },
  ]
};

const historicalData = [
  {
    id: '1766559021004',
    jobName: 'dailyReconciliationJob',
    startTime: '2025-12-23 09:15:00',
    endTime: '2025-12-23 09:18:45',
    status: 'COMPLETED'
  },
  {
    id: '1766548100232',
    jobName: 'portfolioDataSync',
    startTime: '2025-12-22 18:30:10',
    endTime: '2025-12-22 18:30:15',
    status: 'FAILED'
  },
  {
    id: '1766492109981',
    jobName: 'initialMigrationLoad',
    startTime: '2025-12-20 08:00:00',
    endTime: '2025-12-20 08:45:22',
    status: 'COMPLETED'
  }
];

// --- COMPONENTS ---

// 1. Status Chip Helper
const StatusChip = ({ status }) => {
  const isSuccess = status === 'COMPLETED';
  return (
    <Chip
      label={status}
      size="small"
      sx={{
        fontWeight: 700,
        fontSize: '0.7rem',
        borderRadius: 1,
        height: 24,
        bgcolor: isSuccess ? alpha('#22c55e', 0.1) : alpha('#ef4444', 0.1),
        color: isSuccess ? '#166534' : '#991b1b',
        border: `1px solid ${isSuccess ? alpha('#22c55e', 0.2) : alpha('#ef4444', 0.2)}`
      }}
    />
  );
};

// 2. Collapsible Row Component
function Row({ row, isExpandedDefault = false }) {
  const [open, setOpen] = useState(isExpandedDefault);
  const theme = useTheme();

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' }, '&:hover': { bgcolor: 'action.hover' } }}>
        <TableCell width={60}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {row.id}
        </TableCell>
        <TableCell sx={{ color: 'text.secondary' }}>{row.jobName}</TableCell>
        <TableCell sx={{ color: 'text.secondary' }}>{row.startTime}</TableCell>
        <TableCell sx={{ color: 'text.secondary' }}>{row.endTime}</TableCell>
        <TableCell>
          <StatusChip status={row.status} />
        </TableCell>
        <TableCell align="right">
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Tooltip title="View Logs">
              <IconButton size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                <VisibilityOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download Report">
              <IconButton size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                <DownloadOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </TableCell>
      </TableRow>
      
      {/* Expanded Detail View */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 3, ml: 8 }}>
              {row.details ? (
                <>
                  <Typography variant="subtitle2" gutterBottom component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary' }}>
                    <TableViewIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    Populated Tables & Records
                  </Typography>
                  <Card variant="outlined" sx={{ mt: 2, overflow: 'hidden', borderRadius: 2 }}>
                    <Table size="small" aria-label="details">
                      <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Table Name</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Records Populated</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Records Failed</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {row.details.map((detailRow) => (
                          <TableRow key={detailRow.tableName}>
                            <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                              {detailRow.tableName}
                            </TableCell>
                            <TableCell>{detailRow.populated}</TableCell>
                            <TableCell>{detailRow.failed}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, fontStyle: 'italic' }}>
                  No detailed records available for this job.
                </Typography>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

// 3. Reusable Section Card
const SectionCard = ({ title, children, action }) => {
  const theme = useTheme();
  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        boxShadow: `0px 2px 4px ${alpha(theme.palette.grey[300], 0.4)}`,
        overflow: 'hidden'
      }}
    >
      <Box 
        sx={{ 
          px: 3, 
          py: 2, 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.grey[50], 0.5),
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography variant="subtitle1" fontWeight={700} color="text.primary">
          {title}
        </Typography>
        {action}
      </Box>
      {children}
    </Card>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function IngestPage() {
  const theme = useTheme();

  return (
    <Box sx={{ p: 2,  margin: '0 auto' }}>
      
      {/* 1. Header Section */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, mb: 4 }}>
        <Box alignContent={'left'}>
          <Typography variant="h5" fontWeight={800} color="text.primary">
            Injest
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage your data imports and view synchronization history.
          </Typography>
        </Box>
        
        {/* Actions Toolbar */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Upload Data File">
            <IconButton sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) } }}>
              <UploadFileIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Sync">
            <IconButton sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) } }}>
              <SyncIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* 2. Recent Upload Section */}
      <Box sx={{ mb: 4 }}>
        <SectionCard 
          title="Recent Upload" 
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
               <IconButton size="small"><RefreshIcon fontSize="small" /></IconButton>
               <IconButton size="small"><KeyboardArrowUpIcon fontSize="small" /></IconButton>
            </Box>
          }
        >
          <TableContainer>
            <Table aria-label="recent upload table">
              <TableHead sx={{ bgcolor: alpha(theme.palette.grey[100], 0.5) }}>
                <TableRow>
                  <TableCell />
                  <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Job Id</TableCell>
                  <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Job Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Start Time</TableCell>
                  <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>End Time</TableCell>
                  <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <Row row={recentUploadData} isExpandedDefault={true} />
              </TableBody>
            </Table>
          </TableContainer>
        </SectionCard>
      </Box>

      {/* 3. Historical Loads Section */}
      <Box>
        <SectionCard 
          title="Historical Loads" 
          action={
             <IconButton size="small"><ExpandMoreIcon fontSize="small" /></IconButton>
          }
        >
          <TableContainer>
            <Table aria-label="historical loads table">
              <TableHead sx={{ bgcolor: alpha(theme.palette.grey[100], 0.5) }}>
                <TableRow>
                  <TableCell width={60} />
                  <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Job Id</TableCell>
                  <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Job Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Start Time</TableCell>
                  <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>End Time</TableCell>
                  <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historicalData.map((row) => (
                  <Row key={row.id} row={row} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Footer Link */}
          <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.grey[100], 0.5), borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'center' }}>
            <Button size="small" sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>
                View all history
            </Button>
          </Box>
        </SectionCard>
      </Box>

    </Box>
  );
}