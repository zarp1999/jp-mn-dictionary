export const LIGHT_COLORS = {
  primary: '#534AB7',
  primaryLight: '#EEEDFE',
  primaryText: '#3C3489',
  bg: '#F8F8F8',
  white: '#FFFFFF',
  border: 'rgba(0,0,0,0.1)',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  textTertiary: '#AAAAAA',
  amber: '#EF9F27',
  amberLight: '#FAEEDA',
  amberText: '#7A5000',
  overlay: 'rgba(0,0,0,0.4)',
  danger: '#D0312D',
};

export const DARK_COLORS = {
  primary: '#8B83E8',
  primaryLight: '#2E2B4A',
  primaryText: '#C8C3FF',
  bg: '#121212',
  white: '#1E1E1E',
  border: 'rgba(255,255,255,0.12)',
  textPrimary: '#F0F0F0',
  textSecondary: '#B0B0B0',
  textTertiary: '#808080',
  amber: '#EF9F27',
  amberLight: '#3D3020',
  amberText: '#F5D08A',
  overlay: 'rgba(0,0,0,0.6)',
  danger: '#FF6B6B',
};

/** @deprecated Use useTheme().colors instead */
export const COLORS = LIGHT_COLORS;

export function getColorsForTheme(theme) {
  return theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
}
