/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { ArrowsInIcon, ArrowsOutIcon } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Fragment } from 'react';
import type { ReactNode } from 'react';

type DisclosurePanelProps = {
    title: ReactNode;
    extraTitleContent?: ReactNode;
    children: ReactNode;
};

function AnimatedDisclosure({ children, extraTitleContent, title }: DisclosurePanelProps) {
    return (
        <Disclosure
            as="div"
            className="border-border bg-surface-2 dark:bg-surface-2 block w-full items-stretch overflow-hidden rounded-xl border p-4"
        >
            {({ open: isDisclosureOpen }) => (
                <Fragment>
                    <div className="my-auto flex w-full flex-col items-start justify-start">
                        <DisclosureButton className="flex w-full flex-row items-center justify-between">
                            <div
                                aria-hidden="true"
                                className="text-foreground flex flex-row items-center justify-start gap-2 text-start text-sm"
                            >
                                {title}
                            </div>
                            <span className="text-foreground flex cursor-pointer flex-row items-center justify-start gap-2">
                                {extraTitleContent}
                                {isDisclosureOpen ? (
                                    <ArrowsInIcon className="size-4" color="currentColor" weight="duotone" />
                                ) : (
                                    <ArrowsOutIcon className="size-4" color="currentColor" weight="duotone" />
                                )}
                            </span>
                        </DisclosureButton>
                    </div>
                    <AnimatePresence>
                        {isDisclosureOpen && (
                            <DisclosurePanel
                                static
                                animate={{ height: 'auto', opacity: 1, y: 0 }}
                                as={motion.div}
                                className="origin-top"
                                exit={{ height: 0, opacity: 0, y: -0 }}
                                initial={{ height: 0, opacity: 0, y: -0 }}
                                transition={motionTransition}
                            >
                                <div className="flex w-full flex-col items-start justify-start gap-2 pt-5">
                                    <div className="flex w-full flex-col items-start justify-start gap-2">
                                        {children}
                                    </div>
                                </div>
                            </DisclosurePanel>
                        )}
                    </AnimatePresence>
                </Fragment>
            )}
        </Disclosure>
    );
}

// Headless UI forwards this prop to the motion element; its boolean type overlaps Motion's object type.
const motionTransition = { duration: 0.2, ease: 'easeOut' } as unknown as boolean;

export default AnimatedDisclosure;
