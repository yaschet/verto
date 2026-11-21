/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * Generate a random SVG path.
 *
 * @returns {string} The generated SVG path.
 *
 */
export function generateRandomPath() {
    const points = [];
    for (let i = 0; i <= 100; i += 10) {
        const x = i;
        const y = Math.floor(Math.random() * 100);
        points.push({ x, y });
    }

    let path = `M 0 ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        const { x, y } = points[i];
        path += ` C ${x - 5} ${y + 10}, ${x - 5} ${y - 10}, ${x} ${y}`;
    }
    path += ' L 100 100 L 0 100 Z';
    return path;
}
