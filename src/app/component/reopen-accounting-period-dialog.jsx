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
import { dataloaderApi } from '../services/api-client';
import { useTenant } from "../tenant-context";

export default function ReopenAccountingPeriodDialog({ dialogTitle, dialogDescription, open, onClose }) {
    const { tenant } = useTenant();
    const [isDataFetched, setIsDataFetched] = React.useState(false);
    const [closedAccountingPeriods, setClosedAccountingPeriods] = React.useState([]);
    const [accountingPeriod, setAccountingPeriod] = React.useState('');
    const [showSuccessMessage, setShowSuccessMessage] = React.useState(false);
    const [successMessage, setSuccessMessage] = React.useState('');
    const [showErrorMessage, setShowErrorMessage] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState('');
    const [isButtonDisabled, setIsButtonDisabled] = React.useState(true);

    const fetchClosedAccountingPeriods = () => {
        const fetchSettings = '/setting/get/closed/accounting-periods';
        dataloaderApi.get(fetchSettings)
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
            const response = await dataloaderApi.post('/setting/reopen/accounting-periods',
                accountingPeriod
                ,
                {
                    headers: {
                        'X-Tenant': tenant,
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
        if (ap != null && ap != "") {
            setAccountingPeriod(ap);
            setIsButtonDisabled(false);

        }

    }

    return (
        <React.Fragment>
            <Dialog sx={{
                '& .MuiDialog-paper': {
                    width: '100%',
                    maxWidth: '500px',
                    borderRadius: 4,
                    boxShadow: '0 32px 64px rgba(15,23,42,0.18)',
                },
            }}
                open={open}
                onClose={onClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle 
                    id="alert-dialog-title"
                    sx={{
                        fontWeight: 700,
                        fontSize: '1.2rem',
                        pb: 1.5,
                        fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
                        color: 'text.primary'
                    }}
                >
                    {dialogTitle}
                </DialogTitle>
                <DialogContent sx={{ pb: 2 }}>
                    <DialogContentText 
                        id="alert-dialog-description"
                        sx={{
                            fontSize: '0.88rem',
                            mb: 3,
                            color: 'text.secondary',
                            lineHeight: 1.6,
                            fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif'
                        }}
                    >
                        {dialogDescription}
                    </DialogContentText>
                    
                    <Autocomplete
                        disablePortal
                        id="closedAccountingPeriods"
                        options={closedAccountingPeriods}
                        getOptionLabel={(option) => option}
                        onChange={(event, newValue) => { handleAccountingPeriod(newValue) }}
                        renderInput={(params) => (
                            <TextField 
                                {...params} 
                                label="Closed Accounting Period" 
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': { borderRadius: 2.5 }
                                }}
                            />
                        )}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <Button 
                        onClick={onClose}
                        sx={{
                            color: 'text.secondary',
                            fontWeight: 600,
                            textTransform: 'none'
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        disabled={isButtonDisabled} 
                        onClick={reopenAllRemainingClosedAccountingPeriods} 
                        variant="contained"
                        sx={{
                            fontWeight: 700,
                            minWidth: 110,
                            textTransform: 'none'
                        }}
                        autoFocus 
                    >
                        Reopen
                    </Button>
                </DialogActions>
                <div>
                    {showSuccessMessage && <SuccessAlert title={'Data saved successfully.'} message={successMessage} onClose={onClose} />}
                    {showErrorMessage && <ErrorAlert title={'Error!'} message={String(errorMessage)} onClose={onClose} />}
                </div>
            </Dialog>
        </React.Fragment>
    );
}
