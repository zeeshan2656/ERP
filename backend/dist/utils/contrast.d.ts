/**
 * WCAG 2.1 Contrast Calculation Utilities
 * Ensures text has at least 4.5:1 contrast for normal text and 3.0:1 for large text.
 */
export declare function hexToRgb(hex: string): {
    r: number;
    g: number;
    b: number;
} | null;
export declare function getRelativeLuminance(rgb: {
    r: number;
    g: number;
    b: number;
}): number;
export declare function getContrastRatio(hex1: string, hex2: string): number;
export declare function validateWcagAa(textColor: string, backgroundColor: string, isLargeText?: boolean): {
    passed: boolean;
    ratio: number;
    requiredRatio: number;
    message: string;
};
