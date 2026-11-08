/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { FacebookLogoIcon, GoogleLogoIcon } from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { toast } from 'sonner';
import { signInWithFacebook, signInWithGoogle } from '@/src/actions/auth/sign-in';
import { Button } from '@/src/components/ui/button';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { Provider } from '@supabase/supabase-js';

type OAuthComponentProps = {
    page: 'sign-in' | 'sign-up';
};

export function OAuthComponent({ page }: OAuthComponentProps) {
    const isSignUp: boolean = page === 'sign-up';
    const isSignIn: boolean = page === 'sign-in';
    const AlternativeVERB = isSignUp ? 'Sign In' : 'Sign Up';

    const signInWithGoogleMutation = useMutation<
        ApiResponseOrError<{
            provider: Provider;
            url: string;
        }>,
        ApiErrorType
    >({
        mutationFn: async () => {
            const response = await signInWithGoogle();

            if (response?.error || !response) {
                throw response;
            }

            if (response.code === 'OAUTH_REDIRECT' && response.data?.url) {
                window.location.href = response.data?.url;
            }

            return response;
        },
        onError: (error: (Error & Partial<ApiErrorType>) | ApiErrorType) => {
            toast.error(error.title ?? error.message ?? 'Oops! Something went wrong.', {
                description: error.description ?? 'We encountered an error while signing you in with Google.',
                id: 'sign-in-google',
            });
        },
        onMutate: async () => {
            toast.loading('Signing in with Google...', {
                description: 'Please wait while we sign you in with Google.',
                id: 'sign-in-google-loading',
            });
        },
        onSettled: () => {
            toast.dismiss('sign-in-google-loading');
        },
        onSuccess: (data) => {
            toast.warning(data.message ?? 'Redirecting you to Google...', {
                description: data.description ?? 'You will be prompted to sign in with your Google account.',
                icon: <GoogleLogoIcon className="size-5" color="currentColor" weight="bold" />,
                id: 'sign-in-google',
            });
        },
    });

    const signInWithFacebookMutation = useMutation({
        mutationFn: async () => {
            const response = await signInWithFacebook();

            if (response?.error || !response) {
                throw response;
            }

            if (response.code === 'OAUTH_REDIRECT' && response.data?.url) {
                window.location.href = response.data?.url;
            }

            return response;
        },
        onError: (error: (Error & Partial<ApiErrorType>) | ApiErrorType) => {
            toast.error(error.title ?? error.message ?? 'Oops! Something went wrong.', {
                description:
                    error.description ?? 'We encountered an error while signing you in with Facebook.',
                id: 'sign-in-facebook',
            });
        },
        onMutate: async () => {
            toast.loading('Signing in with Facebook...', {
                description: 'Please wait while we sign you in with Facebook.',
                id: 'sign-in-facebook-loading',
            });
        },
        onSettled: () => {
            toast.dismiss('sign-in-facebook-loading');
        },
        onSuccess: (response) => {
            toast.warning(response.message ?? 'Redirecting you to Facebook...', {
                description:
                    response.description ?? 'You will be prompted to sign in with your Facebook account.',
                icon: <FacebookLogoIcon className="size-5" color="currentColor" weight="bold" />,
                id: 'sign-in-facebook',
            });
        },
    });

    const handleSignInWithGoogle = async () => {
        signInWithGoogleMutation.mutate();
    };

    const handleSignInWithFacebook = async () => {
        signInWithFacebookMutation.mutate();
    };

    return (
        <div className="flex w-full flex-col items-center justify-center gap-5">
            {isSignUp && (
                <p className="text-surface-600 dark:text-surface-400 text-center text-sm font-light">
                    Already have an account?{' '}
                    <Link
                        className="text-primary-500 dark:text-primary-500 font-medium hover:underline"
                        href="/auth/sign-in"
                    >
                        {AlternativeVERB}
                    </Link>
                </p>
            )}

            {isSignIn && (
                <p className="text-surface-600 dark:text-surface-400 text-center text-sm font-light">
                    Don't have an account yet?{' '}
                    <Link
                        className="text-primary-500 dark:text-primary-500 font-medium hover:underline"
                        href="/auth/sign-up"
                    >
                        {AlternativeVERB}
                    </Link>
                </p>
            )}

            <div className="inline-flex w-full items-center justify-center">
                <hr className="bg-border my-2 h-px w-full border-0" />
                <span className="text-muted relative w-fit max-w-fit min-w-fit px-3 text-sm font-medium">
                    Or Continue With
                </span>
                <hr className="bg-border my-2 h-px w-full border-0" />
            </div>

            {/* Social Buttons */}
            <div className="flex w-full flex-row flex-wrap justify-between gap-2">
                <Button
                    className="w-full flex-1"
                    color="default"
                    disabled={signInWithFacebookMutation.isPending}
                    loading={signInWithGoogleMutation.isPending}
                    shape="rounded"
                    size="lg"
                    type="button"
                    variant="soft"
                    onClick={handleSignInWithGoogle}
                >
                    {!signInWithGoogleMutation.isPending && (
                        <>
                            <GoogleLogoIcon className="size-5" color="currentColor" weight="bold" />
                            <span className="text-sm">Google</span>
                        </>
                    )}
                    {signInWithGoogleMutation.isPending && <span className="text-sm">Signing in...</span>}
                </Button>
                <Button
                    className="w-full flex-1"
                    color="default"
                    disabled={signInWithGoogleMutation.isPending}
                    loading={signInWithFacebookMutation.isPending}
                    shape="rounded"
                    size="lg"
                    type="button"
                    variant="soft"
                    onClick={handleSignInWithFacebook}
                >
                    {!signInWithFacebookMutation.isPending && (
                        <>
                            <FacebookLogoIcon className="size-5" color="currentColor" weight="bold" />
                            <span className="text-sm">Facebook</span>
                        </>
                    )}
                    {signInWithFacebookMutation.isPending && <span className="text-sm">Signing in...</span>}
                </Button>
            </div>
        </div>
    );
}
