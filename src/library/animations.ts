/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * Animation configurations for Linear-style motion design
 *
 * Uses Framer Motion spring physics for natural, premium feel.
 * All configs tested for 60fps performance on modern devices.
 */

import type { Transition, Variants } from 'framer-motion';

export const springConfig = {
    /**
     * Sidebar collapse/expand animation
     * Balanced spring with natural bounce
     */
    sidebar: {
        type: 'spring' as const,
        stiffness: 260,
        damping: 26,
        mass: 1,
    },

    /**
     * Tap/press interactions
     * Snappy response for immediate feedback
     */
    tap: {
        type: 'spring' as const,
        stiffness: 400,
        damping: 30,
        mass: 0.8,
    },

    /**
     * Smooth transitions for cards, panels
     * Softer spring for larger elements
     */
    smooth: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 28,
        mass: 1,
    },

    /**
     * Fast micro-interactions
     * Quick hover states and small UI elements
     */
    fast: {
        type: 'spring' as const,
        stiffness: 500,
        damping: 35,
        mass: 0.6,
    },
} satisfies Record<string, Transition>;

/**
 * Fade in/out variants with vertical slide
 * Used for labels, tooltips, popovers
 */
export const fadeInOut: Variants = {
    initial: {
        opacity: 0,
        y: -4,
    },
    animate: {
        opacity: 1,
        y: 0,
    },
    exit: {
        opacity: 0,
        y: 4,
    },
};

/**
 * Scale + fade for modal/dialog entrances
 */
export const scaleInOut: Variants = {
    initial: {
        opacity: 0,
        scale: 0.96,
    },
    animate: {
        opacity: 1,
        scale: 1,
    },
    exit: {
        opacity: 0,
        scale: 0.96,
    },
};

/**
 * Sidebar label animation
 * Fades in/out with slight delay for collapse/expand
 */
export const sidebarLabelVariants: Variants = {
    collapsed: {
        opacity: 0,
        width: 0,
        transition: {
            opacity: { duration: 0.1, delay: 0 },
            width: { ...springConfig.sidebar, delay: 0 },
        },
    },
    expanded: {
        opacity: 1,
        width: 'auto',
        transition: {
            opacity: { duration: 0.2, delay: 0.15 },
            width: { ...springConfig.sidebar, delay: 0 },
        },
    },
};

/**
 * Stagger children animation
 * For nav items appearing one by one
 */
export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1,
        },
    },
};

export const staggerItem: Variants = {
    hidden: { opacity: 0, x: -8 },
    show: {
        opacity: 1,
        x: 0,
        transition: springConfig.fast,
    },
};

/**
 * Tap animation helper
 * Returns appropriate scale values for press feedback
 */
export const tapAnimation = {
    whileTap: { scale: 0.98 },
    transition: springConfig.tap,
};

/**
 * Hover animation helper
 * Subtle scale for interactive elements
 */
export const hoverAnimation = {
    whileHover: { scale: 1.02 },
    transition: springConfig.fast,
};

/**
 * Shared layout animation for morphing elements
 * Used for active indicators that move between items
 */
export const sharedLayoutTransition: Transition = {
    type: 'spring',
    stiffness: 350,
    damping: 30,
    mass: 0.8,
};

/**
 * Check if user prefers reduced motion
 * Returns simplified transition if true
 */
export function getReducedMotionTransition(transition: Transition): Transition {
    if (typeof window !== 'undefined') {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            return { duration: 0.001 }; // Near-instant for reduced motion
        }
    }
    return transition;
}

/**
 * Helper to get spring config with reduced motion support
 */
export function getSpringConfig(config: Transition): Transition {
    return getReducedMotionTransition(config);
}
