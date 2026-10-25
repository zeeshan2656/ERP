/**
 * WCAG 2.1 Contrast Calculation Utilities
 * Ensures text has at least 4.5:1 contrast for normal text and 3.0:1 for large text.
 */
// Helper to convert hex to RGB
export function hexToRgb(hex) {
    const sanitized = hex.replace('#', '').trim();
    if (sanitized.length === 3) {
        const r = parseInt(sanitized[0] + sanitized[0], 16);
        const g = parseInt(sanitized[1] + sanitized[1], 16);
        const b = parseInt(sanitized[2] + sanitized[2], 16);
        return { r, g, b };
    }
    else if (sanitized.length === 6) {
        const r = parseInt(sanitized.substring(0, 2), 16);
        const g = parseInt(sanitized.substring(2, 4), 16);
        const b = parseInt(sanitized.substring(4, 6), 16);
        return { r, g, b };
    }
    return null;
}
// Calculate relative luminance of an sRGB color (0.0 to 1.0)
export function getRelativeLuminance(rgb) {
    const [rs, gs, bs] = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map((val) => {
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}
// Calculate contrast ratio between two hex colors (1:1 to 21:1)
export function getContrastRatio(hex1, hex2) {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);
    if (!rgb1 || !rgb2)
        return 1.0;
    const lum1 = getRelativeLuminance(rgb1);
    const lum2 = getRelativeLuminance(rgb2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
}
// Validate WCAG AA compliance
export function validateWcagAa(textColor, backgroundColor, isLargeText = false) {
    const ratio = parseFloat(getContrastRatio(textColor, backgroundColor).toFixed(2));
    const requiredRatio = isLargeText ? 3.0 : 4.5;
    const passed = ratio >= requiredRatio;
    return {
        passed,
        ratio,
        requiredRatio,
        message: passed
            ? `Contrast ratio ${ratio}:1 passes WCAG AA (${requiredRatio}:1 required)`
            : `Contrast ratio ${ratio}:1 fails WCAG AA (${requiredRatio}:1 required). Text may appear soft or unreadable.`,
    };
}
//# sourceMappingURL=contrast.js.map