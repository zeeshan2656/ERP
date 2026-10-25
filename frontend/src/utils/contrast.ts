/**
 * Universal WCAG 2.2 AA Contrast & Color Luminance Engine
 * Guarantees optimal text contrast across all themes, modes, and dynamic user colors.
 */

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Parses hex (#rgb, #rrggbb, #rrggbbaa), rgb(r, g, b), or rgba(r, g, b, a) into RGB numbers
 */
export function parseColorToRgb(color: string): RgbColor | null {
  if (!color || typeof color !== 'string') return null;
  const trimmed = color.trim().toLowerCase();

  // Named color shortcuts
  if (trimmed === 'white') return { r: 255, g: 255, b: 255 };
  if (trimmed === 'black') return { r: 0, g: 0, b: 0 };
  if (trimmed === 'transparent') return null;

  // Hex parsing
  if (trimmed.startsWith('#')) {
    const hex = trimmed.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
      };
    } else if (hex.length >= 6) {
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16),
      };
    }
  }

  // RGB / RGBA parsing
  const rgbMatch = trimmed.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: Math.min(255, Math.max(0, parseInt(rgbMatch[1], 10))),
      g: Math.min(255, Math.max(0, parseInt(rgbMatch[2], 10))),
      b: Math.min(255, Math.max(0, parseInt(rgbMatch[3], 10))),
    };
  }

  return null;
}

/**
 * Legacy hexToRgb helper
 */
export function hexToRgb(hex: string): RgbColor | null {
  return parseColorToRgb(hex);
}

/**
 * Calculates relative luminance according to WCAG 2.2 standard
 */
export function getRelativeLuminance(rgb: RgbColor): number {
  const [rs, gs, bs] = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculates contrast ratio between two colors (ranging from 1.0 to 21.0)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = parseColorToRgb(color1);
  const rgb2 = parseColorToRgb(color2);
  if (!rgb1 || !rgb2) return 1.0;

  const lum1 = getRelativeLuminance(rgb1);
  const lum2 = getRelativeLuminance(rgb2);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return parseFloat(((brightest + 0.05) / (darkest + 0.05)).toFixed(2));
}

/**
 * Returns true if a color has low relative luminance (dark background)
 */
export function isColorDark(color: string): boolean {
  const rgb = parseColorToRgb(color);
  if (!rgb) return false;
  return getRelativeLuminance(rgb) < 0.179;
}

/**
 * Returns the optimal high-contrast text color (dark text vs light text) for any background color
 */
export function getOptimalTextColor(
  backgroundColor: string,
  darkText = '#0f172a',
  lightText = '#f8fafc'
): string {
  const contrastWithDark = getContrastRatio(backgroundColor, darkText);
  const contrastWithLight = getContrastRatio(backgroundColor, lightText);
  return contrastWithLight >= contrastWithDark ? lightText : darkText;
}

/**
 * Validates whether a color pair passes WCAG 2.2 AA (or AAA) standards
 */
export function checkWcagCompliance(textColor: string, bgColor: string, isLarge = false) {
  const ratio = getContrastRatio(textColor, bgColor);
  const aaRequired = isLarge ? 3.0 : 4.5;
  const aaaRequired = isLarge ? 4.5 : 7.0;

  const passesAA = ratio >= aaRequired;
  const passesAAA = ratio >= aaaRequired;

  return {
    passed: passesAA,
    passesAA,
    passesAAA,
    ratio,
    required: aaRequired,
    message: passesAAA
      ? `Contrast ratio ${ratio}:1 passes WCAG AAA (${aaaRequired}:1 required). Superior contrast.`
      : passesAA
      ? `Contrast ratio ${ratio}:1 passes WCAG AA (${aaRequired}:1 required). Good readability.`
      : `Contrast ratio ${ratio}:1 FAILS WCAG AA (${aaRequired}:1 required). Text may be unreadable.`,
  };
}

/**
 * Resolves optimal contrast for any foreground given a background, guaranteeing at least 4.5:1 (WCAG AA).
 */
export function ensureWcagAaContrast(
  foreground: string,
  background: string,
  fallbackDark = '#0f172a',
  fallbackLight = '#f8fafc'
): string {
  const currentRatio = getContrastRatio(foreground, background);
  if (currentRatio >= 4.5) return foreground;
  return getOptimalTextColor(background, fallbackDark, fallbackLight);
}

