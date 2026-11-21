/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import chroma from 'chroma-js';

export function hexToRgb(hex: string) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (_, r, g, b) {
        return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
              b: parseInt(result[3], 16),
              g: parseInt(result[2], 16),
              r: parseInt(result[1], 16),
          }
        : {
              b: 0,
              g: 0,
              r: 0,
          };
}

export const oklchToHex = (color: string, alpha?: number) => {
    const formattedColor = color.replace(/ /g, ', ');

    // 1. Parse the Color to: chroma(0.8, 0.12, 60, 'oklch')
    // Formatted Color String is in the format of: oklch(0.8, 0.12, 60)
    const LCH = formattedColor.split(', ');

    // 2. Extract the L, C, H values from the parsed color
    // 0.8 = Lightness, 0.12 = Chroma, 60 = Hue
    const L = parseFloat(LCH[0].replace('oklch(', ''));
    const C = parseFloat(LCH[1]);
    const H = parseFloat(LCH[2].replace(')', ''));
    const A = alpha ?? 1;

    // 3. Convert the L, C, H values to a chroma color
    const parsedColor = chroma(L, C, H, 'oklch').alpha(A);

    // 4. Convert the chroma color to a hex color
    const hexColor = parsedColor.hex();

    return hexColor ?? '#ffffff';
};

/**
 * Generates a simple hash code from a string.
 *
 * @param str - The input string to hash.
 * @returns A numerical hash code.
 */
export function stringToHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

/**
 * Maps a string to a color from the provided color palette deterministically.
 *
 * @param str - The input string to map.
 * @param palette - An array of color strings.
 * @returns A color string from the palette.
 */
export function getColorForString(str: string, palette: string[]): string {
    const hash = stringToHash(str);
    const index = hash % palette.length;
    return palette[index];
}
