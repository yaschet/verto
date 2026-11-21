/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useZodResolver } from '@/src/hooks/use-zod-resolver';
import { UserMinusIcon, XIcon } from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next-nprogress-bar';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { closeUserAccount } from '@/src/actions/auth/close-user-account';
import { signOut } from '@/src/actions/auth/sign-out';
import { PanelSection } from '@app/(protected)/account/components/shared/panel-section';
import { Button } from '@components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@components/ui/dialog';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@components/ui/drawer';
import { FormField, FormItem, FormMessage } from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import Spinner from '@components/ui/spinner';
import { useMediaQuery } from '@hooks/use-media-query';
import { cn } from '@library/utils';
import type { ApiErrorType } from '@/types/rest/errors';

export default function CloseAccountPanel() {
    return (
        <PanelSection
            description={
                <span className="text-muted flex flex-col items-start justify-start gap-2 text-sm">
                    <span>
                        Once you close your account, all your data will be permanently deleted. Please be
                        certain.
                    </span>
                    <span>
                        <strong>Warning:</strong> Closing your account is irreversible.
                    </span>
                </span>
            }
            title={<span className="text-destructive-500">Close Account</span>}
        >
            <CloseAccountDialog />
        </PanelSection>
    );
}

function CloseAccountDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const isDesktop = useMediaQuery('(min-width: 768px)');

    if (isDesktop) {
        return (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button className="w-fit" color="destructive" type="button" variant="solid">
                        <XIcon aria-hidden="true" className="size-5" color="currentColor" weight="duotone" />
                        Close Account
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Close Account</DialogTitle>
                        <DialogDescription>
                            Closing your account is irreversible. Enter your Verto password to confirm you
                            want to permanently close this account:
                        </DialogDescription>
                    </DialogHeader>
                    <PasswordForm isDesktop={isDesktop} setOpen={setIsOpen} />
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
                <Button className="w-fit" color="destructive" type="button" variant="soft">
                    Close Account
                </Button>
            </DrawerTrigger>
            <DrawerContent>
                <DrawerHeader className="text-left">
                    <DrawerTitle>Close Account</DrawerTitle>
                    <DrawerDescription>
                        <span>Closing your account is irreversible.</span>
                        <br />
                        <span>
                            Enter your Verto password to confirm you want to permanently close this account:
                        </span>
                    </DrawerDescription>
                </DrawerHeader>
                <PasswordForm className="px-4" isDesktop={isDesktop} setOpen={setIsOpen} />
                <DrawerFooter className="pt-2">
                    <DrawerClose asChild>
                        <Button color="secondary" variant="outlined">
                            Cancel
                        </Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}

function PasswordForm({
    className,
    isDesktop: _,
    setOpen,
}: {
    className?: string;
    setOpen: (open: boolean) => void;
    isDesktop: boolean;
}) {
    const router = useRouter();

    const passwordSchema = z.object({
        password: z.string().min(1, 'Password is required.'),
    });

    const form = useForm<z.infer<typeof passwordSchema>>({
        defaultValues: {
            password: '',
        },
        mode: 'all',
        resolver: useZodResolver(passwordSchema),
    });

    const { isPending, mutateAsync } = useMutation({
        mutationFn: async (password: string) => {
            const response = await closeUserAccount({ password });
            if (response?.error || !response) {
                throw response;
            }
            return response;
        },
        onError: (error: (Error & Partial<ApiErrorType>) | ApiErrorType) => {
            form.setError('password', {
                message: error.title ?? error.message ?? 'Error closing account.',
                type: 'manual',
            });
        },
        onSuccess: async (response) => {
            toast(response.message ?? 'Account closed successfully.', {
                description: response.description ?? null,
            });
            form.reset();
            await signOut();
            setOpen(false);
            return router.push('/auth/sign-in');
        },
    });

    const handleAccountClosure = async (data: z.infer<typeof passwordSchema>) => {
        await mutateAsync(data.password);
    };

    return (
        <FormProvider {...form}>
            <form
                className={cn('grid items-start gap-4', className)}
                onSubmit={form.handleSubmit(handleAccountClosure)}
            >
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => {
                        return (
                            <FormItem>
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    autoFocus={form.formState.isDirty}
                                    className={cn(
                                        'focus:border-destructive-500 dark:focus:border-destructive-500',
                                    )}
                                    hasError={!!form.formState.errors.password}
                                    id="password"
                                    placeholder="Enter your password"
                                    shape="rounded"
                                    size="md"
                                    type="password"
                                    {...field}
                                />
                                <FormMessage />
                            </FormItem>
                        );
                    }}
                />

                {!isPending && (
                    <Button color="destructive" type="submit" variant="solid">
                        <UserMinusIcon
                            aria-hidden="true"
                            className="size-5"
                            color="currentColor"
                            weight="duotone"
                        />
                        Close Account
                    </Button>
                )}

                {isPending && (
                    <Button disabled color="destructive" shape="rounded" size="md" variant="solid">
                        <span>Closing Account</span>
                        <Spinner className="size-4 text-current" />
                    </Button>
                )}
            </form>
        </FormProvider>
    );
}
