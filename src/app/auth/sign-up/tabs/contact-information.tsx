/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

// ! Form Components - Personal Information, Contact Information, Professional Information, Account Security.
import { useZodResolver } from '@/src/hooks/use-zod-resolver';
import { ArrowLeftIcon, ArrowRightIcon, AtIcon } from '@phosphor-icons/react';
import { countries } from 'countries-list';
import * as countriesFlag from 'country-flag-icons/react/3x2';
import { useForm } from 'react-hook-form';
import validator from 'validator';
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
import { cn } from '@library/utils';
import type { RegistrationDataType } from '@/types/auth/registration';
import type { ICountry, TCountries, TCountryCode } from 'countries-list';

// * Declare Schema for Personal Information Form Object:
const contactInformationSchema = z.object({
    address: z.string().min(5, { message: 'Please enter a valid address.' }),
    address2: z.string().optional(),
    city: z.string().min(2, { message: 'Please enter a valid city.' }),
    country: z.string().min(2, { message: 'Please enter a valid country.' }),
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    phoneNumber: z.string().refine((value) => validator.isMobilePhone(value), {
        message: 'Please enter a valid phone number.',
    }),
    state: z.string().min(2, { message: 'Please enter a valid state.' }),
    zipCode: z.string().min(5, { message: 'Please enter a valid zip code.' }),
});

// * Personal Information:
export default function ContactInformation({
    backward,
    contactInformation,
    isLoading,
    submitContactInformation,
}: {
    contactInformation: RegistrationDataType['contactInformation'];
    submitContactInformation: (values: RegistrationDataType['contactInformation']) => void;
    isLoading: boolean;
    backward: () => void;
}) {
    const countriesList: TCountries = countries;

    const countriesKeys: TCountryCode[] = Object.keys(countriesList) as TCountryCode[];

    const countriesArray: {
        value: ICountry['name'];
        label: string;
        code: TCountryCode;
        flag: countriesFlag.FlagComponent;
    }[] = countriesKeys.map((country: TCountryCode) => {
        return {
            code: country,
            flag: () => {
                const Flag: countriesFlag.FlagComponent = countriesFlag[
                    country
                ] as countriesFlag.FlagComponent;
                return <Flag className={cn('mr-2 h-4 w-4')} title={countriesList[country].name} />;
            },
            label: countriesList[country].name,
            value: countriesList[country].name,
        };
    });

    countriesArray.sort((a, b) => (a.label > b.label ? 1 : -1));

    const form = useForm<z.infer<typeof contactInformationSchema>>({
        defaultValues: {
            address: contactInformation.address,
            address2: contactInformation.address2,
            city: contactInformation.city,
            country: contactInformation.country,
            email: contactInformation.email,
            phoneNumber: contactInformation.phoneNumber,
            state: contactInformation.state,
            zipCode: contactInformation.zipCode,
        },
        resolver: useZodResolver(contactInformationSchema),
    });

    const onSubmit = (values: z.infer<typeof contactInformationSchema>) => {
        submitContactInformation({
            address: values.address,
            address2: values.address2,
            city: values.city,
            country: values.country,
            email: values.email,
            phoneNumber: values.phoneNumber,
            state: values.state,
            zipCode: values.zipCode,
        });

        return true;
    };

    return (
        <div className="flex w-full flex-col items-center justify-center gap-5">
            <div className="mb-5 flex flex-col items-center justify-center gap-3" data-testid="welcome-text">
                <div className="bg-primary-100 dark:bg-primary-900 mb-3 flex size-16 items-center justify-center rounded-full">
                    <AtIcon className="text-primary-500 dark:text-primary-400 size-8" weight="duotone" />
                </div>
                <h1 className="text-surface-900 text-center text-3xl leading-tight font-bold tracking-tight md:text-4xl dark:text-white">
                    Contact Details
                </h1>
                <p className="text-surface-600 dark:text-surface-400 text-center font-medium">
                    Provide Your Contact Details to Proceed. We Will Use This Information to Contact You,
                    Create Invoices, and Generate Shipping Labels.
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
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            autoComplete="email"
                                            placeholder="you@example.com"
                                            shape="rounded"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    <FormDescription>Enter your email address.</FormDescription>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phoneNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl>
                                        <Input
                                            autoComplete="tel"
                                            placeholder="123-456-7890"
                                            shape="rounded"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    <FormDescription>
                                        Enter your phone number in the format 123-456-7890.
                                    </FormDescription>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address Line 1</FormLabel>
                                    <FormControl>
                                        <Input
                                            autoComplete="address-line1"
                                            placeholder="1234 Main St."
                                            shape="rounded"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    <FormDescription>
                                        Enter the primary address line (e.g., street address).
                                    </FormDescription>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="address2"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address Line 2 (Optional)</FormLabel>
                                    <FormControl>
                                        <Input
                                            autoComplete="address-line2"
                                            placeholder="Apartment 5B"
                                            shape="rounded"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    <FormDescription>
                                        Enter additional address details, such as apartment or suite number.
                                    </FormDescription>
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid w-full grid-flow-row grid-cols-1 gap-3 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>City</FormLabel>
                                    <FormControl>
                                        <Input
                                            autoComplete="address-level2"
                                            placeholder="City"
                                            shape="rounded"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    <FormDescription>Enter the name of your city.</FormDescription>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="state"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>State/Province</FormLabel>
                                    <FormControl>
                                        <Input
                                            autoComplete="address-level1"
                                            placeholder="State/Province"
                                            shape="rounded"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    <FormDescription>
                                        Enter the name of your state or province.
                                    </FormDescription>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="zipCode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Zip/Postal Code</FormLabel>
                                    <FormControl>
                                        <Input
                                            autoComplete="postal-code"
                                            placeholder="12345"
                                            shape="rounded"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    <FormDescription>
                                        Enter a valid zip code to get accurate shipping information.
                                    </FormDescription>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="country"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Country</FormLabel>
                                    <Select
                                        autoComplete="country"
                                        defaultValue={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Country" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {countriesArray.map(
                                                (country: {
                                                    value: ICountry['name'];
                                                    label: string;
                                                    code: TCountryCode;
                                                    flag: countriesFlag.FlagComponent;
                                                }) => {
                                                    return (
                                                        <SelectItem key={country.value} value={country.value}>
                                                            <div className="flex items-center gap-2">
                                                                <country.flag />
                                                                <span className="whitespace-normal">
                                                                    {country.label}
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                },
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    <FormDescription>
                                        Select your country from the dropdown menu.
                                    </FormDescription>
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
                            type="button"
                            variant="soft"
                        >
                            Loading
                        </Button>
                    ) : (
                        <div
                            className={cn(
                                'flex w-full flex-col-reverse items-center justify-center gap-5 sm:flex-row sm:items-center sm:justify-between',
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
