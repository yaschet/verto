/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import type { ApiErrorType } from '@/types/rest/errors';
import { ArrowsCounterClockwiseIcon, PlayIcon, TranslateIcon } from '@phosphor-icons/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { SectionTitle } from '@/src/app/(protected)/app/components/common';
import AssignToCustomerModal from '@/src/app/(protected)/app/translations/modals/assign-to-customer-modal';
import DeleteMultipleTranslationsModal from '@/src/app/(protected)/app/translations/modals/delete-multiple-translations-modal';
import DeleteTranslationModal from '@/src/app/(protected)/app/translations/modals/delete-translation-modal';
import RetranslateConfirmationModal from '@/src/app/(protected)/app/translations/modals/retranslate-confirmation-modal';
import RetryTranslationModal from '@/src/app/(protected)/app/translations/modals/retry-translation-modal';
import { regenerateDocument } from '@actions/services/translations/regenerate-document';
import { getSignedUrl } from '@/actions/storage/get-signed-url';
import { env } from '@/env';
import { toast } from 'sonner';
import { TRANSLATION_COLUMNS } from '@/src/app/(protected)/app/translations/table/translations-columns';
import TranslationsTable from '@/src/app/(protected)/app/translations/table/translations-table';
import { TranslationsBanner } from '@/src/components/translations-banner';
import useModal from '@/src/hooks/use-modal';
import { useRealtimeTranslations } from '@/src/hooks/use-realtime-translations';
import { cn } from '@/src/library/utils';
import { paginatedTranslationsQueryOptions } from '@/src/queries/tanstack/translations-query-options';
import { Button } from '@components/ui/button';
import { DefaultCard } from '@components/ui/card';
import { ScrollArea, ScrollBar } from '@components/ui/scroll-area';
import { useUserData } from '@hooks/queries/auth/use-user-data';
import { getQueryClient } from '@queries/tanstack/query-client';
import type { TranslationColumn, TranslationRow } from '@/src/schemas/translation-schemas';
import type { PaginatedResponse } from '@/types/rest/common';
import type { ApiResponseOrError } from '@/types/rest/response';

