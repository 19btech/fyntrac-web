import React from "react";
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Tooltip
} from "@mui/material";
import CalendarViewMonthIcon from "@mui/icons-material/CalendarViewMonth";

/**
 * @param {Array} files - [{ id: string|number, name: string }]
 * @param {Function} onFileClick - callback with (file) when user clicks a file
 */
export default function DataFileList({ files = [], onFileClick }) {
  return (
<>
  {files.map((file) => (
    <ListItem key={file.id} disablePadding>
      <Tooltip title="Click to download" arrow>
        <ListItemButton
          onClick={() => onFileClick && onFileClick(file)}
          sx={{
            // default background transparent
            "&:hover": {
              backgroundColor: "#d0d7dd", // ⬅️ hover color
            },
            transition: "background-color 0.2s ease",
          }}
        >
          <ListItemIcon>
            <CalendarViewMonthIcon sx={{ color: "#555" }} />
          </ListItemIcon>

          <ListItemText
            primary={
              <Typography
                noWrap
                sx={{
                  color: "primary.main",           // link color
                  textDecoration: "underline",     // underline like a link
                  cursor: "pointer",               // hand cursor
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                {file.name}
              </Typography>
            }
          />
        </ListItemButton>
      </Tooltip>
    </ListItem>
  ))}
</>
  );
}
