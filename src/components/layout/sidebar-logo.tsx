/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { PrivacyBlurWrapper } from '@/components/layout/privacy-blur-wrapper';
import { getSpringConfig, springConfig } from '@library/animations';
import { cn } from '@library/utils';
import { Logo } from '@components/ui/logo';

type SidebarLogoProps = {
    isCollapsed: boolean;
    className?: string;
};

export function SidebarLogo({ className, isCollapsed }: SidebarLogoProps) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="h-8 w-full shrink-0" />;
    }

    const isDark = resolvedTheme === 'dark';
    const logoMode = isDark ? 'dark' : 'light';

    return (
        <motion.div
            animate={{
                justifyContent: isCollapsed ? 'center' : 'flex-start',
            }}
            className={cn('flex h-10 w-full shrink-0 items-center justify-center overflow-hidden', className)}
            transition={getSpringConfig(springConfig.sidebar)}
        >
            <AnimatePresence mode="wait">
                {isCollapsed ? (
                    <motion.div
                        key="icon"
                        animate={{ opacity: 1 }}
                        className="flex shrink-0 items-center justify-center"
                        exit={{ opacity: 0 }}
                        initial={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <PrivacyBlurWrapper>
                            <Logo variant="icon" mode={logoMode} priority size="md" />
                        </PrivacyBlurWrapper>
                    </motion.div>
                ) : (
                    <motion.div
                        key="wide"
                        animate={{ opacity: 1 }}
                        className="flex w-full shrink-0 items-center justify-start px-1"
                        exit={{ opacity: 0 }}
                        initial={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <PrivacyBlurWrapper>
                            <Logo variant="full" mode={logoMode} priority size="md" />
                        </PrivacyBlurWrapper>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
