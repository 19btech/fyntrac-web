"use client";

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  Grid2 as Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Container,
  Chip,
  Fade
} from '@mui/material';
import { 
  Close,
  ArrowForward,
  AssessmentOutlined 
} from '@mui/icons-material';

// Import your actual report pages
import GLEReportPage from '../reports/gle-report/page';
import TransactionActivityReportPage from '../reports/transaction-activity-report/page';
import RollforwardReportPage from '../reports/rollforward-report/page';
import CustomRefDataReportPage from '../reports/custom-ref-data-report/page';
import CustomOperationalDataReportPage from '../reports/custom-operational-data-report/page';

export default function ReportDashboard() {
  const [open, setOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const ComingSoon = () => (
    <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
      <AssessmentOutlined sx={{ fontSize: 50, mb: 1, opacity: 0.5 }} />
      <Typography>This report is under construction.</Typography>
    </Box>
  );

  const categories = [
    {
      name: "Standard Reports",
      tag: "Daily",
      reports: [
        { name: "Transaction Activity Report", component: TransactionActivityReportPage },
        { name: "Attribute History Report", component: ComingSoon },
        { name: "Balance Rollforward Report", component: RollforwardReportPage }
      ]
    },
    {
      name: "Accounting Reports",
      tag: "Finance",
      reports: [
        { name: "Journal Entry Report", component: GLEReportPage },
        { name: "Trial Balance", component: ComingSoon }
      ]
    },
    {
      name: "Custom Table Reports",
      tag: "Admin",
      reports: [
        { name: "Operational Activity Report", component: CustomOperationalDataReportPage },
        { name: "Reference Meta Data", component: CustomRefDataReportPage }
      ]
    },
  ];

  const handleCardClick = (reportObject) => {
    setSelectedReport(reportObject);
    setOpen(true);
  };

  // 👇 UPDATED HANDLE CLOSE FUNCTION
  const handleClose = (event, reason) => {
    // If the reason is 'backdropClick', do NOTHING (return early)
    if (reason === 'backdropClick') {
      return;
    }

    // Otherwise (e.g., 'escapeKeyDown' or button click), close the dialog
    setOpen(false);
    setTimeout(() => setSelectedReport(null), 200);
  };

  return (
    <Container maxWidth={false} sx={{ py: 6, px: { xs: 2, md: 6 }, minHeight: '100vh', textAlign: 'left' }}>
      
      {categories.map((cat, catIdx) => (
        <Box key={catIdx} sx={{ mb: 6, width: '100%' }}>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography variant="overline" fontWeight="bold" fontSize="0.85rem" color="text.secondary" sx={{ letterSpacing: 1.5, textTransform: 'uppercase' }}>
              {cat.name}
            </Typography>
            <Box sx={{ height: '1px', bgcolor: 'divider', flexGrow: 1, ml: 2, opacity: 0.6 }} />
          </Box>

          <Grid container spacing={3}>
            {cat.reports.map((report, idx) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={idx}>
                <Fade in={true} timeout={(idx + 1) * 300}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      height: '100%', 
                      borderRadius: 4,
                      border: '1px solid',
                      borderColor: 'grey.200',
                      bgcolor: 'white',
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.1)',
                        borderColor: 'primary.main',
                        bgcolor: '#eff6ff', 
                      }
                    }}
                  >
                    <CardActionArea 
                      onClick={() => handleCardClick(report)} 
                      sx={{ 
                        height: '100%', 
                        p: 3, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'flex-start', 
                        justifyContent: 'space-between',
                        '& .MuiCardActionArea-focusHighlight': { background: 'transparent' }
                      }}
                    >
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                           <Chip label={cat.tag} size="small" sx={{ bgcolor: 'grey.100', fontWeight: 600, color: 'text.secondary' }} />
                        </Box>
                        <Typography variant="h6" fontWeight="700" gutterBottom sx={{ lineHeight: 1.3 }}>
                          {report.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                          View detailed analytics and export data for {report.name.toLowerCase()}.
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', color: 'primary.main' }}>
                        <Typography variant="button" fontSize="0.75rem" fontWeight="bold">View Report</Typography>
                        <ArrowForward sx={{ fontSize: 16, ml: 1 }} />
                      </Box>
                    </CardActionArea>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}

      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth={false} 
        scroll="paper"
        slotProps={{
          paper: {
            sx: {
              width: '98%',
              maxWidth: '98%',
              height: '90vh',
              borderRadius: 2,
              overflow: 'visible',
            }
          },
          backdrop: {
            sx: {
              backdropFilter: 'blur(4px)', 
              backgroundColor: 'rgba(0, 0, 0, 0.4)'
            }
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 0, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box>
          </Box>
          <IconButton onClick={handleClose} sx={{ bgcolor: 'grey.50', '&:hover': { bgcolor: 'grey.200' } }}>
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers sx={{ p: 1, bgcolor: '#fafafa' }}>
           {selectedReport && selectedReport.component && (
             <selectedReport.component />
           )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}