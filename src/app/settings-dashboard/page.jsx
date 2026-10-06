"use client";

import React, { useState } from 'react';
import apiClient from '../services/api-client';
import { dslStudioUrl } from '../services/runtime-config';
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
  Button, // Use Button instead of IconButton
  Tooltip
} from '@mui/material';
import {
  ArrowForward,
  AssessmentOutlined,
  ArrowBack, // Standard 'Back' icon
  LockOutlined,
} from '@mui/icons-material';

// Import your actual report pages
import SettingsPage from '../settings/page';
import CustomRefDataReportPage from '../reports/custom-ref-data-report/page';
import CustomTablesMain from '../custom-table/page';
import RulePage from '../rules/page';
import EventConfigurationMain from '../event-configuration/page';
import AccountingPage from '../accounting/page';
import UserManagement from '../user-management/user-management';
import CronJobs from '../cron-jobs/cron-jobs';
import { useAccess } from '../user-management/access';

export default function ReportDashboard() {
  const [selectedReport, setSelectedReport] = useState(null);
  const { user, tenant } = useTenant();
  const { can, failed: accessFailed } = useAccess();

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
        { name: "User Management", description: "Invite and manage users, user types and their permissions across the platform.", component: UserManagement, permission: 'users.view' },
        { name: "Cron Jobs", description: "Configure and monitor scheduled tasks for automated model execution and accounting close.", component: CronJobs }
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
        { name: "Logic Studio", description: "Built,test and execute custom business logic for financial workflows.", url: dslStudioUrl(), permission: 'logicStudio.access' }
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
            {cat.reports.map((report, idx) => {
              // Role-gated cards stay visible but locked, so users know the feature exists.
              const locked = Boolean(report.permission) && can(report.permission) === false;
              return (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={idx}>
                <Tooltip title={!locked ? '' : accessFailed ? 'Your access could not be checked. Reload the page to try again.' : 'Your user type does not include this. Ask an Admin for access.'} placement="top">
                <Fade in={true} timeout={(idx + 1) * 300}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      borderRadius: 4,
                      border: '1px solid',
                      borderColor: 'grey.200',
                      bgcolor: locked ? 'grey.50' : 'white',
                      opacity: locked ? 0.75 : 1,
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': locked ? { transform: 'none', boxShadow: 'none' } : {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.1)',
                        borderColor: 'primary.main',
                        bgcolor: '#eff6ff',
                      }
                    }}
                  >
                    <CardActionArea
                      disabled={locked}
                      aria-disabled={locked}
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
                          {locked && <Chip icon={<LockOutlined sx={{ fontSize: 14 }} />} label="No access" size="small" sx={{ fontWeight: 600, color: 'text.secondary', bgcolor: 'grey.100' }} />}
                        </Box>
                        <Typography variant="h6" fontWeight="700" gutterBottom sx={{ lineHeight: 1.3 }}>
                          {report.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                          {report.description}
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', color: locked ? 'text.disabled' : 'primary.main' }}>
                        <Typography variant="button" fontSize="0.75rem" fontWeight="bold">{locked ? 'Locked' : 'Configure'}</Typography>
                        {locked ? <LockOutlined sx={{ fontSize: 16, ml: 1 }} /> : <ArrowForward sx={{ fontSize: 16, ml: 1 }} />}
                      </Box>
                    </CardActionArea>
                  </Card>
                </Fade>
                </Tooltip>
              </Grid>
              );
            })}
          </Grid>
        </Box>
      ))}
    </Container>
  );
}