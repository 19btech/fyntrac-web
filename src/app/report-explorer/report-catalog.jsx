"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Fade,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import ArrowForward from '@mui/icons-material/ArrowForward';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import { line, surface } from './tokens';

// Same card as the Diagnostic page's empty state (component/map-tabs.jsx).
export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <Card variant="outlined">
      <CardContent
        sx={{
          padding: 6,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Icon sx={{ fontSize: 40, color: 'text.disabled' }} />
        <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
          {title}
        </Typography>
        <Typography variant="body2" color="text.disabled" sx={{ maxWidth: 340 }}>
          {children}
        </Typography>
        {action && <Box sx={{ mt: 1 }}>{action}</Box>}
      </CardContent>
    </Card>
  );
}

// Same look and feel as the Configuration screen cards (settings-dashboard/page.jsx).
function ReportCard({ item, index, onOpen, onPrefetch }) {
  const disabled = item.comingSoon;
  return (
    <Fade in timeout={Math.min((index + 1) * 300, 900)}>
      <Card
        elevation={0}
        sx={{
          position: 'relative',
          height: '100%',
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'grey.200',
          bgcolor: 'white',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.3s ease-in-out',
          '&:hover': disabled
            ? { transform: 'none', boxShadow: 'none', borderColor: 'grey.200' }
            : {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.1)',
                borderColor: 'primary.main',
                bgcolor: '#eff6ff',
              },
        }}
      >
        <CardActionArea
          disabled={disabled}
          onClick={() => onOpen(item)}
          onMouseEnter={() => onPrefetch?.(item)}
          onFocus={() => onPrefetch?.(item)}
          sx={{
            height: '100%',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            '& .MuiCardActionArea-focusHighlight': { background: 'transparent' },
          }}
        >
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, minHeight: 24 }}>
              <Chip label={item.tag} size="small" sx={{ bgcolor: 'grey.100', fontWeight: 600, color: 'text.secondary' }} />
            </Box>
            <Typography variant="h6" fontWeight="700" gutterBottom sx={{ lineHeight: 1.3, pr: 4 }}>
              {item.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {item.description}
            </Typography>
          </Box>
          <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', color: disabled ? 'text.disabled' : 'primary.main' }}>
            <Typography variant="button" fontSize="0.75rem" fontWeight="bold">
              {disabled ? 'Coming Soon' : 'View Report'}
            </Typography>
            {!disabled && <ArrowForward sx={{ fontSize: 16, ml: 1 }} />}
          </Box>
        </CardActionArea>

        <Box sx={{ position: 'absolute', top: 20, right: 16, display: 'flex', gap: 0.25 }}>
          {item.onToggleFavorite && !disabled && (
            <Tooltip title={item.favorite ? 'Remove from favorites' : 'Add to favorites'}>
              <IconButton
                size="small"
                aria-label={item.favorite ? 'Remove from favorites' : 'Add to favorites'}
                aria-pressed={item.favorite}
                onClick={item.onToggleFavorite}
              >
                {item.favorite
                  ? <StarRoundedIcon fontSize="small" sx={{ color: '#F59E0B' }} />
                  : <StarBorderRoundedIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Card>
    </Fade>
  );
}

/**
 * items: [{ key, category, tag, name, description, comingSoon?, favorite?, onToggleFavorite? }]
 */
export default function ReportCatalog({ title, items, onOpen, onPrefetch, emptyIcon, emptyTitle, emptyText }) {
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);

  // "/" focuses search, like most enterprise consoles.
  useEffect(() => {
    const onKey = (e) => {
      const typing = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
      if (e.key === '/' && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => `${i.name} ${i.description}`.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <Box sx={{ px: 3, py: 2.5, overflow: 'auto', height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 2.5 }}>
        <Typography variant="h6" fontWeight={700}>{title}</Typography>
        <TextField
          inputRef={searchRef}
          size="small"
          placeholder="Search reports"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
          sx={{ width: { xs: '100%', sm: 320 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
              ),
              endAdornment: !query && (
                <InputAdornment position="end">
                  <Box
                    component="kbd"
                    sx={{ fontFamily: 'inherit', fontSize: '0.7rem', px: 0.75, py: 0.1, borderRadius: '4px', border: `1px solid ${line}`, color: 'text.secondary', bgcolor: surface.raised }}
                  >
                    /
                  </Box>
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      {visible.length === 0 ? (
        query ? (
          <EmptyState icon={SearchOffRoundedIcon} title="No matching reports">
            Nothing here matches &ldquo;{query}&rdquo;. Try a different name.
          </EmptyState>
        ) : (
          <EmptyState icon={emptyIcon} title={emptyTitle}>{emptyText}</EmptyState>
        )
      ) : (
        <Grid container spacing={3}>
          {visible.map((item, index) => (
            <Grid key={item.key} size={{ xs: 12, md: 6, lg: 4 }}>
              <ReportCard item={item} index={index} onOpen={onOpen} onPrefetch={onPrefetch} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
