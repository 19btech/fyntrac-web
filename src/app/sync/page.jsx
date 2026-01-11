"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
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
  Container
} from '@mui/material';

// Icons
import RefreshIcon from '@mui/icons-material/Refresh';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import TableViewIcon from '@mui/icons-material/TableView';
import { useTenant } from "../tenant-context";
import axios from 'axios';
import FileUploadComponent from '../component/file-upload';
// --- HELPERS ---

const formatDateTime = (isoString) => {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

const StatusChip = ({ status }) => {
  const isSuccess = status === 'COMPLETED';
  const isError = status === 'FAILED';

  let bg = alpha('#22c55e', 0.1);
  let color = '#166534';
  let border = alpha('#22c55e', 0.2);

  if (isError) {
    bg = alpha('#ef4444', 0.1);
    color = '#991b1b';
    border = alpha('#ef4444', 0.2);
  } else if (!isSuccess && !isError) {
    bg = alpha('#3b82f6', 0.1);
    color = '#1e40af';
    border = alpha('#3b82f6', 0.2);
  }

  return (
    <Chip
      label={status || 'UNKNOWN'}
      size="small"
      sx={{
        fontWeight: 700,
        fontSize: '0.7rem',
        borderRadius: 1,
        height: 24,
        bgcolor: bg,
        color: color,
        border: `1px solid ${border}`
      }}
    />
  );
};

// --- COMPONENTS ---

// 1. Collapsible Row (Updated with Conditional Error Column)
function Row({ row, isExpandedDefault = false }) {
  const [open, setOpen] = useState(isExpandedDefault);
  const theme = useTheme();

  const hasDetails = row.details && row.details.length > 0;

  // ✅ Check if ANY detail row has an error message
  const hasErrors = hasDetails && row.details.some(d => d.errorMessage);

  return (
    <>
      <TableRow
        sx={{
          '& > *': { borderBottom: 'unset' },
          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
          transition: 'background-color 0.2s'
        }}
      >
        <TableCell width={60}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
            sx={{
              bgcolor: open ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
              color: open ? 'primary.main' : 'action.active'
            }}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>

        <TableCell component="th" scope="row" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {row.uploadId}
        </TableCell>
        <TableCell sx={{ color: 'text.secondary' }}>{row.jobName}</TableCell>

        <TableCell align="center" sx={{ color: 'text.secondary' }}>{formatDateTime(row.starting)}</TableCell>

        <TableCell align="center" sx={{ color: 'text.secondary' }}>{formatDateTime(row.endTime)}</TableCell>

        <TableCell align="center">
          <StatusChip status={row.activityStatus} />
        </TableCell>
      </TableRow>

      {/* Expanded Detail View */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 3, ml: 9, p: 2, bgcolor: alpha(theme.palette.grey[50], 0.5), borderRadius: 2, border: `1px dashed ${theme.palette.divider}` }}>

              {hasDetails ? (
                <>
                  <Typography variant="subtitle2" gutterBottom component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', fontWeight: 700 }}>
                    <TableViewIcon fontSize="small" />
                    Processing Details
                  </Typography>
                  <Card variant="outlined" sx={{ mt: 2, overflow: 'hidden', borderRadius: 2, boxShadow: 0 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Table Name</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>Read</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>Written</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>Skipped</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>Duration</TableCell>

                          {/* ✅ CONDITIONAL HEADER: Only show if errors exist */}
                          {hasErrors && (
                            <TableCell align="left" sx={{ fontWeight: 600 }}>Error</TableCell>
                          )}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {row.details.map((detail, index) => (
                          <TableRow key={index}>
                            <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                              {detail.tableName}
                            </TableCell>
                            <TableCell align="center">{detail.recordsRead}</TableCell>
                            <TableCell align="center">{detail.recordsWritten}</TableCell>
                            <TableCell align="center">{detail.recordsSkipped}</TableCell>
                            <TableCell align="center" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                              {formatDateTime(detail.starting).split(',')[1]} - {formatDateTime(detail.endTime).split(',')[1]}
                            </TableCell>

                            {/* ✅ CONDITIONAL BODY CELL: Only show if errors exist in the set */}
                            {hasErrors && (
                              <TableCell align="left" sx={{ fontSize: '0.75rem', maxWidth: 200, wordWrap: 'break-word' }}>
                                {detail.errorMessage ? (
                                  <Typography variant="caption" color="error.main" fontWeight={600}>
                                    {detail.errorMessage}
                                  </Typography>
                                ) : (
                                  <Typography variant="caption" color="text.disabled">-</Typography>
                                )}
                              </TableCell>
                            )}

                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
                  No detailed records available.
                </Typography>
              )}

            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

// 2. Fyntrac Styled Card
const FyntracCard = ({ title, children, action, sx }) => {
  const theme = useTheme();
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        boxShadow: `0px 2px 4px ${alpha(theme.palette.grey[300], 0.4)}, 0px 0px 2px ${alpha(theme.palette.grey[400], 0.2)}`,
        bgcolor: 'background.paper',
        transition: 'box-shadow 0.3s, transform 0.2s ease-in-out',
        '&:hover': {
          boxShadow: `0px 12px 24px ${alpha(theme.palette.grey[400], 0.3)}`,
          transform: 'translateY(-2px)'
        },
        ...sx
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 2.5,
          borderBottom: '1px solid',
          borderColor: alpha(theme.palette.divider, 0.5),
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography variant="h6" sx={{ fontSize: '1.05rem', fontWeight: 700, color: 'text.primary' }}>
          {title}
        </Typography>
        {action}
      </Box>
      <Box sx={{ p: 0 }}>
        {children}
      </Box>
    </Card>
  );
};

// --- MAIN PAGE ---
export default function IngestPage() {
  const theme = useTheme();
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [recentUpload, setRecentUpload] = useState(null);
  const [historicalUpload, setHistoricalUpload] = useState([]);
  const [openFileUpload, setOpenFileUpload] = React.useState(false);
  const baseURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI;
  const { tenant, user } = useTenant();
  const fetchUploadActivityCall = `${baseURL}/activitylog/get/recent/loads`;

  const headers = {
    'X-Tenant': tenant,
    'X-User-Id': user?.id || '',
    Accept: '*/*',
  };

  const fetchUploadActivitiyLogs = () => {
    axios.get(fetchUploadActivityCall, { headers: headers })
      .then(response => {
        const logs = response.data || [];
        if (logs.length > 0) {
          setRecentUpload(logs[0]);
          setHistoricalUpload(logs.slice(1));
        } else {
          setRecentUpload(null);
          setHistoricalUpload([]);
        }
        setIsDataFetched(true);
      })
      .catch(error => {
        console.error('Error fetching logs:', error);
      });
  };

  useEffect(() => {
    if (tenant) {
      fetchUploadActivitiyLogs();
    }
  }, [tenant]);

  const handleOpenFileUpload = () => {
    setOpenFileUpload(true);
  };
  const handleCloseFileUpload = () => {
    setOpenFileUpload(false);
  };

  const handleFileDrop = (acceptedFiles) => {

    const serviceURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/accounting/rule/upload';
    const formData = new FormData();
    for (let i = 0; i < acceptedFiles.length; i++) {
      formData.append('files', acceptedFiles[i]);
    }

    axios.post(serviceURL, formData, {
      headers: {
        'X-Tenant': tenant,
        Accept: '*/*',
        'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
      }
    })
      .then(response => {
        // Handle success response if needed
      })
      .catch(error => {
        console.error('Upload error:', error);
        // Handle error if needed
      });

    // You can handle the uploaded files here
    handleCloseFileUpload(); // Close the dialog after handling the files
  };

  return (
    <Box sx={{ bgcolor: alpha(theme.palette.grey[50], 0.5), minHeight: '100vh', pb: 1 }}>

      <Container maxWidth={false} sx={{ py: 1, px: 2 }}>

        {/* 1. Header Section */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, mb: 4 }}>
          <Box>
            <Typography variant="h5" fontWeight={600} color="text.primary" sx={{ letterSpacing: '-0.5px' }}>
              Ingest
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Upload Activity Files">
              <IconButton onClick={handleOpenFileUpload} sx={{ bgcolor: 'white', boxShadow: 1, '&:hover': { bgcolor: 'grey.50' } }}>
                <FileUploadOutlinedIcon color="action" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchUploadActivitiyLogs} sx={{ bgcolor: 'white', boxShadow: 1, '&:hover': { bgcolor: 'grey.50' } }}>
                <RefreshIcon color="action" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* 2. Recent Upload Section */}
        <Box sx={{ mb: 4 }}>
          <FyntracCard
            title="Recent Upload"
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label="Latest" size="small" color="primary" sx={{ fontWeight: 600, height: 24 }} />
              </Box>
            }
          >
            <TableContainer>
              <Table aria-label="recent upload table">
                <TableHead sx={{ bgcolor: alpha(theme.palette.grey[100], 0.5) }}>
                  <TableRow>
                    <TableCell />
                    <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Upload Id</TableCell>
                    <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Job Name</TableCell>

                    <TableCell align="center" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Start Time</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>End Time</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentUpload ? (
                    <Row row={recentUpload} isExpandedDefault={true} />
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary', fontStyle: 'italic' }}>
                        {isDataFetched ? 'No recent upload found.' : 'Loading...'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </FyntracCard>
        </Box>

        {/* 3. Historical Loads Section */}
        <Box>
          <FyntracCard
            title="Historical Loads"
            action={
              <IconButton size="small"><RefreshIcon fontSize="small" /></IconButton>
            }
          >
            <TableContainer>
              <Table aria-label="historical loads table">
                <TableHead sx={{ bgcolor: alpha(theme.palette.grey[100], 0.5) }}>
                  <TableRow>
                    <TableCell width={60} />
                    <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Upload Id</TableCell>
                    <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Job Name</TableCell>

                    <TableCell align="center" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Start Time</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>End Time</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historicalUpload.length > 0 ? (
                    historicalUpload.map((row) => (
                      <Row key={row.uploadId} row={row} />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        {isDataFetched ? 'No historical data available.' : 'Loading...'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

          </FyntracCard>
        </Box>

      </Container>

      <Dialog open={openFileUpload} onClose={handleCloseFileUpload}>
        <DialogTitle>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
            }}
          >
            {/* Top Left: Image */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',  // Change 'left' to 'flex-start'
                gap: 1,
                width: 'fit-content' // Ensures the Box doesn't take more space than needed
              }}
            >
              <img
                src="fyntrac.png"
                alt="Logo"
                style={{
                  width: '100px',
                  height: 'auto',  // Maintain aspect ratio
                  maxWidth: '100%' // Ensures responsiveness
                }}
              />
              <Typography variant="h6">Activity Upload</Typography>
            </Box>
            <Tooltip title='Close'>
              <IconButton
                onClick={handleCloseFileUpload}
                edge="end"
                aria-label="close"
                sx={{
                  color: 'grey.500',
                  '&:hover': { color: 'black' },
                }}
              >
                <HighlightOffOutlinedIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogTitle>
        <DialogContent>
          <FileUploadComponent
            onDrop={handleFileDrop}
            showActivitySelector={true}
            headerMessage={"Select an activity type and upload activity files for secure validation, ingestion, and processing."}
            text="Drag and drop your files here"
            iconColor="#3f51b5"
            borderColor="#3f51b5"
            filesLimit={5}
          />
        </DialogContent>

      </Dialog>

    </Box>
  );
}