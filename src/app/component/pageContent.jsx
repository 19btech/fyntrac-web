import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import dynamic from 'next/dynamic';
import CircularProgress from '@mui/material/CircularProgress';
import HomePage from '../fyntrac-home/page';
import GridHeader from './gridHeader';
import AccessGate from '../user-management/access-gate';

// Each screen is loaded only when it is first opened, so the dashboard does not have to
// download the whole app up front.
const ScreenLoading = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 240 }}>
    <CircularProgress size={32} />
  </Box>
);
const lazy = (load) => dynamic(load, { loading: ScreenLoading });

const AccountingPage = lazy(() => import('../accounting/page'));
const RulePage = lazy(() => import('../rules/page'));
const ModelPage = lazy(() => import('../model/page'));
const SettingsPage = lazy(() => import('../settings/page'));
const SyncPage = lazy(() => import('../sync/page'));
const GLEReportPage = lazy(() => import('../reports/gle-report/page'));
const TransactionActivityReportPage = lazy(() => import('../reports/transaction-activity-report/page'));
const RollforwardReportPage = lazy(() => import('../reports/rollforward-report/page'));
const InstrumentDiagnosticPage = lazy(() => import('../diagnostic/page'));
const PythonModel = lazy(() => import('./python-model'));
const EventConfigurationMain = lazy(() => import('../event-configuration/page'));
const CustomTableMain = lazy(() => import('../custom-table/page'));
const CustomRefDataReportPage = lazy(() => import('../reports/custom-ref-data-report/page'));
const CustomOperationalDataReportPage = lazy(() => import('../reports/custom-operational-data-report/page'));
const SettingsDashboard = lazy(() => import('../settings-dashboard/page'));
const ReportDashboard = lazy(() => import('../report-dashboard/page'));
export default function PageContent({ pathname, method, settingsKey, reportsKey, rulesInitialTab, journalInitialTab }) {

  const renderContent = () => {
    console.log('pathName:', pathname);
    switch (pathname) {
      case '/home':
        return <HomePage />;
      case '/main':
        return <HomePage />;
      case '/mapping':
        return <AccountingPage />
      case '/settings/accounting-rules/reference-data':
        return <RulePage initialTab={rulesInitialTab} />
      case '/settings/accounting-rules/event-configuration':
        return <EventConfigurationMain />
      case '/settings/accounting-rules/custom-table':
        return <CustomTableMain />
      case '/orders':
        return <GridHeader>Inprogress</GridHeader>;
      case '/model':
        return <ModelPage />
      case '/settings/configure':
        return <SettingsPage />
      case '/journal-mapping':
        return <AccountingPage initialTab={journalInitialTab} />
      case '/sync':
        return <SyncPage />
      case '/report-dashboard':
        return <ReportDashboard key={reportsKey} />
      case '/reports/gle-report':
        return <GLEReportPage />
      case '/reports/transaction-activity-report':
        return <TransactionActivityReportPage />
      case '/reports/rollforward-report':
        return <RollforwardReportPage />
      case '/reports/custom-ref-data-report':
        return <CustomRefDataReportPage />
      case '/reports/custom-operational-data-report':
        return <CustomOperationalDataReportPage />
      case '/diagnostic':
        return <AccessGate permission="diagnostic.run" area="Diagnostic"><InstrumentDiagnosticPage /></AccessGate>
      case '/settings-dashboard':
        return <SettingsDashboard key={settingsKey} />
      case '/python-model':
        return <PythonModel setOpenPythonModel={method} />
      default:
        return <GridHeader>Work inprogress.</GridHeader>;
    }
  };

  return (
    <Box sx={{
      py: 2, textAlign: 'center'
      // , border: '1px #c1c1c1', // Define border
      // borderRadius: '3px', // Optional: rounded corners
      // , padding: 1, // Spacing inside the box (theme spacing unit)
      , margin: 1, // Spacing outside the box (theme spacing unit)
      background: '#ffffff'
    }}
    >
      {renderContent()}
    </Box>
  );
}

PageContent.propTypes = {
  pathname: PropTypes.string.isRequired, // Enforce required prop
};
