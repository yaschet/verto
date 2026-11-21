/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { Check, CloudSun, LockLaminatedOpen, SignIn, Swap, UserCheck } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Fragment } from 'react';
import { Button } from '@components/ui/button';
import type { SearchParams } from '@/types/rest/common';

export default async function VerifyPage(props: { searchParams: Promise<SearchParams> }) {
    const searchParams = await props.searchParams;
    const confirmationUrl: string | null = (searchParams?.confirmation_url as string | null) ?? null;
    const type: string | null = (searchParams?.type as string | null) ?? null;

    // Advanced validation for confirmation link presence
    const isConfirmationLinkPresent = confirmationUrl && confirmationUrl.startsWith('http');

    if (!isConfirmationLinkPresent || !type) {
        setTimeout(() => {
            redirect('/auth/sign-in');
        }, 5000);
    }

    if (!isConfirmationLinkPresent || !type) {
        return (
            <div className="mx-auto flex h-auto flex-col items-center justify-center gap-2 lg:py-0">
                <div className="container flex w-full max-w-xl flex-col items-center justify-center">
                    <div className="mb-10 flex flex-col items-center justify-center gap-3">
                        <h1 className="text-surface-900 mb-2 text-center text-3xl leading-tight font-bold tracking-tight md:text-4xl dark:text-white">
                            Oops! Something Went Wrong 🤯
                        </h1>
                        <p className="text-surface-600 dark:text-surface-400 text-center font-medium">
                            It looks like the confirmation link you clicked might have expired or is
                            incorrect. These things happen, and we're here to help you get back on track.
                        </p>
                        <p className="text-surface-600 dark:text-surface-400 text-center font-medium">
                            We're redirecting you to the sign-in page where you can try confirming your
                            account again. If you're not automatically redirected, please click{' '}
                            <a className="font-bold text-sky-500 hover:underline" href="/auth/sign-in">
                                here
                            </a>{' '}
                            to proceed.
                        </p>
                        <p className="text-surface-600 dark:text-surface-400 text-center font-medium">
                            Need a hand? Our support team is here for you. Reach out to us at{' '}
                            <a
                                className="font-bold text-sky-500 hover:underline"
                                href="mailto:sample@example.com"
                            >
                                sample@example.com
                            </a>{' '}
                            and we'll assist you with any issues you're experiencing.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    let title;
    let description;
    let buttonLabel;

    switch (type) {
        case 'invite':
            title = "You're Invited! 💌";
            description = (
                <Fragment>
                    A warm welcome awaits you at <span className="font-bold">Verto</span>. A team member has
                    extended an invitation for you to join our community of professionals. We're thrilled at
                    the prospect of having you with us.
                </Fragment>
            );
            buttonLabel = (
                <Fragment>
                    <Check color="currentColor" weight="duotone" />
                    Accept Invitation
                </Fragment>
            );
            break;
        case 'email':
            title = 'Confirm Your Email Address! 📧';
            description = (
                <Fragment>
                    You're just one step away! To finalize the setup of your{' '}
                    <span className="font-bold">Verto</span> account, we need to confirm your email address.
                    By clicking the button below, you'll complete the email verification process.
                    <br />
                    {/* <span>&nbsp;</span> */}
                    <br />
                    This step is crucial for ensuring the security of your account and enabling you to receive
                    important updates and notifications from us directly. We appreciate your cotranslation in
                    keeping your account secure.
                </Fragment>
            );
            buttonLabel = (
                <Fragment>
                    <UserCheck color="currentColor" weight="duotone" />
                    Confirm Email
                </Fragment>
            );
            break;
        case 'recovery':
            title = 'Secure Your Account! 🔒';
            description = (
                <Fragment>
                    It seems you're in the process of resetting your password for{' '}
                    <span className="font-bold">Verto</span>. Security is a top priority for us, and we're
                    here to assist you every step of the way in securing your account.
                </Fragment>
            );
            buttonLabel = (
                <Fragment>
                    <LockLaminatedOpen color="currentColor" weight="duotone" />
                    Proceed with Password Reset
                </Fragment>
            );
            break;
        case 'magiclink':
            title = 'Seamless Login Awaits! 🪄';
            description = (
                <Fragment>
                    Experience the convenience of logging into <span className="font-bold">Verto</span> with a
                    magic link. This secure, one-click login method is designed to streamline your access
                    while keeping your account safe.
                </Fragment>
            );
            buttonLabel = (
                <Fragment>
                    <SignIn color="currentColor" weight="duotone" />
                    Use Magic Link to Login
                </Fragment>
            );
            break;
        case 'email_change':
            title = 'Update Your Email Address! 📧';
            description = (
                <Fragment>
                    You're on your way to changing your email address for{' '}
                    <span className="font-bold">Verto</span>. Keeping your contact information up-to-date
                    ensures that you never miss out on important updates and opportunities.
                </Fragment>
            );
            buttonLabel = (
                <Fragment>
                    <Swap color="currentColor" weight="duotone" />
                    Confirm Email Update
                </Fragment>
            );
            break;
        default:
            title = 'Welcome to Verto! 🎉';
            description = (
                <p>
                    You're about to embark on a journey with <span className="font-bold">Verto</span>, the
                    leading platform for professional translators. We're excited to support you in exploring
                    new opportunities and expanding your professional horizons.
                </p>
            );
            buttonLabel = (
                <Fragment>
                    <CloudSun color="currentColor" weight="duotone" />
                    Begin Your Journey
                </Fragment>
            );
            break;
    }

    return (
        <div className="mx-auto flex h-auto flex-col items-center justify-center gap-2 lg:py-0">
            <div className="container flex w-full max-w-xl flex-col items-center justify-center">
                <div className="mb-10 flex flex-col items-center justify-center gap-3">
                    <h1 className="text-surface-900 mb-2 text-center text-3xl leading-tight font-bold tracking-tight md:text-4xl dark:text-white">
                        {title}
                    </h1>
                    <p className="text-surface-600 dark:text-surface-400 text-center font-medium">
                        {description}
                    </p>
                    <div className="mt-3 flex w-full flex-col items-center justify-center gap-2">
                        <Button
                            asChild
                            className="w-full"
                            color="default"
                            size="lg"
                            type="submit"
                            variant="solid"
                        >
                            <Link passHref href={confirmationUrl ?? '/'}>
                                {buttonLabel}
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="text-muted dark:text-muted w-full gap-1 text-center text-sm font-medium">
                    <Link href="/auth/sign-in">
                        <span className="text-muted dark:text-muted text-sm font-medium hover:underline">
                            Go to login
                        </span>
                    </Link>{' '}
                    or{' '}
                    <Link href="/auth/sign-up">
                        <span className="text-muted dark:text-muted text-sm font-medium hover:underline">
                            Create an account
                        </span>
                    </Link>
                    .
                </div>
            </div>
        </div>
    );
}
