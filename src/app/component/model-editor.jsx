import React from "react";
import {
    Box,
    Paper,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Collapse,
    Divider,
    Tooltip,
    IconButton,
} from "@mui/material";
import Grid from '@mui/material/Grid2';
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import DeleteForeverOutlinedIcon from "@mui/icons-material/DeleteForeverOutlined";
import { Editor } from "@monaco-editor/react";

// your component:
export default function ModelEditor({
    tabValue,
    handleChange,
    open,
    activityDataOpen,
    refDataOpen,
    activityDataFiles,
    refDataFiles,
    handleActivityDataClick,
    handleRefDataClick,
    handleFileClick,
    setOpenTestDataFileUpload,
}) {
    return (
        <>

            {/* === BODY === */}
            <Box
                sx={{
                    flexGrow: 1,
                    width: "100%",
                    maxWidth: "100vw",
                    height: "100vh",
                    overflow: "hidden",
                    margin: 0,
                    padding: 0,
                }}
            >
                <Grid
                    container
                    spacing={0}
                    sx={{ height: "100%", width: "100%" }}
                    wrap="nowrap"
                >
                    {/* === Column 1: Chat Window === */}
                    <Grid xs={3} sx={{ height: "100%", spacing: 1 }}>
                        <Paper
                            elevation={3}
                            sx={{
                                height: "100%",
                                p: 2,
                                display: "flex",
                                flexDirection: "column",
                                width: "100%",
                            }}
                        >
                            <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
                                <p>Chat window AI</p>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* === Column 2: Icon Menu + Editor === */}
                    <Grid xs={9} sx={{ height: "100%",  }}>
                        <Grid
                            container
                            spacing={0}
                            sx={{ height: "100%", width: "100%" }}
                            wrap="nowrap"
                        >
                            {/* === Left column === */}
                            <Grid xs={4} sx={{ height: "100%" }}>
                                <Paper
                                    elevation={3}
                                    sx={{
                                        p: 2,
                                        height: "100%",
                                        width: "100%",
                                        borderTopLeftRadius: "12px",
                                        borderBottomLeftRadius: "12px",
                                        borderTopRightRadius: 0,
                                        borderBottomRightRadius: 0,
                                        overflow: "auto",
                                    }}
                                >
                                    {/* Nav/Menu content */}
                                    <nav aria-label="Data setup">
                                        <List sx={{ m: 0, p: 0 }}>
                                            <ListItem disablePadding>
                                                <ListItemButton>
                                                    <ListItemIcon>
                                                        <Tooltip title="Upload test data" arrow>
                                                            <IconButton
                                                                aria-label="add"
                                                                onClick={() => setOpenTestDataFileUpload(true)}
                                                                sx={{
                                                                    "&:hover": { backgroundColor: "darkgrey" },
                                                                }}
                                                            >
                                                                <FileUploadOutlinedIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </ListItemIcon>
                                                    <ListItemText primary="Setup Data" />
                                                </ListItemButton>
                                            </ListItem>
                                        </List>
                                    </nav>

                                    <Divider sx={{ p: 0 }} />

                                    {/* Input Data */}
                                    <ListItemButton>
                                        <Box sx={{ display: "flex", alignItems: "left", mr: 0 }}>
                                            {open ? <ExpandLess /> : <ExpandMore />}
                                        </Box>
                                        <Box sx={{ display: "flex", alignItems: "left", flexGrow: 1 }}>
                                            <ListItemText primary="Input Data" />
                                        </Box>
                                        <Box sx={{ display: "flex", alignItems: "left", gap: 1 }}>
                                            <RefreshOutlinedIcon />
                                            <DeleteForeverOutlinedIcon />
                                        </Box>
                                    </ListItemButton>

                                    <Collapse in={open} timeout="auto" unmountOnExit>
                                        <Box sx={{ paddingLeft: 3 }}>
                                            <ListItemButton onClick={handleActivityDataClick}>
                                                <Box sx={{ display: "flex", alignItems: "left", mr: 0 }}>
                                                    {activityDataOpen ? <ExpandLess /> : <ExpandMore />}
                                                </Box>
                                                <Box
                                                    sx={{ display: "flex", alignItems: "left", flexGrow: 1 }}
                                                >
                                                    <ListItemText primary="Activity Data" />
                                                </Box>
                                            </ListItemButton>
                                            <Collapse in={activityDataOpen} timeout="auto" unmountOnExit>
                                                <List component="div" disablePadding>
                                                    {/* Your DataFileList here */}
                                                    {/* <DataFileList files={activityDataFiles} onFileClick={handleFileClick} /> */}
                                                </List>
                                            </Collapse>
                                        </Box>

                                        <Box sx={{ paddingLeft: 3 }}>
                                            <ListItemButton onClick={handleRefDataClick}>
                                                <Box sx={{ display: "flex", alignItems: "left", mr: 0 }}>
                                                    {refDataOpen ? <ExpandLess /> : <ExpandMore />}
                                                </Box>
                                                <Box
                                                    sx={{ display: "flex", alignItems: "left", flexGrow: 1 }}
                                                >
                                                    <ListItemText primary="Accounting Rules" />
                                                </Box>
                                            </ListItemButton>
                                            <Collapse in={refDataOpen} timeout="auto" unmountOnExit>
                                                <List component="div" disablePadding>
                                                    {/* Your DataFileList here */}
                                                    {/* <DataFileList files={refDataFiles} onFileClick={handleFileClick} /> */}
                                                </List>
                                            </Collapse>
                                        </Box>
                                    </Collapse>
                                </Paper>
                            </Grid>

                            {/* === Right column === */}
                            <Grid xs={8} sx={{ height: "100%" }}>
                                <Paper
                                    elevation={3}
                                    sx={{
                                        p: 2,
                                        height: "100%",
                                        width: "100%",
                                        borderRadius: 0,
                                        overflow: "auto",
                                    }}
                                >
                                    {/* Editor / Tabs */}
                                    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                                        <Tabs value={tabValue} onChange={handleChange}>
                                            <Tab label="Model.py" />
                                        </Tabs>
                                    </Box>
                                    <Box sx={{ p: 2, height: "calc(100% - 48px)" }}>
                                        {tabValue === 0 && (
                                            <Paper elevation={1} sx={{ height: "100%", p: 2 }}>
                                                <Editor
                                                    height="100%"
                                                    defaultLanguage="python"
                                                    defaultValue="// Start coding here..."
                                                    theme="vs-dark"
                                                />
                                            </Paper>
                                        )}
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Box>
        </>
    );
}
