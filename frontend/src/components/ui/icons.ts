import type { IconName } from './types';

interface IconData {
  paths: string[];
  circles?: { cx: number; cy: number; r: number }[];
  strokes?: boolean;
}

export const icons: Record<IconName, IconData> = {
  'chevron-down': {
    paths: ['M6 9l6 6 6-6'],
  },
  'chevron-up': {
    paths: ['M18 15l-6-6-6 6'],
  },
  'chevron-left': {
    paths: ['M15 18l-6-6 6-6'],
  },
  'chevron-right': {
    paths: ['M9 18l6-6-6-6'],
  },
  x: {
    paths: ['M18 6L6 18', 'M6 6l12 12'],
  },
  search: {
    paths: ['M21 21l-4.35-4.35', 'M11 19a8 8 0 100-16 8 8 0 000 16z'],
  },
  plus: {
    paths: ['M12 5v14', 'M5 12h14'],
  },
  minus: {
    paths: ['M5 12h14'],
  },
  check: {
    paths: ['M20 6L9 17l-5-5'],
  },
  'alert-triangle': {
    paths: ['M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z', 'M12 9v4', 'M12 17h.01'],
    strokes: true,
  },
  'x-circle': {
    paths: ['M12 22a10 10 0 100-20 10 10 0 000 20z', 'M15 9l-6 6', 'M9 9l6 6'],
    strokes: true,
  },
  info: {
    paths: ['M12 22a10 10 0 100-20 10 10 0 000 20z', 'M12 16v-4', 'M12 8h.01'],
    strokes: true,
  },
  calendar: {
    paths: ['M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z', 'M16 2v4', 'M8 2v4', 'M3 10h18'],
    strokes: true,
  },
  'file-text': {
    paths: ['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8', 'M10 9H8'],
    strokes: true,
  },
  gavel: {
    paths: ['M12 2L3 9h3v4H3l9 7 9-7h-3V9h3L12 2z', 'M5 22h14', 'M5 17h14'],
    strokes: true,
  },
  users: {
    paths: ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2', 'M9 11a4 4 0 100-8 4 4 0 000 8z', 'M23 21v-2a4 4 0 00-3-3.87', 'M16 3.13a4 4 0 010 7.75'],
    strokes: true,
  },
  settings: {
    paths: ['M12 15a3 3 0 100-6 3 3 0 000 6z', 'M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z'],
    strokes: true,
  },
  bell: {
    paths: ['M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 01-3.46 0'],
    strokes: true,
  },
  'bar-chart': {
    paths: ['M12 20V10', 'M18 20V4', 'M6 20v-4'],
    strokes: true,
  },
  'external-link': {
    paths: ['M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6', 'M15 3h6v6', 'M10 14L21 3'],
    strokes: true,
  },
  menu: {
    paths: ['M3 12h18', 'M3 6h18', 'M3 18h18'],
    strokes: true,
  },
  'arrow-left': {
    paths: ['M19 12H5', 'M12 19l-7-7 7-7'],
    strokes: true,
  },
  'arrow-right': {
    paths: ['M5 12h14', 'M12 5l7 7-7 7'],
    strokes: true,
  },
  clock: {
    paths: ['M12 22a10 10 0 100-20 10 10 0 000 20z', 'M12 6v6l4 2'],
    strokes: true,
  },
  eye: {
    paths: ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z', 'M12 15a3 3 0 100-6 3 3 0 000 6z'],
    strokes: true,
  },
  'eye-off': {
    paths: ['M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24', 'M1 1l22 22'],
    strokes: true,
  },
  download: {
    paths: ['M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'],
    strokes: true,
  },
  spinner: {
    paths: ['M12 2a10 10 0 0110 10'],
    circles: [{ cx: 12, cy: 12, r: 10 }],
    strokes: true,
  },
  'plus-circle': {
    paths: ['M12 22a10 10 0 100-20 10 10 0 000 20z', 'M12 8v8', 'M8 12h8'],
    strokes: true,
  },
  'check-circle': {
    paths: ['M22 11.08V12a10 10 0 11-5.93-9.14', 'M22 4L12 14.01l-3-3'],
    strokes: true,
  },
  edit: {
    paths: ['M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7', 'M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z'],
    strokes: true,
  },
  trash: {
    paths: ['M3 6h18', 'M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2', 'M10 11v6', 'M14 11v6'],
    strokes: true,
  },
  send: {
    paths: ['M22 2L11 13', 'M22 2l-7 20-4-9-9-4 20-7z'],
    strokes: true,
  },
  filter: {
    paths: ['M22 3H2l8 9.46V19l4 2v-8.54L22 3z'],
    strokes: true,
  },
  'sort-asc': {
    paths: ['M11 5h10', 'M11 9h7', 'M11 13h4', 'M3 17l4 4 4-4', 'M3 7l4 4 4-4'],
    strokes: true,
  },
  'sort-desc': {
    paths: ['M11 5h10', 'M11 9h7', 'M11 13h4', 'M3 7l4-4 4 4', 'M3 17l4 4 4-4'],
    strokes: true,
  },
  refresh: {
    paths: ['M23 4v6h-6', 'M1 20v-6h6', 'M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15'],
    strokes: true,
  },
  copy: {
    paths: ['M20 9h-9a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2z', 'M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1'],
    strokes: true,
  },
  link: {
    paths: ['M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71', 'M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71'],
    strokes: true,
  },
  unlink: {
    paths: ['M18.84 12.25l1.72-1.71h-.02a5.004 5.004 0 00-.12-7.07 5.006 5.006 0 00-6.95 0l-1.72 1.71', 'M5.17 11.75l-1.71 1.71a5.004 5.004 0 00.12 7.07 5.006 5.006 0 006.95 0l1.71-1.71', 'M8 2v3', 'M2 8h3', 'M16 22v-3', 'M21 16h-3'],
    strokes: true,
  },
  maximize: {
    paths: ['M8 3H5a2 2 0 00-2 2v3', 'M21 8V5a2 2 0 00-2-2h-3', 'M3 16v3a2 2 0 002 2h3', 'M16 21h3a2 2 0 002-2v-3'],
    strokes: true,
  },
  minimize: {
    paths: ['M4 14h6v6', 'M20 10h-6V4', 'M14 10l7-7', 'M3 21l7-7'],
    strokes: true,
  },
  printer: {
    paths: ['M6 9V2h12v7', 'M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2', 'M6 14h12v8H6z'],
    strokes: true,
  },
  'map-pin': {
    paths: ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z', 'M12 13a3 3 0 100-6 3 3 0 000 6z'],
    strokes: true,
  },
  mic: {
    paths: ['M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z', 'M19 10v2a7 7 0 01-14 0v-2', 'M12 19v4', 'M8 23h8'],
    strokes: true,
  },
  'mic-off': {
    paths: ['M1 1l22 22', 'M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6', 'M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23', 'M12 19v4', 'M8 23h8'],
    strokes: true,
  },
  video: {
    paths: ['M23 7l-7 5 7 5V7z', 'M14 5H3a2 2 0 00-2 2v10a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2z'],
    strokes: true,
  },
  'video-off': {
    paths: ['M23 7l-7 5 7 5V7z', 'M1 17l5-5', 'M10 5h4a2 2 0 012 2v10a2 2 0 01-2 2h-4', 'M16 2l4 4M3 2l4 4'],
    strokes: true,
  },
  phone: {
    paths: ['M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z'],
    strokes: true,
  },
  mail: {
    paths: ['M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z', 'M22 6l-10 7L2 6'],
    strokes: true,
  },
  home: {
    paths: ['M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z', 'M9 22V12h6v10'],
    strokes: true,
  },
  'log-out': {
    paths: ['M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
    strokes: true,
  },
  user: {
    paths: ['M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2', 'M12 11a4 4 0 100-8 4 4 0 000 8z'],
    strokes: true,
  },
  lock: {
    paths: ['M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z', 'M17 11V7a5 5 0 00-10 0v4'],
    strokes: true,
  },
  unlock: {
    paths: ['M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z', 'M17 11V7a5 5 0 019.9-1'],
    strokes: true,
  },
  shield: {
    paths: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
    strokes: true,
  },
  globe: {
    paths: ['M12 22a10 10 0 100-20 10 10 0 000 20z', 'M2 12h20', 'M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z'],
    strokes: true,
  },
};
