import React, { useState } from 'react';
import {
  Dialog
  , DialogTitle
  , DialogContent
  , DialogActions
  , Button
  , TextField
  , Checkbox
  , FormControlLabel
  , IconButton
  , Typography
  , Tooltip
  , Box
  , Divider
} from '@mui/material';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';

import axios from 'axios';
import SuccessAlert from '../component/success-alert'
import ErrorAlert from '../component/error-alert'
import { useTenant } from "../tenant-context";

const AddTransactionDialog = ({ open, onClose, editData }) => {
  const { tenant } = useTenant();
  const [transactionName, setTransactionName] = useState('');
  const [isExclusive, setIsExclusive] = useState(false);
  const [isReplayable, setIsReplayable] = useState(false);
  const [isGL, setIsGL] = useState(false);
  const [id, setId] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');



  const serviceURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/transaction/add';

  React.useEffect(() => {
    if (editData) {
      // Populate form fields with editData if provided
      setTransactionName(editData.name);
      setIsExclusive(editData.exclusive === 1 ? true : false);
      setIsGL(editData.isGL === 1 ? true : false);
      setId(editData.id);
      setIsReplayable(editData.isReplayable);
    } else {
      // Clear form fields if no editData (e.g., for adding new transaction)
      setTransactionName('');
      setIsExclusive(false);
      setIsGL(false);
      setIsReplayable(false);
    }
  }, [editData]);

  const handleAddTransaction = async () => {
    try {
      const response = await axios.post(serviceURL, {
        name: transactionName,
        exclusive: isExclusive ? 1 : 0,
        isGL: isGL ? 1 : 0,
        isReplayable: isReplayable ? 1 : 0,
        id: id
      },
        {
          headers: {
            'X-Tenant': tenant,
            Accept: '*/*',
            'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
          }
        }
      );
      setSuccessMessage(response.data);
      setShowSuccessMessage(true);

      setTimeout(() => {
        setShowSuccessMessage(false);
        setShowErrorMessage(false);
        onClose(false);
      }, 3000);
    } catch (error) {
      // Handle error if needed
      setErrorMessage(error);
      setShowErrorMessage(true);

    }
  };

  const handleClose = () => {
    setShowErrorMessage(false);
    setShowSuccessMessage(false);
    onClose(false);
  };

  return (
    <Dialog open={open} onClose={onClose}>
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
            <Typography variant="h6">Transactions</Typography>
          </Box>
          <Tooltip title='Close'>
            <IconButton
              onClick={handleClose}
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

      <Divider />
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <TextField
          sx={{ width: '500px' }}
          label="Transaction Name"
          fullWidth
          value={transactionName}
          onChange={(e) => setTransactionName(e.target.value)}
        />


        <FormControlLabel
          control={<Checkbox checked={isExclusive} onChange={(e) => setIsExclusive(e.target.checked)} />}
          label="Reportable"
        />
        <FormControlLabel
          control={<Checkbox checked={isGL} onChange={(e) => setIsGL(e.target.checked)} />}
          label="Journal"
        />
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center" }}>
        <Tooltip title='Save'>
          <Button
            onClick={handleAddTransaction}
          sx={{
            bgcolor: '#14213d',
            color: 'white',
            '&:hover': {
              color: '#E6E6EF', // Prevent text color from changing on hover
            },
          }}
          >
            Save
          </Button>
        </Tooltip>
      </DialogActions>

      <Divider />
      <div>
        {showSuccessMessage && <SuccessAlert title={'Data saved successfully.'} message={successMessage} onClose={() => setOpen(false)} />}
        {showErrorMessage && <ErrorAlert title={'Error!'} message={errorMessage} onClose={() => setOpen(false)} />}
      </div>
    </Dialog>
  );
};

export default AddTransactionDialog;
