/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

// ! Form Components - Personal Information, Contact Information, Professional Information, Account Security.
import { useZodResolver } from '@/src/hooks/use-zod-resolver';
import { ArrowLeftIcon, ArrowRightIcon, BriefcaseIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { TagInput } from '@components/ui/tag-input';
import { cn } from '@library/utils';
import type { RegistrationDataType } from '@/types/auth/registration';
import type { Tag } from '@components/ui/tag-input';

// * - Declare Schema for Personal Information Form Object:
const professionalInformationSchema = z.object({
    companyName: z.string().optional(),
    professionalAffiliations: z
        .array(
            z.object({
                id: z.string(),
                text: z.string(),
            }),
        )
        .nullable(),
    qualifications: z
        .array(
            z.object({
                id: z.string(),
                text: z.string(),
            }),
        )
        .nullable(),
    resume: z.string().nullable().optional(),
    specializations: z
        .array(
            z.object({
                id: z.string(),
                text: z.string(),
            }),
        )
        .nullable(),
    translationExperience: z
        .enum(['Beginner', 'Intermediate', 'Advanced', 'Expert'])
        .nullable()
        .default('Beginner'),
});

// * Personal Information:
export default function ProfessionalInformation({
    backward,
    isLoading,
    professionalInformation,
    submitProfessionalInformation,
}: {
    professionalInformation: RegistrationDataType['professionalInformation'];
    submitProfessionalInformation: (values: RegistrationDataType['professionalInformation']) => void;
    isLoading: boolean;
    backward: () => void;
}) {
    // * 1. Declare Form Object:
    const form = useForm<z.infer<typeof professionalInformationSchema>>({
        defaultValues: {
            companyName: professionalInformation?.companyName ?? '',
            professionalAffiliations:
                professionalInformation?.professionalAffiliations?.map((value) => ({
                    id: value,
                    text: value,
                })) ?? [],
            qualifications:
                professionalInformation?.qualifications?.map((value) => ({ id: value, text: value })) ?? [],
            resume: professionalInformation?.resume ?? null,
            specializations:
                professionalInformation?.specializations?.map((value) => ({ id: value, text: value })) ?? [],
            translationExperience: professionalInformation?.translationExperience ?? 'Beginner',
        },
        resolver: useZodResolver(professionalInformationSchema),
    });

    const { setValue } = form;

    // ! Experience Years:
    // ? Experience Years Select Box Options:
    const experienceYears = [
        {
            label: 'Beginner',
            value: 'Beginner',
        },
        {
            label: 'Intermediate',
            value: 'Intermediate',
        },
        {
            label: 'Advanced',
            value: 'Advanced',
        },
        {
            label: 'Expert',
            value: 'Expert',
        },
    ];

    // ! Qualifications:
    // ? Qualifications will be displayed as a tag input.
    const [qualifications, setQualifications] = useState<Tag[]>(form.getValues('qualifications') ?? []);

    // ! Professional Affiliations:
    const [professionalAffiliations, setProfessionalAffiliations] = useState<Tag[]>(
        form.getValues('professionalAffiliations') ?? [],
    );

    // ! Specializations:
    const [specializations, setSpecializations] = useState<Tag[]>(form.getValues('specializations') ?? []);

    // ! 2. Define submit handler.
    const onSubmit = (values: z.infer<typeof professionalInformationSchema>) => {
        // * Send Information to Parent Component:

        // ! Send Professional Information to Parent Component.
        submitProfessionalInformation({
            companyName: values.companyName,
            professionalAffiliations: values.professionalAffiliations?.map((value) => value.text),
            qualifications: values.qualifications?.map((value) => value.text),
            resume: values.resume ?? null,
            specializations: values.specializations?.map((value) => value.text),
            translationExperience: values.translationExperience,
        });

        return true;
    };

    return (
        <div className="flex w-full flex-col items-center justify-center gap-5">
            <div className="mb-5 flex flex-col items-center justify-center gap-3" data-testid="welcome-text">
                <div className="bg-primary-100 dark:bg-primary-900 mb-3 flex size-16 items-center justify-center rounded-full">
                    <BriefcaseIcon
                        className="text-primary-500 dark:text-primary-400 size-8"
                        weight="duotone"
                    />
                </div>
                <h1 className="text-surface-900 text-center text-3xl leading-tight font-bold tracking-tight md:text-4xl dark:text-white">
                    Professional Information
                </h1>
                <p className="text-surface-600 dark:text-surface-400 text-center font-medium">
                    Provide Your Professional Information to Help Us Understand Your Background and
                    Experience.
                </p>
            </div>
            <Form {...form}>
                <form
                    className="mb-5 flex w-full flex-col items-center justify-center gap-5"
                    onSubmit={form.handleSubmit(onSubmit)}
                >
                    <div className="grid w-full grid-flow-row grid-cols-1 gap-3 md:grid-cols-1">
                        <FormField
                            control={form.control}
                            name="companyName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Company Name{' '}
                                        <span className="text-surface-500 dark:text-surface-500 text-xs">
                                            (optional)
                                        </span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            autoComplete="company-name"
                                            placeholder="Company Name"
                                            shape="rounded"
                                            type="text"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    <FormDescription>This will be displayed on your profile.</FormDescription>
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid w-full grid-flow-row grid-cols-1 gap-3 md:grid-cols-1">
                        <FormField
                            control={form.control}
                            name="translationExperience"
                            // Take one full column
                            render={({ field }) => (
                                <FormItem className="col-span-1">
                                    <FormLabel>
                                        Experience{' '}
                                        <span className="text-surface-500 dark:text-surface-500 text-xs">
                                            (optional)
                                        </span>
                                    </FormLabel>
                                    <Select defaultValue={field.value ?? '0'} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Years of Experience" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {experienceYears.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    className="text-left"
                                                    value={option.value?.toString()}
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    <FormDescription>
                                        How much experience do you have in documents translation?
                                    </FormDescription>
                                </FormItem>
                            )}
                        />
                    </div>
                    <div
                        className="grid w-full grid-flow-row grid-cols-1 gap-3 md:grid-cols-1"
                        data-testid="qualifications"
                    >
                        <FormField
                            control={form.control}
                            name="qualifications"
                            render={({ field }) => (
                                <FormItem className="flex flex-col items-start">
                                    <FormLabel className="text-left">
                                        Qualifications{' '}
                                        <span className="text-surface-500 dark:text-surface-500 text-xs">
                                            (optional)
                                        </span>
                                    </FormLabel>
                                    <FormControl>
                                        <TagInput
                                            ref={field.ref}
                                            inputProps={{
                                                shape: 'rounded',
                                            }}
                                            placeholder="Enter your qualifications"
                                            setTags={(newTags) => {
                                                setQualifications(newTags);
                                                setValue('qualifications', newTags as [Tag, ...Tag[]]);
                                            }}
                                            shape="rounded"
                                            tags={qualifications}
                                            value={field.value?.map((value) => value.text)}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Enter your qualifications, separated by commas. For example: "Bachelor
                                        of Arts, Master of Arts, PhD, etc".
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="grid w-full grid-flow-row grid-cols-1 gap-3 md:grid-cols-1">
                        <FormField
                            control={form.control}
                            name="professionalAffiliations"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Professional Affiliations{' '}
                                        <span className="text-surface-500 dark:text-surface-500 text-xs">
                                            (optional)
                                        </span>
                                    </FormLabel>
                                    <FormControl>
                                        <TagInput
                                            ref={field.ref}
                                            inputProps={{
                                                shape: 'rounded',
                                            }}
                                            placeholder="Professional Affiliations"
                                            setTags={(newTags) => {
                                                setProfessionalAffiliations(newTags);
                                                setValue(
                                                    'professionalAffiliations',
                                                    newTags as [Tag, ...Tag[]],
                                                );
                                            }}
                                            shape="rounded"
                                            tags={professionalAffiliations}
                                            value={field.value?.map((value) => value.text)}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        For example: "American Translators Association, etc".
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="specializations"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Specializations{' '}
                                        <span className="text-surface-500 dark:text-surface-500 text-xs">
                                            (optional)
                                        </span>
                                    </FormLabel>
                                    <FormControl>
                                        <TagInput
                                            ref={field.ref}
                                            inputProps={{
                                                shape: 'rounded',
                                            }}
                                            placeholder="Specializations"
                                            setTags={(newTags) => {
                                                setSpecializations(newTags);
                                                setValue('specializations', newTags as [Tag, ...Tag[]]);
                                            }}
                                            shape="rounded"
                                            tags={specializations}
                                            value={field.value?.map((value) => value.text)}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {isLoading ? (
                        <Button
                            className="mt-2 w-full"
                            color="primary"
                            disabled={true}
                            loading={true}
                            shape="rounded"
                            size="lg"
                            type="button"
                            variant="soft"
                        >
                            Loading
                        </Button>
                    ) : (
                        <div
                            className={cn(
                                'flex w-full flex-col-reverse items-center justify-center gap-5',
                                'sm:flex-row sm:items-center sm:justify-between',
                            )}
                        >
                            <Button
                                className="w-full"
                                color="primary"
                                shape="rounded"
                                size="lg"
                                type="button"
                                variant="soft"
                                onClick={backward}
                            >
                                <ArrowLeftIcon className="size-5" color="currentColor" weight="duotone" />
                                Back
                            </Button>
                            <Button
                                className="w-full"
                                color="primary"
                                shape="rounded"
                                size="lg"
                                type="submit"
                                variant="solid"
                            >
                                Next
                                <ArrowRightIcon className="size-5" color="currentColor" weight="duotone" />
                            </Button>
                        </div>
                    )}
                </form>
            </Form>
        </div>
    );
}
