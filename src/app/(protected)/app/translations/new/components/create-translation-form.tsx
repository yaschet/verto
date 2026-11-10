/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useZodResolver } from '@hooks/use-zod-resolver';
import {
    ArrowCounterClockwiseIcon,
    ArrowUUpLeftIcon,
    CaretUpDownIcon,
    CheckIcon,
    GlobeIcon,
    GlobeSimpleXIcon,
    PlayIcon,
    SelectionSlashIcon,
    ShieldCheckIcon,
    TranslateIcon,
    UserCircleMinusIcon,
    WarningIcon,
} from '@phosphor-icons/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next-nprogress-bar';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import {
    AUTO_DETECT_LANGUAGE,
    AVAILABLE_SOURCE_LANGUAGES_WITH_AUTO,
    AVAILABLE_TARGET_LANGUAGES,
    BCP_47_SUPPORTED_LANGUAGE,
    DEFAULT_SOURCE_LANGUAGE,
    DEFAULT_TARGET_LANGUAGE,
} from '@/constants/translations';
import { env } from '@/env';
import { createTranslation } from '@actions/services/translations/create-translation';
import Alert, { AlertDescription, AlertIcon, AlertTitle } from '@components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import { Button } from '@components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@components/ui/command';
import { FileDropzone } from '@components/ui/file-dropzone';
import { FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@components/ui/popover';
import Spinner from '@components/ui/spinner';
import useSession from '@hooks/queries/auth/use-session';
import { useUserData } from '@hooks/queries/auth/use-user-data';
import { getLanguageDetails } from '@/components/shared/flag-component';
import { cn, generateGravatarUrl } from '@library/utils';
import { templatesQueryOptions } from '@queries/tanstack/templates-query-options';
import { assignableCustomersQueryOptions } from '@queries/tanstack/translations-query-options';
import { CreateTranslationSchema } from '@schemas/translation-schemas';
import { createBrowserClient } from '@utils/supabase/client';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { RawCustomerRow } from '@schemas/customer-schemas';
import type { z } from 'zod';

// Exported for use in other components if needed
export const AppTranslateIcon = TranslateIcon;

const allowedMimeTypes: string[] = env.NEXT_PUBLIC_FILE_UPLOAD_BUCKET_ALLOWED_MIME_TYPES.split(',').map(
    (type: string) => type.trim(),
);

export default function CreateTranslationForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const session = useSession();

    const { data: userData } = useUserData();
    const { profile, user } = userData ?? {};
    const userId = user?.id ?? '';

    // Get user's saved language preferences from profile
    const userSourceLanguage = profile?.source_language ?? DEFAULT_SOURCE_LANGUAGE;
    const userTargetLanguage = profile?.target_language ?? DEFAULT_TARGET_LANGUAGE;

    const [omniTemplateId, setOmniTemplateId] = useState<string | undefined>(undefined);

    const [errorAlert, setErrorAlert] = useState<{
        error: boolean;
        title?: string;
        message: string;
        description: string;
        isInsufficientCredits?: boolean;
    } | null>();

    const [successAlert, setSuccessAlert] = useState<{
        success: boolean;
        title?: string;
        message: string;
        description: string;
    } | null>();

    // * - Translation Form Schema:
    const zodSchema = CreateTranslationSchema;

    const {
        data: CustomersList,
        error: customersListError,
        isError: isCustomersListError,
        isLoading: isCustomersListLoading,
        isSuccess: isCustomersListSuccess,
        refetch: refetchCustomersList,
    } = useQuery<
        ApiResponseOrError<
            {
                id: RawCustomerRow['id'];
                display_name: RawCustomerRow['display_name'];
                email: RawCustomerRow['email'];
            }[]
        >,
        ApiErrorType,
        {
            id: RawCustomerRow['id'];
            display_name: RawCustomerRow['display_name'];
            email: RawCustomerRow['email'];
        }[]
    >(assignableCustomersQueryOptions(userId));

    const {
        data: TemplatesList,
        error: templatesListError,
        isError: isTemplatesListError,
        isLoading: isTemplatesListLoading,
        isSuccess: isTemplatesListSuccess,
        refetch: refetchTemplates,
    } = useQuery(templatesQueryOptions());

    const formMethods = useForm<z.infer<typeof zodSchema>>({
        defaultValues: {
            displayName: undefined,
            description: undefined,
            customerId: searchParams?.get('customer') ?? undefined,
            templateId: searchParams?.get('template') ?? (omniTemplateId ? omniTemplateId : undefined),
            // Use profile preferences with fallbacks
            sourceLanguage: (userSourceLanguage as BCP_47_SUPPORTED_LANGUAGE) ?? DEFAULT_SOURCE_LANGUAGE,
            targetLanguage: (userTargetLanguage as BCP_47_SUPPORTED_LANGUAGE) ?? DEFAULT_TARGET_LANGUAGE,
            scannedDocumentFile: undefined,
        },
        mode: 'onTouched',
        resolver: useZodResolver(zodSchema),
    });

    // Update form values when profile data loads (handles async loading)
    useEffect(() => {
        if (profile) {
            const profileSourceLang = profile.source_language ?? DEFAULT_SOURCE_LANGUAGE;
            const profileTargetLang = profile.target_language ?? DEFAULT_TARGET_LANGUAGE;

            // Only update if different from current value and profile has the data
            if (profileSourceLang) {
                formMethods.setValue('sourceLanguage', profileSourceLang as BCP_47_SUPPORTED_LANGUAGE);
            }
            if (profileTargetLang) {
                formMethods.setValue('targetLanguage', profileTargetLang as BCP_47_SUPPORTED_LANGUAGE);
            }
        }
    }, [profile, formMethods]);

    useEffect(() => {
        if (TemplatesList?.templates) {
            const omniTemplate = TemplatesList.templates.find(
                (template) => template.slug === 'omni-document-recognition',
            );
            setOmniTemplateId(omniTemplate?.id);
        }
    }, [TemplatesList]);

    useEffect(() => {
        if (formMethods.watch('templateId') === undefined) {
            formMethods.setValue('templateId', omniTemplateId ?? undefined);
        }
    }, [formMethods, omniTemplateId]);

    const {
        control,
        formState: { errors, touchedFields },
        handleSubmit,
        setValue,
    } = formMethods;

    const { isPending, mutateAsync } = useMutation({
        mutationFn: async ({
            customerId,
            description,
            displayName,
            scannedDocumentFile,
            sourceLanguage,
            targetLanguage,
            templateId,
        }: z.infer<typeof zodSchema>) => {
            const translationData = {
                displayName,
                description,
                customerId,
                templateId,
                sourceLanguage,
                targetLanguage,
                scannedDocumentFile,
            };

            console.log(translationData);

            const response = await createTranslation({
                translationData,
            });

            if (response?.error || !response) {
                throw response;
            }

            return response;
        },
        onError: (error: (Error & Partial<ApiErrorType>) | ApiErrorType) => {
            setErrorAlert({
                description:
                    error?.description ?? 'An error occurred while trying to trigger the translation.',
                error: true,
                message: error?.title ?? error?.message ?? 'Failed to trigger translation.',
                title: error?.title ?? 'Failed to Trigger Translation',
                isInsufficientCredits: error?.status === 402, // Detect insufficient credits error
            });
        },
        onSuccess: async (response) => {
            setSuccessAlert({
                description: response?.description ?? 'The translation has been triggered successfully.',
                message: response?.message ?? 'The translation has been triggered successfully.',
                success: true,
                title: response?.title ?? 'Translation Triggered',
            });

            // Scroll to the top of the page:
            if (typeof window !== 'undefined' && window?.scrollTo) {
                window.scrollTo(0, 0);
            }

            // Redirect to the translations page:
            router.push('/app/translations');

            return response;
        },
        retry: 3,
        retryDelay: (attempt) => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
    });

    return (
        <FormProvider {...formMethods}>
            <form
                className="flex w-full flex-col items-center justify-center gap-5"
                onSubmit={handleSubmit(async (data) => {
                    return mutateAsync(data);
                })}
            >
                {/* ! - Alert Section: */}
                <Alert
                    withCloseButton
                    className="w-full"
                    show={errorAlert?.error === true}
                    variant="destructive"
                    onClose={() => {
                        setErrorAlert(null);
                    }}
                >
                    <AlertIcon>
                        <WarningIcon className="size-5" color="currentColor" weight="duotone" />
                    </AlertIcon>
                    <AlertTitle>{errorAlert?.message}</AlertTitle>
                    <AlertDescription>{errorAlert?.description}</AlertDescription>
                    {errorAlert?.isInsufficientCredits && (
                        <div className="mt-4">
                            <Button
                                type="button"
                                variant="solid"
                                onClick={() => router.push('/account/credits/top-up')}
                            >
                                Buy Credits
                            </Button>
                        </div>
                    )}
                </Alert>

                <Alert
                    withCloseButton
                    className="w-full"
                    show={successAlert?.success === true}
                    variant="success"
                    onClose={() => {
                        setSuccessAlert(null);
                    }}
                >
                    <AlertIcon>
                        <ShieldCheckIcon className="size-5" color="currentColor" weight="duotone" />
                    </AlertIcon>
                    <AlertTitle>{successAlert?.message}</AlertTitle>
                    <AlertDescription>{successAlert?.description}</AlertDescription>
                </Alert>

                <div className="flex w-full flex-col items-start justify-start gap-2">
                    {/* Form Fields */}
                    <div className="flex w-full flex-col items-start justify-start gap-2">
                        <FormField
                            control={control}
                            name="displayName"
                            render={({ field }) => {
                                return (
                                    <FormItem className="w-full">
                                        <FormLabel
                                            className="text-foreground text-sm font-medium"
                                            htmlFor="displayName"
                                        >
                                            Display Name
                                        </FormLabel>
                                        <div className="w-full">
                                            <Input
                                                autoComplete="off"
                                                autoFocus={true}
                                                hasError={
                                                    !!(
                                                        errors.displayName?.message &&
                                                        touchedFields.displayName
                                                    )
                                                }
                                                id="displayName"
                                                placeholder="Master Transcript - John Doe"
                                                type="text"
                                                {...field}
                                            />
                                        </div>
                                        <FormMessage />
                                        <FormDescription>
                                            Specify a display name for the translation (or leave blank for an
                                            AI-generated name).
                                        </FormDescription>
                                    </FormItem>
                                );
                            }}
                        />

                        <FormField
                            control={control}
                            name="description"
                            render={({ field }) => {
                                return (
                                    <FormItem className="w-full">
                                        <FormLabel
                                            className="text-foreground text-sm font-medium"
                                            htmlFor="description"
                                        >
                                            Description
                                        </FormLabel>
                                        <div className="w-full">
                                            <Input
                                                autoComplete="off"
                                                hasError={
                                                    !!(
                                                        errors.description?.message &&
                                                        touchedFields.description
                                                    )
                                                }
                                                id="description"
                                                placeholder="Master Transcript for Student 13569"
                                                type="text"
                                                {...field}
                                            />
                                        </div>
                                        <FormMessage />
                                        <FormDescription>
                                            Specify a description for the translation (or leave blank for an
                                            AI-generated description).
                                        </FormDescription>
                                    </FormItem>
                                );
                            }}
                        />
                        <FormField
                            control={control}
                            name="customerId"
                            render={({ field }) => (
                                <FormItem className="flex w-full flex-col gap-1 py-4">
                                    <FormLabel>Select Customer</FormLabel>
                                    {/* ! - Popover Section: */}
                                    {isCustomersListLoading && (
                                        <div className="flex w-full items-center justify-center gap-2">
                                            <Button
                                                disabled
                                                loading
                                                className="w-full items-center justify-center"
                                                color="default"
                                                role="combobox"
                                                size="lg"
                                                variant="soft"
                                            >
                                                Loading Customers
                                            </Button>
                                        </div>
                                    )}
                                    {isCustomersListError && (
                                        <div className="flex w-full items-center justify-center gap-2">
                                            <Button
                                                className="w-full items-center justify-center"
                                                color="destructive"
                                                role="combobox"
                                                size="lg"
                                                variant="solid"
                                                onClick={() => {
                                                    refetchCustomersList().then((r) => r);
                                                }}
                                            >
                                                <ArrowCounterClockwiseIcon
                                                    className="size-5"
                                                    color="currentColor"
                                                />
                                                {customersListError?.title ??
                                                    customersListError?.message ??
                                                    'Retry Loading Customers'}
                                            </Button>
                                        </div>
                                    )}
                                    {!isCustomersListLoading && isCustomersListSuccess && (
                                        <Popover>
                                            <div className="flex w-full flex-row items-center justify-between gap-2">
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        className="w-full items-center justify-between"
                                                        color={field.value ? 'default' : 'secondary'}
                                                        role="combobox"
                                                        size="lg"
                                                        variant="soft"
                                                    >
                                                        {field.value
                                                            ? (CustomersList?.find(
                                                                  (customer) => customer.id === field.value,
                                                              )?.display_name ?? 'Select a Customer')
                                                            : 'Select a Customer'}
                                                        <CaretUpDownIcon
                                                            className="ml-2 size-5 shrink-0 opacity-50"
                                                            color="currentColor"
                                                            weight="duotone"
                                                        />
                                                    </Button>
                                                </PopoverTrigger>
                                                {field.value && (
                                                    <div className="flex h-auto w-auto items-center justify-center gap-2">
                                                        <Avatar className="size-10">
                                                            <AvatarImage
                                                                alt={
                                                                    CustomersList?.find(
                                                                        (customer) =>
                                                                            customer.id === field.value,
                                                                    )?.display_name ?? 'No Customer'
                                                                }
                                                                src={
                                                                    generateGravatarUrl(
                                                                        CustomersList?.find(
                                                                            (customer) =>
                                                                                customer.id === field.value,
                                                                        )?.email ?? '',
                                                                    ) ?? ''
                                                                }
                                                            />
                                                            <AvatarFallback
                                                                name={
                                                                    CustomersList?.find(
                                                                        (customer) =>
                                                                            customer.id === field.value,
                                                                    )?.display_name
                                                                }
                                                            />
                                                        </Avatar>
                                                        <Button
                                                            color="default"
                                                            size="icon-lg"
                                                            tooltipContent="Unselect Customer"
                                                            variant="soft"
                                                            onClick={() => {
                                                                setValue('customerId', undefined);
                                                            }}
                                                        >
                                                            <UserCircleMinusIcon
                                                                className="size-5"
                                                                color="currentColor"
                                                                weight="duotone"
                                                            />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                            <PopoverContent align="start" className="w-full rounded-3xl p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search customers..." />
                                                    <CommandList>
                                                        <CommandEmpty>No customer found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {CustomersList?.map((customer) => (
                                                                <CommandItem
                                                                    key={customer.id}
                                                                    disabled={isPending}
                                                                    value={customer.display_name}
                                                                    onSelect={() => {
                                                                        setValue('customerId', customer.id);
                                                                    }}
                                                                >
                                                                    <div className="flex w-full flex-row items-center justify-between gap-2">
                                                                        <div className="flex h-full w-auto items-center gap-3">
                                                                            <div className="flex items-center justify-center">
                                                                                <Avatar className="size-10">
                                                                                    <AvatarImage
                                                                                        alt={
                                                                                            customer.display_name
                                                                                        }
                                                                                        src={generateGravatarUrl(
                                                                                            customer.email,
                                                                                        )}
                                                                                    />
                                                                                    <AvatarFallback
                                                                                        name={
                                                                                            customer.display_name
                                                                                        }
                                                                                    />
                                                                                </Avatar>{' '}
                                                                            </div>
                                                                            <div className="flex w-auto flex-col items-start justify-start gap-1">
                                                                                <span className="text-sm font-bold whitespace-nowrap text-current">
                                                                                    {customer.display_name}
                                                                                </span>
                                                                                <span className="text-surface-400 text-xs whitespace-nowrap">
                                                                                    {customer.email}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <CheckIcon
                                                                            className={cn(
                                                                                'text-current',
                                                                                'ml-2 size-5',
                                                                                field.value === customer.id
                                                                                    ? 'opacity-100'
                                                                                    : 'opacity-0',
                                                                            )}
                                                                            color="currentColor"
                                                                            weight="duotone"
                                                                        />
                                                                    </div>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                    <FormMessage />
                                    <FormDescription>
                                        Please select a customer to associate with the translation. This will
                                        assist in organizing translations by customer.
                                    </FormDescription>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={control}
                            name="templateId"
                            render={({ field }) => (
                                <FormItem className="flex w-full flex-col gap-1 py-4">
                                    <FormLabel>Select Template</FormLabel>
                                    {/* ! - Popover Section: */}
                                    {isTemplatesListLoading && (
                                        <div className="flex w-full items-center justify-center gap-2">
                                            <Button
                                                disabled
                                                loading
                                                className="w-full items-center justify-center"
                                                color="default"
                                                role="combobox"
                                                size="lg"
                                                variant="soft"
                                            >
                                                Loading Templates
                                            </Button>
                                        </div>
                                    )}
                                    {isTemplatesListError && (
                                        <div className="flex w-full items-center justify-center gap-2">
                                            <Button
                                                className="w-full items-center justify-center"
                                                color="destructive"
                                                role="combobox"
                                                size="lg"
                                                variant="solid"
                                                onClick={() => {
                                                    refetchTemplates().then((r) => r);
                                                }}
                                            >
                                                <ArrowCounterClockwiseIcon
                                                    className="size-5"
                                                    color="currentColor"
                                                />
                                                {templatesListError?.title ??
                                                    templatesListError?.message ??
                                                    'Retry Loading Templates'}
                                            </Button>
                                        </div>
                                    )}
                                    {!isTemplatesListError && isTemplatesListSuccess && (
                                        <Popover>
                                            <div className="flex w-full flex-row items-center justify-between gap-2">
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        className="w-full items-center justify-between"
                                                        color={field.value ? 'default' : 'secondary'}
                                                        role="combobox"
                                                        size="lg"
                                                        variant="soft"
                                                    >
                                                        {field.value ? (
                                                            <span>
                                                                {
                                                                    TemplatesList?.templates.find(
                                                                        (template) =>
                                                                            template.id === field.value,
                                                                    )?.name
                                                                }
                                                                {field.value === omniTemplateId && (
                                                                    <i className="text-muted text-xs">
                                                                        {' '}
                                                                        (default)
                                                                    </i>
                                                                )}
                                                            </span>
                                                        ) : (
                                                            'Select a Template'
                                                        )}
                                                        <CaretUpDownIcon
                                                            className="ml-2 size-5 shrink-0 opacity-50"
                                                            color="currentColor"
                                                            weight="duotone"
                                                        />
                                                    </Button>
                                                </PopoverTrigger>
                                                {field.value && (
                                                    <div className="flex h-auto w-auto items-center justify-center gap-2">
                                                        <Avatar className="size-10">
                                                            <AvatarFallback
                                                                name={
                                                                    TemplatesList?.templates.find(
                                                                        (template) =>
                                                                            template.id === field.value,
                                                                    )?.name
                                                                }
                                                                variant="marble"
                                                            />
                                                        </Avatar>
                                                        <Button
                                                            color="default"
                                                            size="icon-lg"
                                                            tooltipContent="Unselect Template"
                                                            variant="soft"
                                                            onClick={() => {
                                                                setValue(
                                                                    'templateId',
                                                                    omniTemplateId ?? undefined,
                                                                );
                                                            }}
                                                        >
                                                            <SelectionSlashIcon
                                                                className="size-5"
                                                                color="currentColor"
                                                                weight="duotone"
                                                            />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                            <PopoverContent align="start" className="w-full rounded-3xl p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search Templates" />
                                                    <CommandList>
                                                        <CommandEmpty>No template found.</CommandEmpty>
                                                        {TemplatesList?.templates_collections?.map(
                                                            (collection) => {
                                                                const collectionTemplates =
                                                                    TemplatesList?.templates?.filter(
                                                                        (template) =>
                                                                            template.collection_id ===
                                                                            collection.id,
                                                                    );

                                                                return (
                                                                    <CommandGroup
                                                                        key={collection.id}
                                                                        heading={collection.name}
                                                                    >
                                                                        {collectionTemplates?.map(
                                                                            (template) => (
                                                                                <CommandItem
                                                                                    key={template.id}
                                                                                    disabled={isPending}
                                                                                    value={template.name}
                                                                                    onSelect={() => {
                                                                                        setValue(
                                                                                            'templateId',
                                                                                            template.id,
                                                                                        );
                                                                                    }}
                                                                                >
                                                                                    <div className="flex w-full flex-row items-center justify-between gap-2">
                                                                                        <div className="flex h-full w-auto items-center gap-3">
                                                                                            <div className="flex items-center justify-center">
                                                                                                <Avatar className="size-10">
                                                                                                    <AvatarFallback
                                                                                                        name={
                                                                                                            template.name
                                                                                                        }
                                                                                                        variant="marble"
                                                                                                    />
                                                                                                </Avatar>{' '}
                                                                                            </div>
                                                                                            <div className="flex w-auto flex-col items-start justify-start gap-1">
                                                                                                <span className="text-sm font-bold whitespace-nowrap text-current">
                                                                                                    {
                                                                                                        template.name
                                                                                                    }{' '}
                                                                                                    {template.id ===
                                                                                                        omniTemplateId && (
                                                                                                        <i className="text-muted text-xs">
                                                                                                            {' '}
                                                                                                            (default)
                                                                                                        </i>
                                                                                                    )}
                                                                                                </span>
                                                                                                <span className="text-surface-400 text-xs whitespace-nowrap">
                                                                                                    {
                                                                                                        template.label
                                                                                                    }
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                        <CheckIcon
                                                                                            className={cn(
                                                                                                'text-current',
                                                                                                'ml-2 size-5',
                                                                                                field.value ===
                                                                                                    template.id
                                                                                                    ? 'opacity-100'
                                                                                                    : 'opacity-0',
                                                                                            )}
                                                                                            color="currentColor"
                                                                                            weight="duotone"
                                                                                        />
                                                                                    </div>
                                                                                </CommandItem>
                                                                            ),
                                                                        )}
                                                                    </CommandGroup>
                                                                );
                                                            },
                                                        )}
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                    <FormMessage />
                                    <FormDescription>
                                        Please select a template to use for the translation. This will assist
                                        the AI in understanding the structure of the document you are
                                        uploading.
                                    </FormDescription>
                                </FormItem>
                            )}
                        />

                        <div className="flex w-full flex-row items-stretch justify-between gap-2">
                            <FormField
                                control={control}
                                name="sourceLanguage"
                                render={({ field }) => (
                                    <FormItem className="flex w-full flex-col gap-1 py-4">
                                        <FormLabel>
                                            Source Language
                                            <strong className="text-destructive">*</strong>
                                        </FormLabel>
                                        {/* ! - Popover Section: */}
                                        <Popover>
                                            <div className="flex w-full flex-row items-center justify-between gap-2">
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        className="w-full items-center justify-between"
                                                        color={field.value ? 'default' : 'secondary'}
                                                        role="combobox"
                                                        size="lg"
                                                        variant="soft"
                                                    >
                                                        {(() => {
                                                            const selectedLanguage =
                                                                AVAILABLE_SOURCE_LANGUAGES_WITH_AUTO?.find(
                                                                    (l) =>
                                                                        l.ids.ISO_639_1 === field.value ||
                                                                        (l.ids as { bcp_47_code?: string })
                                                                            .bcp_47_code === field.value,
                                                                );

                                                            const isAutoDetect =
                                                                field.value === AUTO_DETECT_LANGUAGE;

                                                            let FlagComponent = null;
                                                            // Prefer BCP-47 code for lookup
                                                            const languageCode =
                                                                (
                                                                    selectedLanguage?.ids as {
                                                                        bcp_47_code?: string;
                                                                    }
                                                                )?.bcp_47_code ??
                                                                selectedLanguage?.ids?.ISO_639_1;

                                                            if (!isAutoDetect && languageCode) {
                                                                const details =
                                                                    getLanguageDetails(languageCode);
                                                                FlagComponent = details.FlagComponent;
                                                            }

                                                            return (
                                                                <div className="flex w-full min-w-0 items-center gap-2 overflow-hidden text-left">
                                                                    <div className="bg-surface-100 dark:bg-surface-800 flex size-6 shrink-0 items-center justify-center overflow-hidden rounded">
                                                                        {isAutoDetect ? (
                                                                            <GlobeIcon
                                                                                className="text-surface-500 size-4"
                                                                                weight="duotone"
                                                                            />
                                                                        ) : FlagComponent ? (
                                                                            <FlagComponent className="size-6 object-cover" />
                                                                        ) : (
                                                                            <GlobeIcon
                                                                                className="text-surface-500 size-4"
                                                                                weight="duotone"
                                                                            />
                                                                        )}
                                                                    </div>
                                                                    <span className="truncate">
                                                                        {selectedLanguage?.name ??
                                                                            'Select a Source Language'}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })()}
                                                        <CaretUpDownIcon
                                                            className="ml-2 size-5 shrink-0 opacity-50"
                                                            color="currentColor"
                                                            weight="duotone"
                                                        />
                                                    </Button>
                                                </PopoverTrigger>

                                                {field.value && (
                                                    <div className="flex h-auto w-auto items-center justify-center gap-2">
                                                        <Button
                                                            color="default"
                                                            size="icon-lg"
                                                            tooltipContent="Unselect Language"
                                                            type="button"
                                                            variant="soft"
                                                            onClick={() => {
                                                                setValue(
                                                                    'sourceLanguage',
                                                                    AUTO_DETECT_LANGUAGE as unknown as BCP_47_SUPPORTED_LANGUAGE,
                                                                );
                                                            }}
                                                        >
                                                            <GlobeSimpleXIcon
                                                                className="size-5"
                                                                color="currentColor"
                                                                weight="duotone"
                                                            />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>

                                            <PopoverContent align="start" className="w-full rounded-3xl p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search Languages" />
                                                    <CommandList>
                                                        <CommandEmpty>No customer found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {AVAILABLE_SOURCE_LANGUAGES_WITH_AUTO?.map(
                                                                (availableSourceLanguage) => {
                                                                    const bcpCode =
                                                                        (
                                                                            availableSourceLanguage.ids as {
                                                                                bcp_47_code?: string;
                                                                            }
                                                                        )?.bcp_47_code ??
                                                                        availableSourceLanguage.ids.ISO_639_1;

                                                                    const isAutoDetect =
                                                                        bcpCode === AUTO_DETECT_LANGUAGE;

                                                                    return (
                                                                        <CommandItem
                                                                            key={availableSourceLanguage.name}
                                                                            disabled={isPending}
                                                                            value={`${bcpCode as unknown as BCP_47_SUPPORTED_LANGUAGE} - ${availableSourceLanguage.name} - ${
                                                                                availableSourceLanguage.nativeName
                                                                            }`}
                                                                            onSelect={() => {
                                                                                setValue(
                                                                                    'sourceLanguage',
                                                                                    bcpCode as unknown as BCP_47_SUPPORTED_LANGUAGE,
                                                                                );
                                                                            }}
                                                                        >
                                                                            <div className="flex w-full flex-row items-center justify-between gap-2">
                                                                                <div className="flex h-full w-auto items-center gap-3">
                                                                                    {(() => {
                                                                                        const {
                                                                                            FlagComponent,
                                                                                        } =
                                                                                            getLanguageDetails(
                                                                                                bcpCode ?? '',
                                                                                            );

                                                                                        return (
                                                                                            <div className="flex items-center justify-center">
                                                                                                <div className="bg-surface-100 dark:bg-surface-800 flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                                                                                                    {isAutoDetect ? (
                                                                                                        <GlobeIcon
                                                                                                            className="text-surface-500 size-5"
                                                                                                            weight="duotone"
                                                                                                        />
                                                                                                    ) : FlagComponent ? (
                                                                                                        <FlagComponent
                                                                                                            className="size-full object-cover"
                                                                                                            title={
                                                                                                                availableSourceLanguage?.name
                                                                                                            }
                                                                                                        />
                                                                                                    ) : (
                                                                                                        <GlobeIcon
                                                                                                            className="text-surface-500 size-5"
                                                                                                            weight="duotone"
                                                                                                        />
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    })()}
                                                                                    <div className="flex w-auto flex-col items-start justify-start gap-1">
                                                                                        <span className="text-sm font-bold whitespace-nowrap text-current">
                                                                                            {
                                                                                                availableSourceLanguage?.name
                                                                                            }
                                                                                            {isAutoDetect && (
                                                                                                <span className="text-muted ml-2 text-xs font-normal">
                                                                                                    (recommended)
                                                                                                </span>
                                                                                            )}
                                                                                        </span>
                                                                                        <span className="text-surface-400 text-xs whitespace-nowrap">
                                                                                            {isAutoDetect
                                                                                                ? 'AI will detect the language'
                                                                                                : availableSourceLanguage.nativeName}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                                <CheckIcon
                                                                                    className={cn(
                                                                                        'text-current',
                                                                                        'ml-2 size-5',
                                                                                        field.value ===
                                                                                            bcpCode
                                                                                            ? 'opacity-100'
                                                                                            : 'opacity-0',
                                                                                    )}
                                                                                    color="currentColor"
                                                                                    weight="duotone"
                                                                                />
                                                                            </div>
                                                                        </CommandItem>
                                                                    );
                                                                },
                                                            )}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>

                                        <FormMessage />

                                        <FormDescription>
                                            Specify the language of the uploaded document to optimize OCR
                                            results.
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />{' '}
                            <FormField
                                control={control}
                                name="targetLanguage"
                                render={({ field }) => (
                                    <FormItem className="flex w-full flex-col gap-1 py-4">
                                        <FormLabel>
                                            Target Language
                                            <strong className="text-destructive">*</strong>
                                        </FormLabel>
                                        {/* ! - Popover Section: */}
                                        <Popover>
                                            <div className="flex w-full flex-row items-center justify-between gap-2">
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        className="w-full items-center justify-between"
                                                        color={field.value ? 'default' : 'secondary'}
                                                        role="combobox"
                                                        size="lg"
                                                        variant="soft"
                                                    >
                                                        {(() => {
                                                            const selectedLanguage =
                                                                AVAILABLE_TARGET_LANGUAGES?.find(
                                                                    (l) =>
                                                                        l.ids.ISO_639_1 === field.value ||
                                                                        (l.ids as { bcp_47_code?: string })
                                                                            .bcp_47_code === field.value,
                                                                );
                                                            let FlagComponent = null;
                                                            const languageCode =
                                                                (
                                                                    selectedLanguage?.ids as {
                                                                        bcp_47_code?: string;
                                                                    }
                                                                )?.bcp_47_code ??
                                                                selectedLanguage?.ids?.ISO_639_1;

                                                            if (languageCode) {
                                                                const details =
                                                                    getLanguageDetails(languageCode);
                                                                FlagComponent = details.FlagComponent;
                                                            }

                                                            return selectedLanguage ? (
                                                                <div className="flex w-full min-w-0 items-center gap-2 overflow-hidden text-left">
                                                                    <div className="bg-surface-100 dark:bg-surface-800 flex size-6 shrink-0 items-center justify-center overflow-hidden rounded">
                                                                        {FlagComponent ? (
                                                                            <FlagComponent className="size-6 object-cover" />
                                                                        ) : (
                                                                            <GlobeIcon
                                                                                className="text-surface-500 size-4"
                                                                                weight="duotone"
                                                                            />
                                                                        )}
                                                                    </div>
                                                                    <span className="truncate">
                                                                        {selectedLanguage.name}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                'Select a Target Language'
                                                            );
                                                        })()}
                                                        <CaretUpDownIcon
                                                            className="ml-2 size-5 shrink-0 opacity-50"
                                                            color="currentColor"
                                                            weight="duotone"
                                                        />
                                                    </Button>
                                                </PopoverTrigger>

                                                {field.value && (
                                                    <div className="flex h-auto w-auto items-center justify-center gap-2">
                                                        <Button
                                                            color="default"
                                                            size="icon-lg"
                                                            tooltipContent="Unselect Language"
                                                            type="button"
                                                            variant="soft"
                                                            onClick={() => {
                                                                setValue(
                                                                    'targetLanguage',
                                                                    BCP_47_SUPPORTED_LANGUAGE.French,
                                                                );
                                                            }}
                                                        >
                                                            <GlobeSimpleXIcon
                                                                className="size-5"
                                                                color="currentColor"
                                                                weight="duotone"
                                                            />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>

                                            <PopoverContent align="start" className="w-full rounded-3xl p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search Languages" />
                                                    <CommandList>
                                                        <CommandEmpty>No customer found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {AVAILABLE_TARGET_LANGUAGES?.map(
                                                                (availableTargetLanguage) => {
                                                                    const bcpCode =
                                                                        (
                                                                            availableTargetLanguage.ids as {
                                                                                bcp_47_code?: string;
                                                                            }
                                                                        )?.bcp_47_code ??
                                                                        availableTargetLanguage.ids.ISO_639_1;

                                                                    return (
                                                                        <CommandItem
                                                                            key={availableTargetLanguage.name}
                                                                            disabled={isPending}
                                                                            value={`${bcpCode as unknown as BCP_47_SUPPORTED_LANGUAGE} - ${availableTargetLanguage.name} - ${
                                                                                availableTargetLanguage.nativeName
                                                                            }`}
                                                                            onSelect={() => {
                                                                                setValue(
                                                                                    'targetLanguage',
                                                                                    bcpCode as unknown as BCP_47_SUPPORTED_LANGUAGE,
                                                                                );
                                                                            }}
                                                                        >
                                                                            <div className="flex w-full flex-row items-center justify-between gap-2">
                                                                                <div className="flex h-full w-auto items-center gap-3">
                                                                                    {(() => {
                                                                                        const {
                                                                                            FlagComponent,
                                                                                        } =
                                                                                            getLanguageDetails(
                                                                                                bcpCode ?? '',
                                                                                            );

                                                                                        return (
                                                                                            <div className="flex items-center justify-center">
                                                                                                <div className="bg-surface-100 dark:bg-surface-800 flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                                                                                                    {FlagComponent ? (
                                                                                                        <FlagComponent
                                                                                                            className="size-full object-cover"
                                                                                                            title={
                                                                                                                availableTargetLanguage?.name
                                                                                                            }
                                                                                                        />
                                                                                                    ) : (
                                                                                                        <GlobeIcon
                                                                                                            className="text-surface-500 size-5"
                                                                                                            weight="duotone"
                                                                                                        />
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    })()}
                                                                                    <div className="flex w-auto flex-col items-start justify-start gap-1">
                                                                                        <span className="text-sm font-bold whitespace-nowrap text-current">
                                                                                            {
                                                                                                availableTargetLanguage.name
                                                                                            }
                                                                                        </span>
                                                                                        <span className="text-surface-400 text-xs whitespace-nowrap">
                                                                                            {
                                                                                                availableTargetLanguage.nativeName
                                                                                            }
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                                <CheckIcon
                                                                                    className={cn(
                                                                                        'text-current',
                                                                                        'ml-2 size-5',
                                                                                        field.value ===
                                                                                            bcpCode
                                                                                            ? 'opacity-100'
                                                                                            : 'opacity-0',
                                                                                    )}
                                                                                    color="currentColor"
                                                                                    weight="duotone"
                                                                                />
                                                                            </div>
                                                                        </CommandItem>
                                                                    );
                                                                },
                                                            )}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>

                                        <FormMessage />

                                        <FormDescription>
                                            Specify the target language for the document translation.
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={control}
                            name="scannedDocumentFile"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel htmlFor={field.name}>
                                        File
                                        <strong className="text-destructive">*</strong>
                                    </FormLabel>
                                    <FileDropzone
                                        accept={allowedMimeTypes}
                                        accessToken={session?.access_token}
                                        disabled={isPending}
                                        maxSize={50 * 1024 * 1024}
                                        userId={userId}
                                        value={field.value}
                                        onChange={field.onChange}
                                        onRemove={async (fileName) => {
                                            const supabase = createBrowserClient();
                                            const { error: storageError } = await supabase.storage
                                                .from(env.NEXT_PUBLIC_FILE_UPLOAD_BUCKET)
                                                .remove([fileName]);
                                            if (storageError) {
                                                console.error('Error deleting file:', storageError.message);
                                            } else {
                                                console.log('File deleted successfully:', fileName);
                                            }
                                        }}
                                    />
                                    <FormMessage />
                                    <FormDescription>
                                        Upload a scanned document in JPEG, PNG, or PDF format for translation.
                                    </FormDescription>
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="mt-2 flex w-full flex-row items-stretch justify-end gap-2">
                        <Button
                            className="w-auto"
                            color="secondary"
                            disabled={false}
                            shape="rounded"
                            size="lg"
                            type="button"
                            variant="soft"
                            onClick={() => router.back()}
                        >
                            <ArrowUUpLeftIcon className="size-5" color="currentColor" weight="duotone" />
                            Back
                        </Button>
                        {isPending ? (
                            <Button
                                className="w-auto"
                                color="primary"
                                disabled={true}
                                shape="rounded"
                                size="lg"
                                type="button"
                                variant="solid"
                            >
                                <div role="status">
                                    <Spinner className="size-5 text-current" />
                                    <span className="sr-only">Loading</span>
                                </div>
                                Triggering Translation
                            </Button>
                        ) : (
                            <Button
                                className="w-auto"
                                color="primary"
                                shape="rounded"
                                size="lg"
                                type="submit"
                                variant="solid"
                            >
                                <PlayIcon className="size-5" color="currentColor" weight="duotone" />
                                Trigger Translation
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </FormProvider>
    );
}
