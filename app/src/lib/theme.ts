export const colors = {
  bg: '#060910',
  bgElevated: '#0A0F19',
  card: '#101827',
  cardAlt: '#141E30',
  border: '#1D2A3D',
  borderStrong: '#2C405B',
  text: '#F4F7FF',
  textDim: '#A7B4C8',
  textMuted: '#6F7E95',
  accent: '#2CE59B',
  accentDeep: '#0B7A52',
  accentSoft: 'rgba(44, 229, 155, 0.12)',
  purple: '#8B7CFF',
  purpleSoft: 'rgba(139, 124, 255, 0.14)',
  gold: '#FFC857',
  goldSoft: 'rgba(255, 200, 87, 0.14)',
  silver: '#C7D3E3',
  bronze: '#D98A5F',
  danger: '#FF5C6C',
  dangerSoft: 'rgba(255, 92, 108, 0.12)',
  warning: '#FFB020',
  white: '#FFFFFF',
  black: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const gradients = {
  screen: ['#0A1424', colors.bg, colors.bg] as const,
  accent: ['#2CE59B', '#12B981'] as const,
  hero: ['#0E2A24', '#0A1620', '#070B12'] as const,
  card: ['#16202F', '#101827'] as const,
  gold: ['#FFD87A', '#E8A62C'] as const,
  purple: ['#8B7CFF', '#5B4BD6'] as const,
  danger: ['#FF7A87', '#E23B4C'] as const,
};
