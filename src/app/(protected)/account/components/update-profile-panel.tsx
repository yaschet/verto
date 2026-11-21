/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { Fragment } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { changeUserEmail } from '@/src/actions/auth/change-user-email';
import { updateProfileInformation } from '@/src/actions/auth/update-profile-information';
import { generateGravatarProfileUrl, generateGravatarUrl } from '@/src/library/utils';
import { EditableInput } from '@app/(protected)/account/components/shared/editable-input';
import { PanelSection } from '@app/(protected)/account/components/shared/panel-section';
import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import { Button } from '@components/ui/button';
import { Skeleton } from '@components/ui/skeleton';
import { useUserData } from '@hooks/queries/auth/use-user-data';
import { getLogger } from '@services/logger';
import type { User } from '@supabase/supabase-js';

export default function UpdateProfilePanel() {
    return (
        <PanelSection
            description="Your email address is your identity on Verto and identifies your sign-in."
            title="Profile"
        >
            {/* Profile Content */}
            <UpdateProfile />
        </PanelSection>
    );
}

function UpdateProfile() {
    const logger = getLogger('PAGES:ACCOUNT:UPDATE-PROFILE-PANEL');

    // Auth State:
    const { data: userData } = useUserData();
    const { profile, user } = userData ?? {};

    function AvatarProvider() {
        const avatarUrl = profile?.avatar_url;

        const getProviderLink = (url: string) => {
            switch (true) {
                case url.includes('googleusercontent'):
                    return {
                        name: 'Google Account',
                        url: 'https://myaccount.google.com/',
                    };
                case url.includes('facebook'):
                    return {
                        name: 'Facebook Account',
                        url: 'https://www.facebook.com/me',
                    };
                default:
                    return {
                        name: 'Gravatar Account',
                        url: generateGravatarProfileUrl(user?.email ?? ''),
                    };
            }
        };

        const { name, url } = getProviderLink(avatarUrl ?? '');

        return (
            <div className="flex w-full flex-row gap-3">
                <p className="text-muted text-xs">
                    Manage your avatar using your{' '}
                    <a
                        className="text-accent font-bold hover:underline"
                        href={url}
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        {name}
                    </a>
                    .
                </p>
            </div>
        );
    }

    return (
        <Fragment>
            {profile && profile?.full_name && profile?.full_name !== 'N/A' && (
                <div className="flex w-full flex-col gap-4">
                    <div className="flex w-full flex-1 flex-row gap-6">
                        {/* Avatar */}
                        <Button
                            asChild
                            className="cursor-pointer overflow-hidden p-0"
                            color="secondary"
                            variant="plain"
                        >
                            <Avatar className="size-10">
                                <AvatarImage
                                    alt={profile?.full_name}
                                    src={profile?.avatar_url ?? generateGravatarUrl(profile?.email ?? '')}
                                />
                                <AvatarFallback name={profile?.full_name} />
                            </Avatar>
                        </Button>

                        {/* Email and Name Input Fields. */}
                        <div className="flex w-full flex-col gap-3">
                            <EditableInput
                                customZodSchema={z
                                    .string()
                                    .regex(
                                        /^[a-zA-Zà-úÀ-Ú]{2,}\s+[a-zA-Zà-úÀ-Ú\s]{2,}$/,
                                        'Invalid name format.',
                                    )}
                                id="full_name"
                                label="Full Name"
                                name="full_name"
                                placeholder="Your full name"
                                shape="rounded"
                                size="md"
                                type="text"
                                value={profile?.full_name ?? `${profile?.first_name} ${profile?.last_name}`}
                                onCancel={() => logger.info('Cancelled!')}
                                onSave={async (value) => {
                                    const nameParts = value.trim().split(' ');

                                    let firstName: string;
                                    let lastName: string;

                                    if (nameParts.length === 1) {
                                        firstName = nameParts[0];
                                        lastName = '';
                                    } else {
                                        firstName = nameParts.slice(0, -1).join(' ');
                                        lastName = nameParts.slice(-1).join(' ');
                                    }

                                    const result = await updateProfileInformation({
                                        ...(user ?? {}),
                                        user_metadata: {
                                            ...(user ?? {}),
                                            first_name: firstName,
                                            last_name: lastName,
                                        },
                                    } as User);

                                    if (result.error) {
                                        console.error(result);

                                        return toast.error(result.message ?? 'Unable to update name.', {
                                            description:
                                                result.description ??
                                                'There might be an issue from our end, please try again later, or contact support.',
                                        });
                                    }

                                    toast.success(result.message ?? 'Name updated successfully.', {
                                        description:
                                            result.description ?? `Your name has been updated to ${value}.`,
                                    });

                                    return value;
                                }}
                            />
                            <EditableInput
                                customZodSchema={z.string().email()}
                                id="email"
                                label="Email"
                                name="email"
                                placeholder="Your email address"
                                shape="rounded"
                                size="md"
                                type="email"
                                value={user?.email ?? ''}
                                onCancel={() => logger.info('Cancelled!')}
                                onSave={async (newEmail) => {
                                    const oldEmail = user?.email;

                                    if (oldEmail === newEmail) {
                                        toast.info('Email is the same, no changes made.');
                                        return newEmail;
                                    }

                                    const result = await changeUserEmail(newEmail);

                                    if (result.error) {
                                        console.error(result);

                                        return toast.error(result.message ?? 'Unable to update email.', {
                                            description:
                                                result.description ??
                                                'There might be an issue from our end, please try again later, or contact support.',
                                        });
                                    }

                                    toast.success(result.message ?? 'Email change request sent.', {
                                        description:
                                            result.description ??
                                            `Your email will be updated from "${oldEmail}" to "${newEmail}", we have sent a confirmation email to your new email address.`,
                                    });

                                    return newEmail;
                                }}
                            />

                            {/* Manage your avatar using Gravatar. */}
                            <AvatarProvider />
                        </div>
                    </div>
                </div>
            )}
            {!profile && (
                <div className="flex w-full flex-col gap-4">
                    <div className="flex w-full flex-row gap-6">
                        <Skeleton className="relative flex size-10 shrink-0 overflow-hidden rounded-xl" />
                        <div className="flex w-full flex-col gap-6">
                            <div className="flex w-full flex-col gap-3">
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="flex w-full flex-col gap-3">
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    </div>
                </div>
            )}
        </Fragment>
    );
}
