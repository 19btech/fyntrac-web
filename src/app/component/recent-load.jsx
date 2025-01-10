import * as React from 'react';
import { Box
  , Collapse
  , IconButton
  , Table
  , TableBody
  , TableCell
  , TableContainer
  , TableHead
  , TableRow
  , Typography
  , Paper 
  , Tooltip} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { green, orange, red } from '@mui/material/colors';
import Chip from '@mui/material/Chip';
import axios from 'axios';

function Row(props) {
  const { row } = props;
  const [open, setOpen] = React.useState(false);

  const getStatusColor = (status) => {
    // Check if status is COMPLETED and return the appropriate color
    if (status === 'FAILED') {
      return '#ff5757';

    } else if (status === 'COMPLETED') {
      return '#8ac92e';
    } else {
      return '#fca311';
    }

  };
  

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
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
              fontWeight: 'bold'
            }}
          />
        </TableCell>
        <TableCell align="center">
          <IconButton aria-label="visibility" sx={{
                '&:hover': {
                  backgroundColor: 'darkgrey',
                },
              }}>
            <VisibilityOutlinedIcon />
          </IconButton>
          <Tooltip title='Download'>  
          <IconButton aria-label="download activity" sx={{
                '&:hover': {
                  backgroundColor: 'darkgrey',
                },
              }}>
            <FileDownloadOutlinedIcon />
          </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Details
              </Typography>
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <TableRow>
                    <TableCell>Starting Time</TableCell>
                    <TableCell>Endgin Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow key={row.jobId}>
                    <TableCell component="th" scope="row">
                      {row.startingTime}
                    </TableCell>
                    <TableCell>{row.endingTime}</TableCell>
                  </TableRow>

                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}


export default function RecentLoad() {

  const [logData, setLogData] = React.useState([]);

  React.useEffect(() => {
    // Check if attribute metadata exists in localStorage
    // Fetch attribute metadata from backend if not cached
    fetchRecentLoad();
  }, []);

  const fetchRecentLoad = () => {
    axios.get(process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/activitylog/get/recent/loads', {
      headers: {
        'X-Tenant': process.env.NEXT_PUBLIC_TENANT,
        Accept: '*/*',
        'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
      }
    })
      .then(response => {
        const recentLoad = response.data;
        setLogData(recentLoad);
      })
      .catch(error => {
        console.error('Error fetching attribute metadata:', error);
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
            <Row key={log.jobId} row={log} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
