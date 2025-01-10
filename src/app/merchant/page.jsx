"use client"
import React from 'react'
import Layout from '../component/layout'
import Header from '../component/header'
import Body from '../component/body'
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { DataGrid } from '@mui/x-data-grid';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import AddBoxRoundedIcon from '@mui/icons-material/AddBoxRounded';
import SaveAsOutlinedIcon from '@mui/icons-material/SaveAsOutlined';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormBody from '../component/form-body'
import EMAILPATTERN from '../component/form-body'


const drawerWidth = 240;

const commonStyles = {
  bgcolor: 'background.paper',
  borderColor: 'text.primary',
  display: 'flex', alignItems: 'center', justifyContent: 'center'
  
};

const columns = [
  { field: 'id', headerName: 'ID', width: 90 },
  {
    field: 'merchantName',
    headerName: 'Merchant name',
    width: 150,
    editable: true,
    
  },
  {
    field: 'webDomain',
    headerName: 'Web domain',
    width: 150,
    editable: true,
  },
  {
    field: 'email',
    headerName: 'Eamil',
    type: 'String',
    width: 200,
    editable: true,
  },
  {
    field: 'contactPerson',
    headerName: 'Contact person',
    description: 'contact person',
    sortable: false,
    width: 155,
   
  },
];

{
  /*
  valueGetter: (params) =>
    `${params.row.firstName || ''} ${params.row.lastName || ''}`,
    */
  }

const rows = [
  { id: 1, merchantName: 'Snow', contactPerson: 'Jon', webDomain: '19Btech.com', email: 'test@test.com' },
  { id: 2, merchantName: 'Lannister', contactPerson: 'Cersei', webDomain: '19Btech.com' , email: 'test@test.com' },
  { id: 3, merchantName: 'Lannister', contactPerson: 'Jaime', webDomain: '19Btech.com'  , email: 'test@test.com' },
  { id: 4, merchantName: 'Stark', contactPerson: 'Arya', webDomain: '19Btech.com'  , email: 'test@test.com' },
  { id: 5, merchantName: 'Targaryen', contactPerson: 'Daenerys', webDomain: '19Btech.com'  , email: 'test@test.com' },
  { id: 6, merchantName: 'Melisandre', contactPerson: null, webDomain: '19Btech.com'  , email: 'test@test.com' },
  { id: 7, merchantName: 'Clifford', contactPerson: 'Ferrara', webDomain: '19Btech.com'  , email: 'test@test.com' },
  { id: 8, merchantName: 'Frances', contactPerson: 'Rossini', webDomain: '19Btech.com'  , email: 'test@test.com' },
  { id: 9, merchantName: 'Roxie', contactPerson: 'Harvey', webDomain: '19Btech.com'  , email: 'test@test.com' },
];


export default function merchantPage() {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const isEmailValid = emailPattern.test(email);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };


  return (
    <>
    <Layout>
      
   <Header> 

    <Grid container spacing={1} sx={{alignItems: 'start', pl: 2}}>

    <Grid item xs={10} sx={{verticalAlign: 'center'}}>
        Merchant
      </Grid>

      <Grid item xs={2}>
      
    <Button sx={{marginLeft:4, borderColor: 'red', color: 'red',  '&:hover': {

backgroundColor: 'lightgrey',

},}} variant="contained" startIcon={<DeleteOutlinedIcon />}>
      Delete
    </Button>




      <Button onClick={handleClickOpen}  sx={{marginLeft:2, borderColor: 'green', color: 'green', '&:hover': {

backgroundColor: 'lightgrey',

},}} variant="contained" startIcon={<AddBoxRoundedIcon />}>
  Add
</Button>

      </Grid>
    </Grid>
   </Header>

   <Box sx={{height: '1rem',}}/>

   <Body>

   <Box sx={{ ...commonStyles, height: '98%', width: '98%',   borderRadius: '7px' }} className={"bg-white"} >

   <DataGrid
        sx={{borderRadius: '7px'}}
        rows={rows}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 5,
            },
          },
          boxShadow: 2,
          border: 2,
          borderColor: 'primary.light',
          '& .MuiDataGrid-cell:hover': {
            color: 'primary.main',
          },
          '& .MuiDataGrid-header': {
            fontWeight: 'bold',
          },
        }}
        pageSizeOptions={[5]}
        checkboxSelection
        disableRowSelectionOnClick
      />
    </Box>

   </Body>

{
  /*Add Merchant form */ 
  
  <Dialog
        open={open}
        onClose={handleClose}
        PaperProps={{
          component: 'form',
          onSubmit: (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const formJson = Object.fromEntries(formData.entries());
            const text = formJson.email;
            handleClose();
          },
        }}
      >
        <DialogTitle>Add Merchant</DialogTitle>
        <Divider />
        <DialogContent>
         <FormBody>

          <Grid container spacing={2}>

      <Grid item xs={6}>
      <div>
        <TextField
          required
          size="small"
          id="merchantName"
          name="merchantName"
          label="Merchant Name"
          defaultValue=""
        />
        </div>
      </Grid>
      <Grid item xs={6}>
      <div>
        <TextField
          required
          size="small"
          id="domainName"
          name="domainName"
          label="Web Domain"
          defaultValue=""
        />
        </div>
      </Grid>

      <Grid item xs={6}>
      <div>
        <TextField
          size="small"
          required
          id="address"
          name="address"
          label="Address"
          defaultValue=""
        />
        </div>
      </Grid>
      <Grid item xs={6}>
      <div>

      <TextField
        label="Email"
        variant="outlined"
        size="small"
        id="email"
        name="email"
        fullWidth
        required
        error={!isEmailValid}
        inputProps={{
          pattern: EMAILPATTERN.source,
        }}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
        </div>
      </Grid>
      <Grid item xs={6}>
      <div>
        <TextField
          required
          size="small"
          id="contact"
          name="contact"
          label="Contact #"
          defaultValue=""
        />
        </div>
      </Grid>
      <Grid item xs={6}>
      <div>
        <TextField
          required
          size="small"
          id="contactPerson"
          label="Contact Person"
          defaultValue=""
        />
        </div>
      </Grid>

    </Grid>
    </FormBody>
    
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained" sx={{marginLeft:2, borderColor: 'green', color: 'green', '&:hover': {

backgroundColor: 'lightgrey',

},}} startIcon={<SaveAsOutlinedIcon />}>Save</Button>
        </DialogActions>
      </Dialog>

}
    </Layout>
    </>
  )
}
