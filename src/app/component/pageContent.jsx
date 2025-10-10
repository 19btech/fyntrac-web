import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import HomePage from '../fyntrac-home/page';
import AccountingPage from '../accounting/page';
import GridHeader from './gridHeader';
import RulePage from '../rules/page';
import ModelPage from '../model/page';
import SettingsPage from '../settings/page'
import SyncPage from '../sync/page';
import GLEReportPage from '../reports/gle-report/page';
import TransactionActivityReportPage from '../reports/transaction-activity-report/page';
import RollforwardReportPage from '../reports/rollforward-report/page';
import InstrumentDiagnosticPage from '../diagnostic/page';
import PythonModel from './python-model';

export default function PageContent({ pathname, method }) {
  const renderContent = () => {
    console.log('pathName:', pathname);
    switch (pathname) {
      case '/dashboard':
        return <HomePage />;
      case '/mapping':
        return <AccountingPage />
      case '/settings/accounting-rules':
        return <RulePage />
      case '/orders':
        return <GridHeader>Inprogress</GridHeader>;
      case '/model':
        return <ModelPage />
      case '/settings/configure':
        return <SettingsPage />
      case '/sync':
        return <SyncPage />
      case '/reports/gle-report':
        return <GLEReportPage />
      case '/reports/transaction-activity-report':
        return <TransactionActivityReportPage />
      case '/reports/rollforward-report':
        return <RollforwardReportPage />
      case '/diagnostic':
        return <InstrumentDiagnosticPage />
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
