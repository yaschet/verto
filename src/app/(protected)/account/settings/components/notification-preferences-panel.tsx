/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { PanelSection } from '@app/(protected)/account/components/shared/panel-section';
import { Label } from '@components/ui/label';
import { Separator } from '@components/ui/separator';
import { Skeleton } from '@components/ui/skeleton';
import { Switch } from '@components/ui/switch';
import { useUserData } from '@hooks/queries/auth/use-user-data';
import { useUpdateNotificationPreferences } from '@hooks/queries/notifications/use-update-notification-preferences';
import type { NotificationPreferences } from '@/src/actions/services/notifications/update-notification-preferences';

export default function NotificationPreferencesPanel() {
    return (
        <PanelSection
            vertical
            description="Manage how and when you receive notifications about your translations and account activity."
            title="Notification Preferences"
        >
            <NotificationPreferencesContent />
        </PanelSection>
    );
}

function NotificationPreferencesContent() {
    const { data: userData, isLoading } = useUserData();
    const profile = userData?.profile;

    const { schedulePreferenceUpdate } = useUpdateNotificationPreferences();

    const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
        // Schedule optimistic update + batched save
        // Cache will be updated immediately via mutation.onMutate
        schedulePreferenceUpdate({ [key]: value });
    };

    // Don't render until we have profile data to avoid hydration mismatch
    if (isLoading || !profile) {
        return (
            <div className="flex w-full flex-col gap-6">
                {/* Master Email Toggle Skeleton */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-1 flex-col gap-1">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-64" />
                    </div>
                    <Skeleton className="h-5 w-8 rounded-full" />
                </div>

                <Separator />

                {/* Translation Events Section Skeleton */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-80" />
                    </div>

                    <div className="flex flex-col gap-3">
                        {/* 4 toggle skeletons */}
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between gap-4">
                                <div className="flex flex-1 flex-col gap-1">
                                    <Skeleton className="h-4 w-36" />
                                    <Skeleton className="h-3 w-56" />
                                </div>
                                <Skeleton className="h-5 w-8 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>

                <Separator />

                {/* Updates & Marketing Section Skeleton */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-72" />
                    </div>

                    <div className="flex flex-col gap-3">
                        {/* 2 toggle skeletons */}
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between gap-4">
                                <div className="flex flex-1 flex-col gap-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-64" />
                                </div>
                                <Skeleton className="h-5 w-8 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Now we have profile data - use actual values without fallbacks
    const emailEnabled = profile.notification_email_enabled;

    return (
        <div className="flex w-full flex-col gap-6">
            {/* Master Email Toggle */}
            <NotificationToggle
                checked={emailEnabled}
                description="Receive email notifications for important events"
                label="Email Notifications"
                onCheckedChange={(checked) => handleToggle('notification_email_enabled', checked)}
            />

            <Separator />

            {/* Translation Events Section */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                    <h3 className="text-foreground text-sm font-semibold">Translation Events</h3>
                    <p className="text-muted-foreground text-xs">
                        Get notified about the status of your translation jobs
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <NotificationToggle
                        checked={profile.notification_translation_complete}
                        description="When your translation is ready for review"
                        disabled={!emailEnabled}
                        label="Translation Complete"
                        onCheckedChange={(checked) =>
                            handleToggle('notification_translation_complete', checked)
                        }
                    />

                    <NotificationToggle
                        checked={profile.notification_translation_failed}
                        description="When a translation fails (credits will be refunded)"
                        disabled={!emailEnabled}
                        label="Translation Failed"
                        onCheckedChange={(checked) =>
                            handleToggle('notification_translation_failed', checked)
                        }
                    />

                    <NotificationToggle
                        checked={profile.notification_translation_review}
                        description="When your translation needs manual review"
                        disabled={!emailEnabled}
                        label="Ready for Review"
                        onCheckedChange={(checked) =>
                            handleToggle('notification_translation_review', checked)
                        }
                    />

                    <NotificationToggle
                        checked={profile.notification_credit_low}
                        description="When your credit balance falls below 10 credits"
                        disabled={!emailEnabled}
                        label="Credit Balance Low"
                        onCheckedChange={(checked) => handleToggle('notification_credit_low', checked)}
                    />
                </div>
            </div>

            <Separator />

            {/* Updates & Marketing Section */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                    <h3 className="text-foreground text-sm font-semibold">Updates & Marketing</h3>
                    <p className="text-muted-foreground text-xs">
                        Stay informed about new features and special offers
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <NotificationToggle
                        checked={profile.notification_product_updates}
                        description="New features, improvements, and platform announcements"
                        disabled={!emailEnabled}
                        label="Product Updates"
                        onCheckedChange={(checked) => handleToggle('notification_product_updates', checked)}
                    />

                    <NotificationToggle
                        checked={profile.notification_marketing}
                        description="Tips, guides, promotions, and special offers"
                        disabled={!emailEnabled}
                        label="Marketing Emails"
                        onCheckedChange={(checked) => handleToggle('notification_marketing', checked)}
                    />
                </div>
            </div>

            {!emailEnabled && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                        <strong>Email notifications are disabled.</strong> You will not receive any emails
                        about your translations or account activity. Security emails (password resets, email
                        changes) will still be sent.
                    </p>
                </div>
            )}
        </div>
    );
}

function NotificationToggle({
    checked,
    description,
    disabled,
    label,
    onCheckedChange,
}: {
    label: string;
    description: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
                <Label className={disabled ? 'text-muted-foreground' : ''} htmlFor={label}>
                    {label}
                </Label>
                <p className="text-muted-foreground text-xs">{description}</p>
            </div>
            <Switch checked={checked} disabled={disabled} id={label} onCheckedChange={onCheckedChange} />
        </div>
    );
}
