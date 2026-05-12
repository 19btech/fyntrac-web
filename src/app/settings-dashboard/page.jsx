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
  Container,
  Chip,
  Fade,
  Button // Use Button instead of IconButton
} from '@mui/material';
import {
  ArrowForward,
  AssessmentOutlined,
  ArrowBack, // Standard 'Back' icon
} from '@mui/icons-material';

// Import your actual report pages
import SettingsPage from '../settings/page';
import CustomRefDataReportPage from '../reports/custom-ref-data-report/page';
import CustomTablesMain from '../custom-table/page';
import RulePage from '../rules/page';
import EventConfigurationMain from '../event-configuration/page';
import AccountingPage from '../accounting/page';

export default function ReportDashboard() {
  const [selectedReport, setSelectedReport] = useState(null);
  const { user, tenant } = useTenant();

  const ComingSoon = () => (
    <Box sx={{ textAlign: 'center', py: 10, color: 'text.secondary', bgcolor: '#f9fafb', borderRadius: 2 }}>
      <AssessmentOutlined sx={{ fontSize: 60, mb: 2, opacity: 0.3 }} />
      <Typography variant="h6" color="text.secondary">This feature is under construction.</Typography>
    </Box>
  );

  const categories = [
    {
      name: "General Configuration",
      tag: "General",
      reports: [
        { name: "Tenant Management", description: "Manage tenant-level settings, system preferences and environment-wide configurations.", component: SettingsPage },
        { name: "User Management", description: "Create and manages user accounts, roles, and permissions accross the paltform.", component: ComingSoon },
        { name: "Cron Jobs", description: "Configure and monitor scheduled tasks for automated processes and data sync.", component: ComingSoon }
      ]
    },
    {
      name: "Reference Data",
      tag: "Reference",
      reports: [
        { name: "Accounting Rules", description: "Configure transaction logic, aggregation rules, and qualitative and quantitative attributes used in accounting calculations.", component: RulePage },
        { name: "Journal Mapping", description: "Map calcualted output to account subtypes, charts of accounts, and subledgers for journal posting.", component: AccountingPage }
      ]
    },
    {
      name: "Business Configuration",
      tag: "Business",
      reports: [
        { name: "Setup Events", description: "Define business events that aggregate required data from multple input sources.", component: EventConfigurationMain },
        { name: "Setup Custom Tables", description: "Create and manage custom operational and reference data tables to support business specific needs.", component: CustomTablesMain },
        { name: "Logic Studio", description: "Built,test and execute custom business logic for financial workflows.", url: process.env.NEXT_PUBLIC_DSL_STUDIO_URL || "http://localhost:3000" }
      ]
    },
  ];

  // --- RENDER: DETAIL VIEW (The Selected Component) ---
  if (selectedReport) {
    const ComponentToRender = selectedReport.component;

    return (
      <Container maxWidth={false} sx={{ py: 1, px: { xs: 2, md: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Fade in={true}>
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>

            {/* The Actual Component Rendered Here */}
            <Box sx={{ flexGrow: 1, width: '100%', minHeight: '95vh' }}>
              <ComponentToRender />
            </Box>

          </Box>
        </Fade>
      </Container>
    );
  }

  // --- RENDER: DASHBOARD VIEW (Grid of Cards) ---
  return (
    <Container maxWidth={false} sx={{ py: 1, px: { xs: 2, md: 3 }, minHeight: '100vh', textAlign: 'left' }}>
      {categories.map((cat, catIdx) => (
        <Box key={catIdx} sx={{ mb: 6, width: '100%' }}>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography variant="overline" fontWeight="bold" fontSize="0.85rem" color="text.secondary" sx={{ letterSpacing: 1.5, textTransform: 'uppercase' }}>
              {cat.name}
            </Typography>
            <Box sx={{ height: '2px', bgcolor: 'divider', flexGrow: 1, ml: 2, opacity: 0.9 }} />
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
                      onClick={async () => {
                        if (report.url) {
                          try {
                            // Fetch the ID token from the gateway and pass it to DSL Studio
                            const response = await apiClient.get('/auth/token');
                            const token = response.data?.token;
                            const params = new URLSearchParams();
                            if (token) params.set('token', token);

                            const displayName = user?.firstName || user?.name || user?.email || tenant || '';
                            if (displayName) params.set('firstName', displayName);

                            if (tenant) params.set('tenant', tenant);
                            const qs = params.toString();
                            const url = qs ? `${report.url}?${qs}` : report.url;
                            window.open(url, '_blank');
                          } catch (err) {
                            console.error('Failed to fetch token for DSL Studio, opening without token:', err);
                            window.open(report.url, '_blank');
                          }
                        } else {
                          setSelectedReport(report);
                        }
                      }}
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
                        <Typography variant="button" fontSize="0.75rem" fontWeight="bold">Configure</Typography>
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
    </Container>
  );
}