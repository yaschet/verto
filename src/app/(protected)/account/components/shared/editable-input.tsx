/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { useZodResolver } from '@/src/hooks/use-zod-resolver';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@components/ui/button';
import { FormControl, FormDescription, FormField, FormItem, FormMessage } from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import Spinner from '@components/ui/spinner';
import { cn } from '@library/utils';
import type { InputProps } from '@components/ui/input';
import type { ReactNode } from 'react';

export function EditableInput({
    className,
    customZodSchema,
    description,
    id,
    label,
    name,
    onCancel,
    onSave,
    placeholder,
    shape,
    size,
    type,
    value,
}: {
    id?: string;
    type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url';
    name: string;
    label: string;
    value: string;
    customZodSchema?: z.ZodType<string>;
    placeholder: string;
    description?: string | ReactNode;
    onSave: (value: string) => void;
    onCancel: () => void;
    className?: string;
    size?: InputProps['size'];
    shape?: InputProps['shape'];
}) {
    let keyZodSchema: z.Schema<string>;

    switch (type) {
        case 'email':
            keyZodSchema = z.string().email({ message: 'Invalid email address.' });
            break;
        case 'password':
            keyZodSchema = z.string().min(8, 'Password must be at least 8 characters.');
            break;
        case 'number':
            keyZodSchema = z.string().regex(/^[0-9]+$/, 'Must be a number.');
            break;
        case 'tel':
            keyZodSchema = z.string().regex(/^\+[0-9]+$/, 'Must be a phone number.');
            break;
        case 'url':
            keyZodSchema = z.string().url();
            break;
        default:
            keyZodSchema = z.string().min(3, 'Must be at least 3 characters.');
            break;
    }

    const zodSchema = z.object({
        [name]: customZodSchema || keyZodSchema,
    });

    const form = useForm<z.infer<typeof zodSchema>>({
        defaultValues: {
            [name]: value,
        },
        mode: 'onSubmit',
        resolver: useZodResolver(zodSchema),
    });

    const isSaveDisabled = false;
    const isEditing = form.formState.isDirty;
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        setIsLoading(true);

        // Simulate a network request.
        setTimeout(() => {
            setIsLoading(false);
            onSave(form.getValues()[name]);
        }, 1000);
    };

    const handleCancel = () => {
        form.reset();
        onCancel();
    };

    return (
        <FormProvider {...form}>
            <form className="flex w-full flex-col gap-2" onSubmit={form.handleSubmit(handleSave)}>
                <FormField
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <Label className="text-muted w-max shrink-0 text-xs font-semibold" htmlFor="name">
                                {label}
                            </Label>
                            <FormControl className="w-full">
                                <div className="flex w-full flex-row flex-wrap items-stretch justify-start gap-2 lg:flex-nowrap">
                                    <Input
                                        className={cn('w-full', className)}
                                        id={id || undefined}
                                        placeholder={placeholder}
                                        shape={shape || 'rounded-sm'}
                                        size={size || 'md'}
                                        type={type || 'text'}
                                        {...field}
                                    />
                                    {/* Save and Cancel Buttons */}
                                    {!isLoading && !isSaveDisabled && isEditing && (
                                        <div className="flex w-fit flex-row items-stretch justify-end gap-2 lg:justify-start">
                                            <Button
                                                className="h-full"
                                                color="primary"
                                                shape="rounded"
                                                size="md"
                                                type="submit"
                                                variant="solid"
                                            >
                                                Save
                                            </Button>
                                            <Button
                                                className="h-full"
                                                color="secondary"
                                                shape="rounded"
                                                size="md"
                                                type="button"
                                                variant="outlined"
                                                onClick={handleCancel}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    )}
                                    {isLoading && (
                                        <div className="flex w-fit flex-row items-stretch justify-end gap-2 lg:justify-start">
                                            <Button
                                                disabled
                                                className="h-full"
                                                color="primary"
                                                shape="rounded"
                                                size="md"
                                                variant="soft"
                                            >
                                                <span>Saving</span>
                                                <Spinner className="size-4 text-current" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </FormControl>
                            <FormMessage />
                            {description && <FormDescription>{description}</FormDescription>}
                        </FormItem>
                    )}
                />
            </form>
        </FormProvider>
    );
}
