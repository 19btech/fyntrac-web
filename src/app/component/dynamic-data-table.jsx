import React from 'react';
import { styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: '#EEF6FF',
    color: theme.palette.common.black,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

const numberFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function DynamicTable({ columns, rows, rowKey }) {
  return (
    <TableContainer component={Paper}>
      <Table 
        sx={{ 
          width: '100%',  // Takes full available width
          tableLayout: 'auto', // Allows columns to adjust based on content
          overflowX: 'auto', // Adds horizontal scroll if needed
        }} 
        aria-label="dynamic table"
      >
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <StyledTableCell
                key={column.id}
                align={column.align || 'left'}
              >
                {column.label}
              </StyledTableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <StyledTableRow key={row[rowKey]}>
              {columns.map((column) => {
                const value = row[column.id];
                return (
                  <StyledTableCell
                    key={column.id}
                    align={column.align || 'left'}
                    component={column.id === columns[0].id ? 'th' : undefined}
                    scope={column.id === columns[0].id ? 'row' : undefined}
                    sx={{
                      whiteSpace: 'nowrap', // Prevents text wrapping
                      overflow: 'hidden', // Hides overflow
                      textOverflow: 'ellipsis', // Adds ellipsis for overflow
                      maxWidth: '200px', // Optional: set max width for cells
                    }}
                  >
                    {column.format ? column.format(value) : value}
                  </StyledTableCell>
                );
              })}
            </StyledTableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}