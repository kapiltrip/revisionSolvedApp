import type { View } from './types';

export const viewThemes: Record<
  View,
  { ink: string; soft: string; border: string }
> = {
  revision: { ink: '#6d28d9', soft: '#f3e8ff', border: '#d8b4fe' },
  assignments: { ink: '#c2410c', soft: '#fff7ed', border: '#fdba74' },
  reviews: { ink: '#0f766e', soft: '#f0fdfa', border: '#5eead4' },
  ask: { ink: '#be185d', soft: '#fdf2f8', border: '#f9a8d4' },
  capture: { ink: '#0369a1', soft: '#f0f9ff', border: '#7dd3fc' },
  updates: { ink: '#4338ca', soft: '#eef2ff', border: '#a5b4fc' },
};
