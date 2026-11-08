/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import {
    FileTextIcon,
    FilesIcon,
    FolderOpenIcon,
    HeadCircuitIcon,
    MagicWandIcon,
    SparkleIcon,
} from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { SectionTitle } from '@/src/app/(protected)/app/components/common';
import { TemplateCard } from '@app/(protected)/app/templates/components/core/template-card';
import { TemplatesEmpty } from '@app/(protected)/app/templates/components/states/empty-state';
import { TemplatesError } from '@app/(protected)/app/templates/components/states/error-state';
import LoadingTemplates from '@app/(protected)/app/templates/loading';
import { Button } from '@components/ui/button';
import { templatesQueryOptions } from '@queries/tanstack/templates-query-options';
import type { Tables } from '@/types/database/database';

export default function TemplatesDisplay() {
    const { data, error, isError, isLoading, refetch } = useQuery(templatesQueryOptions());

    if (isLoading) {
        return <LoadingTemplates />;
    }

    if (isError) {
        return <TemplatesError error={error} isLoading={isLoading} refetch={refetch} />;
    }

    if (data?.templates.length === 0) {
        return <TemplatesEmpty isLoading={isLoading} />;
    }

    return (
        <div className="flex w-full flex-col items-start justify-start gap-6">
            <SectionTitle icon={FolderOpenIcon} title="Templates" />

            <div className="relative flex h-auto w-full max-w-full flex-col items-center justify-start gap-4">
                {/* Reorder collections to make "Dynamic" collection first */}
                {data?.templates_collections
                    .sort((a, b) => {
                        if (a.name === 'Dynamic') return -1;
                        if (b.name === 'Dynamic') return 1;
                        return 0;
                    })
                    .map((collection: Tables<'templates_collections'>, idx: number) => {
                        return (
                            <div
                                key={idx}
                                className="mt-3 flex w-full max-w-full flex-col items-start justify-start gap-3"
                            >
                                <div className="flex flex-row items-center justify-start gap-3">
                                    <FilesIcon
                                        className="text-surface-600 dark:text-surface-400 size-6"
                                        color="currentColor"
                                        weight="duotone"
                                    />
                                    <h1 className="text-foreground dark:text-surface-400 text-lg font-extrabold">
                                        {collection.name}
                                    </h1>
                                </div>
                                <div className="relative flex h-auto w-full max-w-full flex-col items-start justify-start gap-3">
                                    <p className="text-surface-600 dark:text-surface-400 text-sm font-normal">
                                        {collection.description}
                                    </p>
                                </div>
                                <div className="-mx-2 grid w-full grid-flow-row-dense auto-rows-fr grid-cols-1 py-0 sm:grid-cols-2 2xl:grid-cols-3">
                                    {data?.templates.map((template: Tables<'templates'>, index: number) => {
                                        if (template.collection_id === collection.id) {
                                            if (template.slug === 'omni-document-recognition') {
                                                return (
                                                    <div
                                                        key={template.id}
                                                        className="relative col-span-full flex w-full max-w-full flex-col items-start justify-start gap-3"
                                                    >
                                                        <div className="to-primary-50 dark:from-primary-950 dark:to-primary-950/80 border-border relative mr-auto ml-0 flex h-auto w-full flex-col items-start justify-start gap-3 overflow-hidden rounded-3xl border bg-linear-to-br from-white px-7 py-14 dark:bg-linear-to-br">
                                                            <div className="absolute inset-0 flex size-full flex-row items-center justify-center">
                                                                <div className="absolute inset-0 flex size-full flex-row items-center justify-center">
                                                                    <div className="from-primary-surface/90 to-primary-surface/90 absolute -right-10 -bottom-5 z-1 aspect-square h-auto w-1/5 max-w-60 min-w-32 -rotate-45 rounded-3xl bg-linear-to-br backdrop-blur-sm" />
                                                                    <div className="from-accent-500 to-accent-400 absolute -right-10 -bottom-5 z-2 aspect-square h-auto w-1/5 max-w-60 min-w-32 rotate-[-30deg] rounded-3xl bg-linear-to-br" />
                                                                </div>
                                                            </div>
                                                            <div className="relative z-20 flex h-auto w-full max-w-sm flex-col items-start justify-start gap-3">
                                                                <p className="text-primary-400 dark:text-primary-200 flex flex-row items-center justify-start gap-1 text-xs font-bold">
                                                                    <SparkleIcon
                                                                        className="size-4"
                                                                        color="currentColor"
                                                                        weight="duotone"
                                                                    />
                                                                    <strong>Recommended</strong>
                                                                </p>
                                                                <div className="text-primary-surface dark:text-primary-surface flex flex-row items-center justify-start gap-3">
                                                                    <HeadCircuitIcon
                                                                        className="size-6"
                                                                        color="currentColor"
                                                                        weight="duotone"
                                                                    />
                                                                    <h1 className="text-lg font-extrabold">
                                                                        {template.name}
                                                                    </h1>
                                                                </div>
                                                                <p className="text-surface-700 dark:text-surface-300 text-sm font-normal">
                                                                    {template.description}
                                                                </p>
                                                                <Button
                                                                    asChild
                                                                    className="mt-4 w-fit"
                                                                    color="primary"
                                                                    size="lg"
                                                                    type="button"
                                                                    variant="solid"
                                                                >
                                                                    <Link
                                                                        className="flex flex-row items-center justify-start gap-2"
                                                                        href="/app/translations/new"
                                                                    >
                                                                        <MagicWandIcon
                                                                            className="size-5"
                                                                            color="currentColor"
                                                                            weight="duotone"
                                                                        />
                                                                        <span>Translate Document</span>
                                                                    </Link>
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <TemplateCard
                                                    key={template.id}
                                                    content_type={template.content_type ?? []}
                                                    description={template.description ?? ''}
                                                    icon={FileTextIcon}
                                                    id={template.id}
                                                    index={idx + index}
                                                    label={template.label ?? ''}
                                                    name={template.name}
                                                    tags={template.tags ?? []}
                                                />
                                            );
                                        }
                                        return null;
                                    })}
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}
