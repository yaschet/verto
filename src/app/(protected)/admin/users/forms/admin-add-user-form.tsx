/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import {
    AddressBookIcon,
    BriefcaseIcon,
    ShieldCheckIcon,
    UserIcon,
    UserCirclePlusIcon,
    WarningIcon,
} from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { createAdminUserFormSchema, type AdminUserFormData } from '@/src/schemas/user-form-schemas';
import { createUser } from '@/src/actions/admin/users/create-user';
import Alert, { AlertDescription, AlertIcon, AlertTitle } from '@/src/components/ui/alert';
import { Button } from '@/src/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/src/components/ui/accordion';
import { useAdminStore } from '@/src/components/providers/admin-store-provider';
import { useZodResolver } from '@/src/hooks/use-zod-resolver';
import { PersonalInformationFields } from '@/src/components/shared/user-forms/fields/personal-information-fields';
import { ContactInformationFields } from '@/src/components/shared/user-forms/fields/contact-information-fields';
import { ProfessionalInformationFields } from '@/src/components/shared/user-forms/fields/professional-information-fields';
import { AccountSecurityFields } from '@/src/components/shared/user-forms/fields/account-security-fields';
import { DEFAULT_FORM_VALUES } from '@/src/hooks/use-admin-user-form-state';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import Spinner from '@/src/components/ui/spinner';

interface AdminAddUserFormProps {
    onUserCreated: (data: ApiResponseOrError) => void;
}

/**
 * Admin Add User Form
 *
 * Full-featured form with collapsible accordion sections for creating new users.
 * Includes all 20+ fields organized into 4 sections.
 */
export default function AdminAddUserForm({ onUserCreated }: AdminAddUserFormProps) {
    const setIsAddUserSheetOpen = useAdminStore((state) => state.setIsAddUserSheetOpen);
    const [accordionItems, setAccordionItems] = useState<string[]>(['personal', 'contact', 'account']);

    const [errorAlert, setErrorAlert] = useState<{
        error: boolean;
        title?: string;
        message: string;
        description: string;
    } | null>(null);

    // Form schema for Add mode (password required)
    const zodSchema = createAdminUserFormSchema(false);
    const resolver = useZodResolver(zodSchema);

    // Form methods
    const formMethods = useForm<AdminUserFormData>({
        defaultValues: DEFAULT_FORM_VALUES,
        mode: 'onSubmit',
        resolver,
    });

    const {
        control,
        formState: { errors },
        handleSubmit,
    } = formMethods;

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

    // Mutation for creating user
    const { isPending, mutateAsync } = useMutation({
        mutationFn: async (values: AdminUserFormData) => {
            const response = await createUser({
                email: values.contactInformation.email,
                first_name: values.personalInformation.firstName,
                last_name: values.personalInformation.lastName,
                password: values.accountSecurity.password,
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
            });

            if (response?.error || !response) {
                throw response;
            }

            return response;
        },
        onError: (error: (Error & Partial<ApiErrorType>) | ApiErrorType) => {
            setErrorAlert({
                description: error.description ?? 'An error occurred while creating the user.',
                error: true,
                message: error.message ?? 'Failed to create user.',
                title: error.title ?? 'User Creation Failed',
            });
        },
        onSuccess: async (data: ApiResponseOrError) => {
            setIsAddUserSheetOpen(false);
            onUserCreated(data);
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
                                passwordRequired={true}
                                showRoleField={true}
                            />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

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
                            Creating User
                        </Button>
                    ) : (
                        <Button
                            type="submit"
                            color="primary"
                            variant="solid"
                            size="lg"
                            className="min-w-[150px]"
                        >
                            <UserCirclePlusIcon className="size-5" weight="duotone" />
                            Create User
                        </Button>
                    )}
                </div>
            </form>
        </FormProvider>
    );
}
