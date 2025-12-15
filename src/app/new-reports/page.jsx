import React from 'react';
import {
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Button,
  Typography,
  Grid,
  Box
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// --- Configuration Data ---
export const reportsData = {
  standard: [
    {
      title: 'Transaction Activity Report',
      description: 'Detailed insights into all transaction-level activities.',
      image: 'trasnsaction-activity-report.png',
      route: '/reports/transaction-activity',
    },
    {
      title: 'Attribute History Report',
      description: 'Track historical changes in financial attributes.',
      image: 'attribute-history-report.png',
      route: '/reports/attribute-history',
    },
    {
      title: 'Balance Rollforward Report',
      description: 'Analyze balance movements over reporting periods.',
      image: 'balance-rollfoward-report.png',
      route: '/reports/balance-rollforward',
    },
  ],
  accounting: [
    {
      title: 'Journal Entry Report',
      description: 'View detailed journal entries with full audit trails.',
      image: 'journal-entry-report.png',
      route: '/reports/journal-entry',
    },
    {
      title: 'Trial Balance',
      description: 'Summarized debit and credit balances for verification.',
      image: 'trial-balance-report.png',
      route: '/reports/trial-balance',
    },
  ],
  custom: [
    {
      title: 'Operational Activity Report',
      description: 'Operational system data captured for reporting.',
      image: 'custom-operational-data-report.png',
      route: '/reports/operational-activity',
    },
    {
      title: 'Reference Meta Data',
      description: 'Reference tables and metadata for master records.',
      image: 'custom-reference-data-report.png',
      route: '/reports/reference-meta',
    },
  ],
};

// --- Single Card Component ---
function ReportCard({ report }) {
  return (
    <Card 
      sx={{ 
        maxWidth: 485, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: 3,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
        }
      }}
    >
      {/* Icon Container: Controls the background and spacing */}
      <Box 
        sx={{ 
          bgcolor: '#f5f7fa', 
          py: 2, // Increased padding slightly for better balance with larger icon
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}
      >
        {/* Actual Image: Sized to 80px - a balanced "medium" size */}
        <Box
          component="img"
          src={report.image}
          alt={report.title}
          sx={{ 
            height: 250, 
            width: 250, 
            objectFit: 'contain' 
          }}
        />
      </Box>

      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" component="div" fontWeight="bold">
          {report.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {report.description}
        </Typography>
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button 
          size="small" 
          variant="contained" 
           sx={{
              bgcolor: '#14213d',
              color: 'white',
              '&:hover': {
                color: '#E6E6EF', // Prevent text color from changing on hover
              },
              textTransform: 'none', borderRadius: 2
            }} 
          endIcon={<ArrowForwardIcon />}
          fullWidth
          href={report.route}
        >
          View Report
        </Button>
      </CardActions>
    </Card>
  );
}

// --- Main Layout Component ---
export default function ReportsGrid() {
  const renderSection = (title, reports) => (
    <Box sx={{ mb: 6 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#1a202c' }}>
        {title}
      </Typography>
      <Grid container spacing={3}>
        {reports.map((report, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <ReportCard report={report} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ p: 4, minHeight: '100vh' }}>
      {renderSection('Standard Reports', reportsData.standard)}
      {renderSection('Accounting Reports', reportsData.accounting)}
      {renderSection('Custom Table Reports', reportsData.custom)}
    </Box>
  );
}