'use client';

import * as React from 'react';
import {
  Box,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  Tooltip,
  Chip
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import axios from 'axios';

function Row({ row }) {
  const [open, setOpen] = React.useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'FAILED':
        return '#ff5757';
      case 'COMPLETED':
        return '#8ac92e';
      default:
        return '#fca311'; // For IN_PROGRESS, QUEUED, etc.
    }
  };

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {row.jobId}
        </TableCell>
        <TableCell align="center">{row.jobName}</TableCell>
        <TableCell align="center">{row.startingTime}</TableCell>
        <TableCell align="center">
          <Chip
            label={row.activityStatus}
            style={{
              backgroundColor: getStatusColor(row.activityStatus),
              color: '#fff',
              fontWeight: 'bold',
            }}
          />
        </TableCell>
        <TableCell align="center">
          <Tooltip title="View Details">
            <IconButton
              aria-label="visibility"
              sx={{ '&:hover': { backgroundColor: 'darkgrey' } }}
            >
              <VisibilityOutlinedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download">
            <IconButton
              aria-label="download"
              sx={{ '&:hover': { backgroundColor: 'darkgrey' } }}
            >
              <FileDownloadOutlinedIcon />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom>
                Details
              </Typography>
              <Table size="small" aria-label="job details">
                <TableHead>
                  <TableRow>
                    <TableCell>Starting Time</TableCell>
                    <TableCell>Ending Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>{row.startingTime}</TableCell>
                    <TableCell>{row.endingTime}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function RecentLoad() {
  const [logData, setLogData] = React.useState([]);

  React.useEffect(() => {
    fetchRecentLoad();
  }, []);

  const fetchRecentLoad = () => {
    axios
      .get(`${process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI}/activitylog/get/recent/loads`, {
        headers: {
          'X-Tenant': process.env.NEXT_PUBLIC_TENANT,
          Accept: '*/*',
        },
      })
      .then((response) => {
        setLogData(response.data || []);
      })
      .catch((error) => {
        console.error('Error fetching recent loads:', error);
      });
  };

  return (
    <TableContainer component={Paper} elevation={0}>
      <Table aria-label="collapsible table">
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>Job Id</TableCell>
            <TableCell align="center">Job Name</TableCell>
            <TableCell align="center">Start Time</TableCell>
            <TableCell align="center">Status</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logData.map((log) => (
            <Row key={log.jobId || `${log.jobName}-${log.startingTime}`} row={log} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
