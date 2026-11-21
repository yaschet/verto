/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import confetti from 'canvas-confetti';
import useSound from 'use-sound';
import { useEffect, useRef } from 'react';
import { COLORS_PACK } from '@/constants/colors';
import { useGlobalStore } from '@/src/components/providers/global-store-provider';

function ConfettiComponent() {
    const isConfettiVisible = useGlobalStore((store) => store.isConfettiVisible);
    const hideConfetti = useGlobalStore((store) => store.hideConfetti);
    const intervalRef = useRef<number | null>(null);

    const [play] = useSound('/sounds/celebration.wav', { volume: 0.5 });

    useEffect(() => {
        if (isConfettiVisible) {
            play();

            // Fireworks animation from canvas-confetti
            const duration = 5 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, ticks: 60, zIndex: 99999 };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            // Clear any existing interval
            if (intervalRef.current) window.clearInterval(intervalRef.current);

            intervalRef.current = window.setInterval(() => {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    if (intervalRef.current) {
                        window.clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                    hideConfetti();
                    return;
                }

                const particleCount = 50 * (timeLeft / duration);

                // since particles fall down, start a bit higher than random
                confetti({
                    ...defaults,
                    colors: COLORS_PACK,
                    particleCount,
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                });
                confetti({
                    ...defaults,
                    colors: COLORS_PACK,
                    particleCount,
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                });
            }, 250);
        }

        return () => {
            if (intervalRef.current) {
                window.clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isConfettiVisible, hideConfetti, play]);

    return null; // canvas-confetti renders to its own canvas appended to body
}

export default ConfettiComponent;
