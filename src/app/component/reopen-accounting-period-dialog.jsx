import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box';
import SuccessAlert from '../component/success-alert'
import ErrorAlert from '../component/error-alert'
import axios from 'axios';

export default function ReopenAccountingPeriodDialog({ dialogTitle, dialogDescription, open, onClose }) {
    const [isDataFetched, setIsDataFetched] = React.useState(false);
    const [closedAccountingPeriods, setClosedAccountingPeriods] = React.useState([]);
    const [accountingPeriod, setAccountingPeriod] = React.useState('');
    const [showSuccessMessage, setShowSuccessMessage] = React.useState(false);
    const [successMessage, setSuccessMessage] = React.useState('');
    const [showErrorMessage, setShowErrorMessage] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState('');
    const [isButtonDisabled, setIsButtonDisabled] = React.useState(true);

    const fetchClosedAccountingPeriods = () => {
        const fetchSettings = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/setting/get/closed/accounting-periods';
        axios.get(fetchSettings, {
            headers: {
                'X-Tenant': process.env.NEXT_PUBLIC_TENANT,
                Accept: '*/*',
                'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
            }
        })
            .then(response => {
                setClosedAccountingPeriods(response.data);
                const fiscalPeriodDate = new Date(response.data.fiscalPeriodStartDate);
                // Handle success response if needed
            })
            .catch(error => {
                // Handle error if needed
            });
    };

    React.useEffect(() => {
        fetchClosedAccountingPeriods();
        setIsDataFetched(true);
    }, [isDataFetched]);

    const reopenAllRemainingClosedAccountingPeriods = async () => {
        try {
            const response = await axios.post(process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/setting/reopen/accounting-periods',
                accountingPeriod
                ,
                {
                    headers: {
                        'X-Tenant': process.env.NEXT_PUBLIC_TENANT,
                        Accept: '*/*',
                        'Content-Type': 'application/json',
                        'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
                    }
                }
            );
            setSuccessMessage('');
            setShowSuccessMessage(true);

            setTimeout(() => {
                setShowSuccessMessage(false);
                setShowErrorMessage(false);
                onClose();
            }, 3000);
        } catch (error) {
            // Handle error if needed
            setErrorMessage(error);
            setShowErrorMessage(true);

        }
    };

    const handleAccountingPeriod = (ap) => {
        if(ap !=null && ap != "") {
            setAccountingPeriod(ap);
            setIsButtonDisabled(false);

        }
        
    }

    return (
        <React.Fragment>
            <Dialog sx={{
                '& .MuiDialog-paper': {
                    width: '100%', // Set width to 100% (full width)
                    maxWidth: '800px',

                },
            }}
                open={open}
                onClose={onClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {dialogTitle}
                </DialogTitle>
                <DialogContent sx={{
                    height: '150px',
                }}>
                    <DialogContentText id="alert-dialog-description">
                        {dialogDescription}
                    </DialogContentText>
                    <Divider />
                    <Box my={3}>
                        
                    </Box>

                    <Autocomplete
                        disablePortal
                        id="closedAccountingPeriods"
                        options={closedAccountingPeriods}
                        getOptionLabel={(option) => option}
                        onChange={(event, newValue) => { handleAccountingPeriod(newValue) }} // newValue will be the selected option object
                        renderInput={(params) => <TextField {...params} label="Closed Accounting Periods" />}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>cancel</Button>
                    <Button disabled={isButtonDisabled} onClick={reopenAllRemainingClosedAccountingPeriods} autoFocus sx={{
                        bgcolor: '#62CD14', color: 'white',
                        '&:hover': {
                            color: '#62CD14', // Prevent text color from changing on hover
                        },
                    }}>
                        Reopen
                    </Button>
                </DialogActions>
                <div>
                    {showSuccessMessage && <SuccessAlert title={'Data saved successfully.'} message={successMessage} onClose={() => setOpen(false)} />}
                    {showErrorMessage && <ErrorAlert title={'Error!'} message={errorMessage} onClose={() => setOpen(false)} />}
                </div>
            </Dialog>
        </React.Fragment>
    );
}
