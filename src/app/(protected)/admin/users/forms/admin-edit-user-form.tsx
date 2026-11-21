/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import {
    AddressBookIcon,
    BriefcaseIcon,
    FloppyDiskIcon,
    ShieldCheckIcon,
    UserIcon,
    WarningIcon,
} from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import {
    createAdminUserFormSchema,
    transformApiDataToAdminFormData,
    type AdminUserFormData,
} from '@/src/schemas/user-form-schemas';
import { updateUser } from '@/src/actions/admin/users/update-user';
import Alert, { AlertDescription, AlertIcon, AlertTitle } from '@/src/components/ui/alert';
import { Button } from '@/src/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/src/components/ui/accordion';
import { useZodResolver } from '@/src/hooks/use-zod-resolver';
import { PersonalInformationFields } from '@/src/components/shared/user-forms/fields/personal-information-fields';
import { ContactInformationFields } from '@/src/components/shared/user-forms/fields/contact-information-fields';
import { ProfessionalInformationFields } from '@/src/components/shared/user-forms/fields/professional-information-fields';
import { AccountSecurityFields } from '@/src/components/shared/user-forms/fields/account-security-fields';
import { DEFAULT_FORM_VALUES } from '@/src/hooks/use-admin-user-form-state';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import Spinner from '@/src/components/ui/spinner';

interface AdminEditUserFormProps {
    userId: string;
    initialData?: Parameters<typeof transformApiDataToAdminFormData>[0];
    onUserUpdated: (data: ApiResponseOrError) => void;
}

/**
 * Admin Edit UserForm
 *
 * Full-featured form with collapsible accordion sections for editing existing users.
 * Password is optional in Edit mode.
 */
