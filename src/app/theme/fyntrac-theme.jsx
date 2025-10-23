// src/theme.js
import { createTheme } from "@mui/material/styles";

const fyntracTheme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#00bcd4",
    },
    background: {
      default: "#f7f9fc",
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', sans-serif",
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,  // <--- important
  },
  shape: {
    borderRadius: 12,
  },
});

export default fyntracTheme;
