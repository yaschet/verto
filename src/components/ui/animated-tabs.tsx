/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { cn } from '@/src/library/utils';

type TabsContextType = {
    activeTab: string;
    setActiveTab: (value: string) => void;
    wantsAnimation: boolean;
};

const TabsContext = createContext<TabsContextType | undefined>(undefined);

const useTabs = () => {
    const context = useContext(TabsContext);
    if (!context) {
        throw new Error('Tabs components must be used within a Tabs provider');
    }
    return context;
};

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
}

export function Tabs({ defaultValue, value, onValueChange, className, children, ...props }: TabsProps) {
    const [internalValue, setInternalValue] = useState(defaultValue || '');
    const isControlled = value !== undefined;
    const activeTab = isControlled ? value : internalValue;

    // We only want animation after the initial render to avoid layout shifts/flashes
    const [wantsAnimation, setWantsAnimation] = useState(false);

    useEffect(() => {
        setWantsAnimation(true);
    }, []);

    const setActiveTab = (newValue: string) => {
        if (!isControlled) {
            setInternalValue(newValue);
        }
        onValueChange?.(newValue);
    };

    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab, wantsAnimation }}>
            <div className={cn('flex w-full flex-col', className)} {...props}>
                {children}
            </div>
        </TabsContext.Provider>
    );
}

export function TabsList({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'bg-surface-200/80 dark:bg-surface-800/50 inline-flex h-12 items-center justify-start rounded-2xl p-1 backdrop-blur-sm',
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    value: string;
}

export function TabsTrigger({ value, className, children, ...props }: TabsTriggerProps) {
    const { activeTab, setActiveTab } = useTabs();
    const isActive = activeTab === value;

    return (
        <button
            className={cn(
                'group relative flex h-full items-center justify-center rounded-xl px-6 py-2 text-sm font-bold transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                isActive
                    ? 'text-primary-foreground'
                    : 'text-surface-500 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-100',
                className,
            )}
            onClick={() => setActiveTab(value)}
            {...props}
        >
            {isActive && (
                <motion.div
                    className="bg-primary absolute inset-0 -z-10 rounded-xl shadow-sm"
                    layoutId="active-tab-indicator"
                    transition={{
                        type: 'spring',
                        bounce: 0.2,
                        duration: 0.6,
                    }}
                />
            )}
            <span className="relative z-10">{children}</span>
        </button>
    );
}

export function TabsContent({
    value,
    className,
    children,
    ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
    const { activeTab, wantsAnimation } = useTabs();
    const isActive = activeTab === value;

    return (
        <AnimatePresence mode="wait">
            {isActive && (
                <motion.div
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={cn(
                        'mt-2 w-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                        className,
                    )}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    initial={wantsAnimation ? { opacity: 0, y: 10, scale: 0.98 } : false}
                    transition={{
                        duration: 0.3,
                        ease: 'easeOut',
                    }}
                    {...(props as Omit<React.ComponentProps<typeof motion.div>, 'ref'>)}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
