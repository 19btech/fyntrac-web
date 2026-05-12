"use client";

import React, { useState } from 'react';
import apiClient from '../services/api-client';
import { useTenant } from '../tenant-context';
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
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
  const { user, tenant } = useTenant();

  const ComingSoon = () => (
    <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
      <AssessmentOutlined sx={{ fontSize: 50, mb: 1, opacity: 0.5 }} />
      <Typography>This report is under construction.</Typography>
    </Box>
  );

  const categories = [
    {
      name: "Standard Reports",
      tag: "Standard",
      reports: [
        { name: "Transaction Activity Report", description: "Shows all transaction movements for each instrument over time.", component: TransactionActivityReportPage },
        { name: "Attribute History Report", description: "Displays how key instrument attributes changed across posting periods.", component: ComingSoon },
        { name: "Balance Rollforward Report", description: "Summarizes opening balances, period movements, and closing balances.", component: RollforwardReportPage }
      ]
    },
    {
      name: "Accounting Reports",
      tag: "Accounting",
      reports: [
        { name: "Journal Entry Report", description: "Lists all generated accounting entries for the selected period.", component: GLEReportPage },
        { name: "Trial Balance", description: "Provides account-level debit and credit totals to validate balanced books.", component: ComingSoon },

      ]
    },
    {
      name: "Custom Table Reports",
      tag: "Custom",
      reports: [
        { name: "Operational Activity Report", description: "Presents data extracted from operational custom tables.", component: CustomOperationalDataReportPage },
        { name: "Reference Meta Data", description: "Shows the structure and stored values of reference-data tables.", component: CustomRefDataReportPage }
      ]
    },
  ];

  const handleCardClick = async (report) => {
    if (report.url) {
      try {
        // Fetch the OIDC ID token from the gateway and pass it to Fyntrac Insight
        const response = await apiClient.get('/auth/token');
        const token = response.data?.token;
        const params = new URLSearchParams();
        if (token) params.set('token', token);

        const displayName = user?.firstName || user?.name || user?.email || tenant || '';
        if (displayName) params.set('firstName', displayName);
        const tenantId = typeof tenant === 'string' ? tenant : (tenant?.id || tenant?.tenantId || tenant?.name || '');
        if (tenantId) params.set('tenant', tenantId);

        const qs = params.toString();
        const url = qs ? `${report.url}?${qs}` : report.url;
        window.open(url, '_blank');
      } catch (err) {
        console.error('Failed to fetch token for Fyntrac Insight, opening without token:', err);
        window.open(report.url, '_blank');
      }
      return;
    }
    setSelectedReport(report);
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
    <Container maxWidth={false} sx={{ py: 1, px: { xs: 2, md: 3 }, minHeight: '100vh', textAlign: 'left' }}>

      {categories.map((cat, catIdx) => (
        <Box key={catIdx} sx={{ mb: 6, width: '100%' }}>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography variant="overline" fontWeight="bold" fontSize="0.85rem" color="text.secondary" sx={{ letterSpacing: 1.5, textTransform: 'uppercase' }}>
              {cat.name}
            </Typography>
            <Box sx={{ height: '2px', bgcolor: 'divider', flexGrow: 1, mx: 2, opacity: 0.9 }} />
            {cat.name === "Standard Reports" && (
              <Box
                component="img"
                src="/fyntrac-insight.png"
                alt="Fyntrac Insight"
                sx={{
                  height: 30,
                  mr: 2,
                  objectFit: 'contain',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.2))',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.02)' }
                }}
                onClick={() => handleCardClick({ url: process.env.NEXT_PUBLIC_INSIGHT_URL || "http://localhost:3001" })}
              />
            )}
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
                          {report.description}
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
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1, minHeight: 48, borderBottom: '1px solid', borderColor: 'divider', position: 'relative' }}>
          <Box />
          <IconButton
            onClick={handleClose}
            size="small"
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1,
              bgcolor: 'grey.100',
              '&:hover': { bgcolor: 'grey.300' },
            }}
          >
            <Close fontSize="small" />
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