export default function AdminEditUserForm({ userId, initialData, onUserUpdated }: AdminEditUserFormProps) {
    const [accordionItems, setAccordionItems] = useState<string[]>(['personal', 'contact', 'account']);

    const [errorAlert, setErrorAlert] = useState<{
        error: boolean;
        title?: string;
        message: string;
        description: string;
    } | null>(null);

    // Form schema for Edit mode (password optional)
    const zodSchema = createAdminUserFormSchema(true);
    const resolver = useZodResolver(zodSchema);

    // Transform initial data to form format
    const transformedInitialData = initialData
        ? transformApiDataToAdminFormData(initialData)
        : DEFAULT_FORM_VALUES;

    // Form methods
    const formMethods = useForm<AdminUserFormData>({
        defaultValues: {
            ...DEFAULT_FORM_VALUES,
            ...transformedInitialData,
        },
        mode: 'onSubmit',
        resolver,
    });

    const {
        control,
        formState: { errors, isDirty },
        handleSubmit,
        reset,
    } = formMethods;

    // Reset form when initial data changes
    useEffect(() => {
        if (initialData) {
            const transformed = transformApiDataToAdminFormData(initialData);
            reset({
                ...DEFAULT_FORM_VALUES,
                ...transformed,
            });
        }
    }, [initialData, reset]);

    // Reactive Accordion Management: Auto-expand sections with errors
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            const newExpanded = new Set(accordionItems);
            if (errors.personalInformation) newExpanded.add('personal');
            if (errors.contactInformation) newExpanded.add('contact');
            if (errors.professionalInformation) newExpanded.add('professional');
            if (errors.accountSecurity) newExpanded.add('account');
            setAccordionItems(Array.from(newExpanded));
        }
    }, [errors]);

    // Mutation for updating user
    const { isPending, mutateAsync } = useMutation({
        mutationFn: async (values: AdminUserFormData) => {
            const response = await updateUser({
                id: userId,
                email: values.contactInformation.email,
                first_name: values.personalInformation.firstName,
                last_name: values.personalInformation.lastName,
                role: values.role,
                phone: values.contactInformation.phoneNumber,
                address: values.contactInformation.address,
                address2: values.contactInformation.address2,
                city: values.contactInformation.city,
                state: values.contactInformation.state,
                zip_code: values.contactInformation.zipCode,
                country: values.contactInformation.country,
                date_of_birth:
                    values.personalInformation.year &&
                    values.personalInformation.month &&
                    values.personalInformation.day
                        ? `${values.personalInformation.year}-${values.personalInformation.month.padStart(2, '0')}-${values.personalInformation.day.padStart(2, '0')}`
                        : undefined,
                company_name: values.professionalInformation.companyName,
                translation_experience: values.professionalInformation.translationExperience ?? undefined,
                qualifications: values.professionalInformation.qualifications?.map((q) => q.text) ?? [],
                professional_affiliations:
                    values.professionalInformation.professionalAffiliations?.map((a) => a.text) ?? [],
                specializations: values.professionalInformation.specializations?.map((s) => s.text) ?? [],
                commercial_emails: values.accountSecurity.commercialEmails,
                // Only include password if provided
                ...(values.accountSecurity.password ? { password: values.accountSecurity.password } : {}),
            });

            if (response?.error || !response) {
                throw response;
            }

            return response;
        },
        onError: (error: (Error & Partial<ApiErrorType>) | ApiErrorType) => {
            setErrorAlert({
                description: error.description ?? 'An error occurred while updating the user.',
                error: true,
                message: error.message ?? 'Failed to update user.',
                title: error.title ?? 'User Update Failed',
            });
        },
        onSuccess: async (data: ApiResponseOrError) => {
            onUserUpdated(data);
        },
        retry: 0,
    });

    return (
        <FormProvider {...formMethods}>
            <form
                className="flex w-full flex-col gap-6"
                onSubmit={handleSubmit(async (data) => {
                    return mutateAsync(data);
                })}
            >
                {/* Alert Section */}
                <Alert
                    withCloseButton
                    className="w-full"
                    show={errorAlert?.error === true}
                    variant="destructive"
                    onClose={() => setErrorAlert(null)}
                >
                    <AlertIcon>
                        <WarningIcon className="size-5" color="currentColor" weight="duotone" />
                    </AlertIcon>
                    <AlertTitle>{errorAlert?.title ?? errorAlert?.message}</AlertTitle>
                    <AlertDescription>{errorAlert?.description}</AlertDescription>
                </Alert>

                {/* Accordion Sections */}
                <Accordion
                    type="multiple"
                    value={accordionItems}
                    onValueChange={setAccordionItems}
                    className="space-y-1"
                >
                    {/* Personal Information Section */}
                    <AccordionItem value="personal" className="border-0">
                        <AccordionTrigger className="py-3 hover:no-underline">
                            <div className="flex items-center gap-3">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
                                    <UserIcon className="size-4 text-muted-foreground" weight="duotone" />
                                </div>
                                <span className="font-medium">Personal Information</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-1 pb-6">
                            <PersonalInformationFields control={control} errors={errors} />
                        </AccordionContent>
                    </AccordionItem>

                    {/* Contact Information Section */}
                    <AccordionItem value="contact" className="border-0">
                        <AccordionTrigger className="py-3 hover:no-underline">
                            <div className="flex items-center gap-3">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
                                    <AddressBookIcon
                                        className="size-4 text-muted-foreground"
                                        weight="duotone"
                                    />
                                </div>
                                <span className="font-medium">Contact Information</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-1 pb-6">
                            <ContactInformationFields control={control} errors={errors} />
                        </AccordionContent>
                    </AccordionItem>

                    {/* Professional Information Section (collapsed by default - optional) */}
                    <AccordionItem value="professional" className="border-0">
                        <AccordionTrigger className="py-3 hover:no-underline">
                            <div className="flex items-center gap-3">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
                                    <BriefcaseIcon
                                        className="size-4 text-muted-foreground"
                                        weight="duotone"
                                    />
                                </div>
                                <span className="font-medium">Professional Information</span>
                                <span className="text-muted-foreground text-xs">(optional)</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-1 pb-6">
                            <ProfessionalInformationFields control={control} errors={errors} />
                        </AccordionContent>
                    </AccordionItem>

                    {/* Account & Role Section */}
                    <AccordionItem value="account" className="border-0">
                        <AccordionTrigger className="py-3 hover:no-underline">
                            <div className="flex items-center gap-3">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
                                    <ShieldCheckIcon
                                        className="size-4 text-muted-foreground"
                                        weight="duotone"
                                    />
                                </div>
                                <span className="font-medium">Account & Role</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-1 pb-6">
                            <AccountSecurityFields
                                control={control}
                                errors={errors}
                                passwordRequired={false}
                                showRoleField={true}
                            />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                {/* Unsaved Changes Notice */}
                {isDirty && (
                    <Alert withCloseButton={false} variant="warning" className="w-full">
                        <AlertIcon>
                            <WarningIcon className="size-5" color="currentColor" weight="duotone" />
                        </AlertIcon>
                        <AlertTitle>Unsaved Changes</AlertTitle>
                        <AlertDescription>You have unsaved changes.</AlertDescription>
                    </Alert>
                )}

                {/* Submit Button */}
                <div className="flex justify-end pt-2">
                    {isPending ? (
                        <Button
                            type="button"
                            color="primary"
                            variant="solid"
                            size="lg"
                            disabled={true}
                            className="min-w-[150px]"
                        >
                            <div role="status">
                                <Spinner className="size-5 text-current" />
                                <span className="sr-only">Loading</span>
                            </div>
                            Saving Changes
                        </Button>
                    ) : (
                        <Button
                            type="submit"
                            color="primary"
                            variant="solid"
                            size="lg"
                            disabled={!isDirty}
                            className="min-w-[150px]"
                        >
                            <FloppyDiskIcon className="size-5" weight="duotone" />
                            Save Changes
                        </Button>
                    )}
                </div>
            </form>
        </FormProvider>
    );
}