export default function TranslationsPageContent() {
    const searchParams = useSearchParams();
    const queryPageIndex: number = searchParams.get('page')
        ? parseInt(searchParams.get('page') as string)
        : 1;
    const queryPageSize: number = searchParams.get('limit')
        ? parseInt(searchParams.get('limit') as string)
        : 10;
    const queryPageFilter: string | null = searchParams.get('keyword')
        ? (searchParams.get('keyword') as string)
        : null;

    // Default sort: Created At (desc) - newest first
    const queryPageSortBy: TranslationColumn | null = searchParams.get('sortby')
        ? (searchParams.get('sortby') as TranslationColumn)
        : 'created_at';

    const queryPageCustomer: TranslationRow['customer_id'] | null = searchParams.get('customer')
        ? (searchParams.get('customer') as TranslationRow['customer_id'])
        : null;

    const queryPageSortDirection: 'asc' | 'desc' = searchParams.get('sortby')
        ? searchParams.get('direction') === 'desc'
            ? 'desc'
            : 'asc'
        : 'desc'; // Default to desc for created_at

    const { data: userData } = useUserData();
    const { user } = userData ?? {};
    const userId = user?.id ?? '';

    const { data, error, isError, isFetching, isLoading, isPending, isRefetching, isSuccess, refetch } =
        useQuery<
            ApiResponseOrError<PaginatedResponse<TranslationRow>>,
            ApiResponseOrError<PaginatedResponse<TranslationRow>>,
            PaginatedResponse<TranslationRow>
        >(
            paginatedTranslationsQueryOptions({
                userId,
                queryPageCustomer,
                queryPageFilter,
                queryPageIndex,
                queryPageSize,
                queryPageSortBy,
                queryPageSortDirection,
            }),
        );

    const queryClient = getQueryClient();

    // Banner state for new translations
    const [newTranslationsCount, setNewTranslationsCount] = useState(0);

    // Inactivity timer for smart auto-refresh
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastActivityRef = useRef<number>(Date.now());

    // Reset inactivity timer on user activity
    const resetInactivityTimer = useCallback(() => {
        lastActivityRef.current = Date.now();
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }
        // Auto-refresh after 30 seconds of inactivity
        inactivityTimerRef.current = setTimeout(() => {
            if (newTranslationsCount > 0) {
                console.log('Auto-refreshing after 30s of inactivity');
                refetch();
                setNewTranslationsCount(0);
            }
        }, 30000);
    }, [newTranslationsCount, refetch]);

    // Track user activity (mouse, keyboard, scroll)
    useEffect(() => {
        const handleActivity = () => resetInactivityTimer();
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('scroll', handleActivity);
        window.addEventListener('click', handleActivity);

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('scroll', handleActivity);
            window.removeEventListener('click', handleActivity);
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
            }
        };
    }, [resetInactivityTimer]);

    // Real-time event handlers
    const handleInsert = useCallback(
        (translation: TranslationRow) => {
            console.log('New translation created:', translation.id);
            // Increment banner counter instead of auto-reloading
            setNewTranslationsCount((prev) => prev + 1);
            resetInactivityTimer();
        },
        [resetInactivityTimer],
    );

    const handleUpdate = useCallback(
        (translation: TranslationRow) => {
            console.log('Translation status updated:', translation.id, translation.status);

            // Optimistically update cache in-place (no re-sort, no refetch)
            queryClient.setQueryData(
                paginatedTranslationsQueryOptions({
                    userId,
                    queryPageCustomer,
                    queryPageFilter,
                    queryPageIndex,
                    queryPageSize,
                    queryPageSortBy,
                    queryPageSortDirection,
                }).queryKey,
                (oldData) => {
                    if (!oldData || !Array.isArray(oldData.data?.results)) {
                        return oldData;
                    }

                    const updatedResults = oldData.data.results.map((row) =>
                        row.id === translation.id ? { ...row, ...translation } : row,
                    );

                    return {
                        ...oldData,
                        data: {
                            ...oldData.data,
                            results: updatedResults,
                        },
                    };
                },
            );
        },
        [
            queryClient,
            userId,
            queryPageCustomer,
            queryPageFilter,
            queryPageIndex,
            queryPageSize,
            queryPageSortBy,
            queryPageSortDirection,
        ],
    );

    const handleDelete = useCallback(
        (translationId: string) => {
            console.log('Translation deleted:', translationId);
            // Refetch to remove deleted item
            refetch();
        },
        [refetch],
    );

    useRealtimeTranslations({
        onInsert: handleInsert,
        onUpdate: handleUpdate,
        onDelete: handleDelete,
        userId: userId,
    });

    // Refetch on URL params change (pagination, sorting, filtering)
    useEffect(() => {
        refetch().then((r) => r);
        setNewTranslationsCount(0); // Reset banner when user navigates
    }, [refetch, searchParams]);

    // Manual refresh handler
    const handleManualRefresh = useCallback(() => {
        refetch();
        setNewTranslationsCount(0);
        resetInactivityTimer();
    }, [refetch, resetInactivityTimer]);

    const {
        isModalOpen: isDeletionModalOpen,
        openModal: triggerTranslationDeletion,
        selectedItem: selectedTranslationForDeletion,
        setIsModalOpen: setIsDeletionModalOpen,
        setSelectedItem: setSelectedTranslationForDeletion,
    } = useModal<TranslationRow>();

    const {
        isModalOpen: isMultipleDeletionModalOpen,
        openModal: triggerMultipleTranslationsDeletion,
        selectedItem: selectedTranslationsForDeletion,
        setIsModalOpen: setIsMultipleDeletionModalOpen,
        setSelectedItem: setSelectedTranslationsForDeletion,
    } = useModal<TranslationRow[]>();

    const {
        isModalOpen: isAssignmentModalOpen,
        openModal: triggerAssignmentToCustomer,
        selectedItem: selectedTranslationForAssignment,
        setIsModalOpen: setIsAssignmentModalOpen,
        setSelectedItem: setSelectedTranslationForAssignment,
    } = useModal<TranslationRow>();

    const { openModal: triggerTranslationCancellation } = useModal<TranslationRow>();

    const {
        isModalOpen: isRetranslateModalOpen,
        openModal: triggerRetranslate,
        selectedItem: selectedTranslationForRetranslate,
        setIsModalOpen: setIsRetranslateModalOpen,
    } = useModal<TranslationRow>();

    const {
        isModalOpen: isRetryModalOpen,
        openModal: triggerTranslationRetry,
        selectedItem: selectedTranslationForRetry,
        setIsModalOpen: setIsRetryModalOpen,
        setSelectedItem: setSelectedTranslationForRetry,
    } = useModal<TranslationRow>();

    // Regeneration Mutation
    const { mutate: triggerRegeneration } = useMutation({
        mutationFn: async (translation: TranslationRow) => {
            const response = await regenerateDocument({ translationId: translation.id! });
            if (!response || response.error) throw response;
            return response;
        },
        onMutate: () => {
            toast.loading('Regenerating document', {
                id: 'regenerate-document',
                description: 'Applying edits...',
            });
        },
        onSuccess: (response) => {
            toast.success('Regeneration started', {
                id: 'regenerate-document',
                description: response.description ?? 'Your document is being regenerated.',
            });
            refetch();
        },
        onError: (error: Error & Partial<ApiErrorType>) => {
            toast.error(error.title ?? 'Regeneration failed', {
                id: 'regenerate-document',
                description: error.description ?? 'Something went wrong.',
            });
        },
    });

    // Download Original Link Mutation (same logic as useDownloadOriginal but inline for table)
    const { mutate: triggerDownloadOriginal } = useMutation({
        mutationFn: async (translation: TranslationRow) => {
            const bucketName = env.NEXT_PUBLIC_FILE_UPLOAD_BUCKET;
            const response = await getSignedUrl({
                bucket: bucketName,
                fileName: translation.file_url,
            });

            if (response?.error || !response?.data?.signedUrl) {
                throw response?.error || new Error('Download failed');
            }

            if (typeof window !== 'undefined') {
                window.open(response.data.signedUrl, '_blank');
            }
        },
        onError: (error: Error & Partial<ApiErrorType>) => {
            toast.error(error.title ?? 'Download failed', {
                description: error.description ?? 'Could not generate download link.',
            });
        },
    });

    return (
        <Fragment>
            {/* Section for Recent Translations, displaying a data table with a limit of 5 rows. */}
            <div className="flex w-full max-w-full flex-col items-start justify-start gap-3">
                {/* Title of the Section */}
                <SectionTitle icon={TranslateIcon} title="Translations">
                    <Button
                        className="flex items-center justify-center"
                        color="primary"
                        disabled={isLoading || isFetching || isRefetching || isPending}
                        loading={isLoading || isFetching || isRefetching || isPending}
                        size="md"
                        variant="soft"
                        onClick={handleManualRefresh}
                    >
                        {!isLoading && !isFetching && !isRefetching && !isPending && (
                            <Fragment>
                                <ArrowsCounterClockwiseIcon
                                    className={cn('size-5')}
                                    color="currentColor"
                                    weight="duotone"
                                />
                                <span className="hidden font-bold md:block">Refresh</span>
                            </Fragment>
                        )}
                        {(isLoading || isFetching || isRefetching || isPending) && (
                            <span className="hidden font-bold md:block">Refreshing</span>
                        )}
                    </Button>
                    <Button
                        asChild
                        className="flex items-center justify-center"
                        color="primary"
                        size="md"
                        variant="solid"
                    >
                        <Link href="/app/translations/new">
                            <PlayIcon className="size-5" color="currentColor" weight="duotone" />
                            <span className="hidden font-bold md:block">Start Translation</span>
                        </Link>
                    </Button>
                </SectionTitle>

                {/* New Translations Banner */}
                {newTranslationsCount > 0 && (
                    <TranslationsBanner
                        count={newTranslationsCount}
                        onDismiss={() => setNewTranslationsCount(0)}
                        onRefresh={handleManualRefresh}
                    />
                )}

                {/* Cards */}
                <div className="relative flex h-auto w-full max-w-full flex-row items-center justify-start gap-4">
                    <DefaultCard>
                        <ScrollArea className="flex w-full flex-col gap-2">
                            <TranslationsTable
                                columns={TRANSLATION_COLUMNS}
                                data={data}
                                error={error}
                                isError={isError}
                                isLoading={isLoading}
                                isSuccess={isSuccess}
                                refetch={refetch}
                                triggerAssignmentToCustomer={triggerAssignmentToCustomer}
                                triggerMultipleTranslationsDeletion={triggerMultipleTranslationsDeletion}
                                triggerTranslationCancellation={triggerTranslationCancellation}
                                triggerTranslationDeletion={triggerTranslationDeletion}
                                triggerTranslationRetry={triggerTranslationRetry}
                                triggerRegeneration={triggerRegeneration}
                                triggerRetranslate={triggerRetranslate}
                                triggerDownloadOriginal={triggerDownloadOriginal}
                            />
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </DefaultCard>
                    <DeleteTranslationModal
                        isDeletionModalOpen={isDeletionModalOpen}
                        selectedTranslation={selectedTranslationForDeletion}
                        setIsDeletionModalOpen={setIsDeletionModalOpen}
                        setSelectedTranslation={setSelectedTranslationForDeletion}
                    />
                    <DeleteMultipleTranslationsModal
                        isMultipleDeletionModalOpen={isMultipleDeletionModalOpen}
                        selectedTranslations={selectedTranslationsForDeletion ?? []}
                        setIsMultipleDeletionModalOpen={setIsMultipleDeletionModalOpen}
                        setSelectedTranslations={setSelectedTranslationsForDeletion}
                    />
                    <AssignToCustomerModal
                        isAssignmentModalOpen={isAssignmentModalOpen}
                        selectedTranslation={selectedTranslationForAssignment}
                        setIsAssignmentModalOpen={setIsAssignmentModalOpen}
                        setSelectedTranslation={setSelectedTranslationForAssignment}
                    />
                    <RetryTranslationModal
                        isRetryModalOpen={isRetryModalOpen}
                        selectedTranslation={selectedTranslationForRetry}
                        setIsRetryModalOpen={setIsRetryModalOpen}
                        setSelectedTranslation={setSelectedTranslationForRetry}
                    />
                    <RetranslateConfirmationModal
                        isOpen={isRetranslateModalOpen}
                        selectedTranslation={selectedTranslationForRetranslate}
                        setIsOpen={setIsRetranslateModalOpen}
                    />
                </div>
            </div>
        </Fragment>
    );
}
