/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useZodResolver } from '@/src/hooks/use-zod-resolver';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next-nprogress-bar';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { PasswordSignInSchema } from '@/schemas/auth-schemas';
import { signInWithPassword } from '@/src/actions/auth/sign-in';
import { getQueryClient } from '@queries/tanstack/query-client';
import type { SignInWithPasswordResponse } from '@/src/actions/auth/sign-in';
import type { ApiError } from '@/src/errors/api-errors';
import type { ApiErrorType } from '@/types/rest/errors';
// Adjust the import based on your router

type UseSignInProps = {
    router?: ReturnType<typeof useRouter>;
    forgotPasswordUrl: string;
};

type AlertState = {
    success?: boolean;
    error?: boolean;
    message: string;
    description: string;
};

const useSignIn = (
    { forgotPasswordUrl, router }: UseSignInProps = {
        forgotPasswordUrl: '/auth/forgot-password',
    },
) => {
    const nextRouter = useRouter();
    const routerInstance = router ?? nextRouter;
    const queryClient = getQueryClient();

    const resolver = useZodResolver(PasswordSignInSchema);

    // Form Hook
    const formMethods = useForm<z.infer<typeof PasswordSignInSchema>>({
        defaultValues: {
            email: '',
            password: '',
        },
        mode: 'all',
        resolver,
    });

    const { watch } = formMethods;

    // Alert States:
    const [errorAlert, setErrorAlert] = useState<AlertState | null>(null);
    const [successAlert, setSuccessAlert] = useState<AlertState | null>(null);

    // Forgot Password URL:
    const [resolvedForgotPasswordUrl, setResolvedForgotPasswordUrl] = useState<string>(forgotPasswordUrl);

    // Mutation Hook:
    const { isPending, mutateAsync: mutateSignIn } = useMutation<
        SignInWithPasswordResponse,
        ApiErrorType,
        { email: string; password: string }
    >({
        mutationFn: async ({ email, password }) => {
            const result = await signInWithPassword({ email, password });

            if (result.error === true) {
                throw result;
            }

            return result;
        },
        onError: (error: ApiError | ApiErrorType) => {
            setErrorAlert({
                error: true,
                message: error.title ?? error.message ?? 'Sign in failed!',
                description: error.description ?? 'An error occurred while signing in, please try again.',
            });
        },
        onSuccess: (response: SignInWithPasswordResponse) => {
            setSuccessAlert({
                success: true,
                message: 'Sign in successful!',
                description: 'You can now access your account.',
            });

            queryClient.setQueryData(['user-profile-query'], {
                user: response.data?.user ?? null,
                profile: response.data?.profile ?? null,
            });

            routerInstance?.refresh();
            routerInstance?.push('/app/dashboard');
        },
        onMutate: () => {
            setErrorAlert(null);
            setSuccessAlert(null);
        },
        retry: 0,
    });

    // Effect to update Forgot Password URL based on email validity:
    useEffect(() => {
        const subscription = watch((value) => {
            const email = value.email;
            const isValidEmail = z.string().email().safeParse(email).success;
            if (isValidEmail) {
                setResolvedForgotPasswordUrl(`${forgotPasswordUrl}?email=${email}`);
            } else {
                setResolvedForgotPasswordUrl(forgotPasswordUrl);
            }
        });

        return () => subscription.unsubscribe();
    }, [watch, forgotPasswordUrl]);

    // Submission Handler:
    const handleFinalSubmit = useCallback(
        async (data: z.infer<typeof PasswordSignInSchema>) => {
            await mutateSignIn(data)
                .then(() => {
                    // Do nothing
                })
                .catch(() => {
                    // Do nothing
                });
        },
        [mutateSignIn],
    );

    return {
        formMethods,
        errorAlert,
        successAlert,
        resolvedForgotPasswordUrl,
        handleFinalSubmit,
        isPending,
        onClose: () => {
            setErrorAlert(null);
            setSuccessAlert(null);
        },
    };
};

export { useSignIn };
