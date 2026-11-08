/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import React, { Fragment, useState } from 'react';
import { titleCase } from 'title-case';
import { DefaultCard } from '@/src/components/ui/card';
import type { Icon } from '@phosphor-icons/react';

export type TemplateCardType = {
    index: number;
    id: string;
    icon: Icon;
    name: string;
    label: string;
    description: string;
    tags?: string[];
    content_type?: string[];
};

export function TemplateCard({
    content_type,
    description,
    icon,
    id,
    index,
    label,
    name,
    tags,
}: React.PropsWithChildren<TemplateCardType & { index: number }>) {
    const IconComponent: Icon = icon;
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <Link
            className="group relative flex flex-col items-center justify-start p-2"
            href={`/app/translations/new?template=${id}`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
        >
            <AnimatePresence>
                {hoveredIndex === index && (
                    <motion.span
                        animate={{
                            opacity: 1,
                            transition: { duration: 0.15 },
                        }}
                        className="bg-primary/10 absolute inset-0 block size-full rounded-3xl backdrop-blur-3xl"
                        exit={{
                            opacity: 0,
                            transition: { delay: 0.2, duration: 0.15 },
                        }}
                        initial={{ opacity: 0 }}
                        layoutId="hoverBackground"
                    />
                )}
            </AnimatePresence>
            <DefaultCard className="group-hover bg-surface-0 group-hover:bg-primary-surface dark:group-hover:bg-primary-surface relative z-20 flex size-full max-w-full cursor-pointer flex-col items-center justify-start gap-3 overflow-hidden rounded-3xl p-0 select-none group-hover:border-transparent md:p-0 dark:group-hover:border-transparent">
                <div className="relative flex h-auto w-full max-w-full flex-col items-start justify-start gap-3 px-7 pt-7 lg:flex-row">
                    <div className="bg-primary-surface text-primary-foreground group-hover:bg-primary-foreground group-hover:text-primary-surface dark:bg-surface-50 dark:text-surface-950 group-hover:dark:bg-primary-foreground group-hover:dark:text-primary-surface relative flex aspect-square h-12 w-auto flex-row items-center justify-center rounded-xl">
                        <IconComponent className="size-5" color="currentColor" weight="duotone" />
                    </div>
                    <div className="relative my-auto flex h-auto w-full max-w-full flex-col items-start justify-center gap-0">
                        <h1 className="text-foreground group-hover:text-primary-foreground dark:text-surface-400 text-xl font-extrabold lining-nums">
                            {name}
                        </h1>
                        <p className="font-base text-surface-500 group-hover:text-primary-foreground-2 dark:text-surface-400 text-sm">
                            {label}
                        </p>
                    </div>
                </div>

                <div className="relative flex h-auto w-full max-w-full flex-col items-start justify-start gap-0 px-7 pb-7">
                    <p className="font-base text-surface-500 group-hover:text-primary-foreground-2 dark:text-surface-400 w-full text-sm">
                        {description}
                    </p>

                    {tags && tags?.length > 0 && (
                        <p>
                            <span className="text-surface-500 group-hover:text-primary-foreground-2 dark:text-surface-400 text-xs font-bold">
                                Tags:
                            </span>{' '}
                            {tags?.map((tag, idx) => (
                                <Fragment key={idx}>
                                    <span className="text-surface-500 group-hover:text-primary-foreground-2 dark:text-surface-400 text-xs font-normal">
                                        {titleCase(tag).trim()}
                                    </span>
                                    {idx < tags.length - 1 ? ', ' : ''}
                                </Fragment>
                            ))}
                        </p>
                    )}

                    {content_type && content_type?.length > 0 && (
                        <p>
                            <span className="text-surface-500 group-hover:text-primary-foreground-2 dark:text-surface-400 text-xs font-bold">
                                Content Type:
                            </span>{' '}
                            {content_type?.map((type, idx) => (
                                <Fragment key={idx}>
                                    <span className="text-surface-500 group-hover:text-primary-foreground-2 dark:text-surface-400 text-xs font-normal">
                                        {titleCase(type)}
                                    </span>
                                    {idx < content_type.length - 1 ? ', ' : ''}
                                </Fragment>
                            ))}
                        </p>
                    )}
                </div>
            </DefaultCard>
        </Link>
    );
}
