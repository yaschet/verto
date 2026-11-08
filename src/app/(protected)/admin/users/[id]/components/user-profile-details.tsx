/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import {
    BriefcaseIcon,
    IdentificationCardIcon,
    UserIcon,
    PhoneIcon,
    CalendarIcon,
    GlobeIcon,
    CheckCircleIcon,
    XCircleIcon,
    BuildingsIcon,
    TranslateIcon,
    ShieldIcon,
    ArrowRightIcon,
    CopyIcon,
    CoinIcon,
    SealCheckIcon,
    SealWarningIcon,
    BellIcon,
    UserCircleIcon,
} from '@phosphor-icons/react';
import * as countriesFlag from 'country-flag-icons/react/1x1';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { AdminUserDetails } from '@actions/admin/users/get-user';
import { Badge } from '@components/ui/badge';
import { DefaultCard } from '@components/ui/card';
import { ProfileField } from '@components/shared/profile-field';
import { AddressField } from '@components/shared/address-field';
import { cn } from '@library/utils';
import {
    AUTO_DETECT_LANGUAGE,
    AVAILABLE_SOURCE_LANGUAGES_WITH_AUTO,
    AVAILABLE_TARGET_LANGUAGES,
} from '@constants/translations';
import { MfaStatusDisplay } from './mfa-status-display';

// Language code to country code mapping for flags
const LANGUAGE_TO_COUNTRY: Record<string, string> = {
    en: 'US',
    fr: 'FR',
    es: 'ES',
    de: 'DE',
    it: 'IT',
    pt: 'PT',
    ru: 'RU',
    zh: 'CN',
    ja: 'JP',
    ko: 'KR',
    ar: 'SA',
    hi: 'IN',
    nl: 'NL',
    pl: 'PL',
    tr: 'TR',
    vi: 'VN',
    th: 'TH',
    id: 'ID',
    sv: 'SE',
    da: 'DK',
    fi: 'FI',
    no: 'NO',
    cs: 'CZ',
    el: 'GR',
    he: 'IL',
    ro: 'RO',
    hu: 'HU',
    sk: 'SK',
    uk: 'UA',
    bg: 'BG',
    hr: 'HR',
    lt: 'LT',
    lv: 'LV',
    et: 'EE',
    sl: 'SI',
    sr: 'RS',
    fa: 'IR',
    ur: 'PK',
    ms: 'MY',
    tl: 'PH',
    sw: 'KE',
    af: 'ZA',
    az: 'AZ',
    be: 'BY',
    bs: 'BA',
    ca: 'ES',
    ceb: 'PH',
    cy: 'GB',
    eo: 'EU',
    eu: 'ES',
    fil: 'PH',
    ga: 'IE',
    gl: 'ES',
    ht: 'HT',
    is: 'IS',
    iw: 'IL',
    jv: 'ID',
    kk: 'KZ',
    ky: 'KG',
    la: 'VA',
    mk: 'MK',
    mn: 'MN',
    mr: 'IN',
    mt: 'MT',
    ne: 'NP',
    ps: 'AF',
    sa: 'IN',
    sq: 'AL',
    uz: 'UZ',
    yi: 'IL',
    zu: 'ZA',
};

// Helper to get language display details
function getLanguageDetails(code: string | null | undefined, isSource: boolean = false) {
    if (!code || code === AUTO_DETECT_LANGUAGE) {
        return {
            name: 'Auto-detect',
            isAuto: true,
            countryCode: null,
        };
    }

    const list = isSource ? AVAILABLE_SOURCE_LANGUAGES_WITH_AUTO : AVAILABLE_TARGET_LANGUAGES;
    const lang = list.find(
        (l) => l.ids?.ISO_639_1 === code || (l.ids as { bcp_47_code?: string })?.bcp_47_code === code,
    );
    const countryCode = LANGUAGE_TO_COUNTRY[code.toLowerCase()] || code.toUpperCase();

    return {
        name: lang?.name || code.toUpperCase(),
        isAuto: false,
        countryCode,
    };
}

interface UserProfileDetailsProps {
    user: AdminUserDetails;
}

// Helper component for copyable fields
function CopyableField({ value, masked = false }: { value: string; masked?: boolean }) {
    const displayValue = masked ? `${value.slice(0, 4)}***${value.slice(-4)}` : value;

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        toast.success('Copied to clipboard');
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            className={cn(
                'flex items-center gap-2 rounded-lg transition-all duration-150',
                'px-2 py-1.5 -mx-2 -my-1.5',
                'hover:bg-surface-100/80 dark:hover:bg-surface-800/50',
                'group cursor-pointer text-left',
            )}
        >
            <code className="text-sm font-mono text-surface-600 dark:text-surface-400">{displayValue}</code>
            <CopyIcon className="size-4 text-surface-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
    );
}

// Helper component for notification badges
function NotificationBadge({ label, enabled }: { label: string; enabled: boolean | null }) {
    const isEnabled = enabled ?? true;
    return (
        <div
            className={cn(
                'flex items-center justify-between rounded-lg px-3 py-2',
                'bg-surface-50 dark:bg-surface-800/50',
            )}
        >
            <span className="text-sm">{label}</span>
            <Badge variant="soft" color={isEnabled ? 'success' : 'secondary'} className="text-xs">
                {isEnabled ? 'On' : 'Off'}
            </Badge>
        </div>
    );
}

export function UserProfileDetails({ user }: UserProfileDetailsProps) {
    const phoneHref = user.phone ? `tel:${user.phone.replace(/\D/g, '')}` : undefined;

    return (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Personal Information - primary (brand) */}
            <DefaultCard className="flex flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <div className="bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex size-12 shrink-0 items-center justify-center rounded-full">
                        <UserIcon className="size-6" weight="duotone" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Personal Information</h3>
                        <p className="text-surface-500 text-sm">Basic identity details</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-y-5 sm:grid-cols-2">
                    {/* Avatar & Name */}
                    <div className="sm:col-span-2 flex items-center gap-4">
                        {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="size-16 rounded-full object-cover" />
                        ) : (
                            <div className="size-16 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                                <UserCircleIcon className="size-8 text-surface-400" weight="duotone" />
                            </div>
                        )}
                        <div>
                            <p className="font-medium text-surface-900 dark:text-surface-100">
                                {user.full_name ||
                                    `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
                                    'No name'}
                            </p>
                            <p className="text-sm text-surface-500">{user.email}</p>
                        </div>
                    </div>

                    <ProfileField label="First name" value={user.first_name} emptyText="Not provided" />
                    <ProfileField label="Last name" value={user.last_name} emptyText="Not provided" />
                    <div className="sm:col-span-2">
                        <ProfileField
                            label="Date of birth"
                            value={
                                user.date_of_birth
                                    ? format(new Date(user.date_of_birth), 'MMMM do, yyyy')
                                    : null
                            }
                            icon={<CalendarIcon className="size-4" />}
                            emptyText="Not shared"
                        />
                    </div>
                </div>
            </DefaultCard>

            {/* Contact Information - info (blue) */}
            <DefaultCard className="flex flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <div className="bg-info-100 dark:bg-info-900/20 text-info-600 dark:text-info-400 flex size-12 shrink-0 items-center justify-center rounded-full">
                        <IdentificationCardIcon className="size-6" weight="duotone" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Contact Information</h3>
                        <p className="text-surface-500 text-sm">Address and phone</p>
                    </div>
                </div>

                <div className="space-y-5">
                    <AddressField
                        address={user.address}
                        city={user.city}
                        state={user.state}
                        zipCode={user.zip_code}
                        country={user.country}
                        emptyText="No address on file"
                    />
                    <ProfileField
                        label="Phone"
                        value={user.phone}
                        icon={<PhoneIcon className="size-4" />}
                        emptyText="No phone on file"
                        interactive
                        href={phoneHref}
                    />
                </div>
            </DefaultCard>

            {/* Professional Details - accent (blue variant) - FULL WIDTH */}
            <DefaultCard className="flex flex-col gap-6 p-6 lg:col-span-2">
                <div className="flex items-center gap-4">
                    <div className="bg-accent-100 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400 flex size-12 shrink-0 items-center justify-center rounded-full">
                        <BriefcaseIcon className="size-6" weight="duotone" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Professional Details</h3>
                        <p className="text-surface-500 text-sm">Work and expertise</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {/* Left Column */}
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <ProfileField
                                label="Company"
                                value={user.company_name}
                                icon={<BuildingsIcon className="size-4" />}
                                emptyText="No company listed"
                            />
                            <div>
                                <p className="text-surface-500 mb-1.5 text-sm font-medium">Experience</p>
                                <Badge
                                    variant="soft"
                                    color="secondary"
                                    className={cn(!user.translation_experience && 'opacity-60')}
                                >
                                    {user.translation_experience || 'Not specified'}
                                </Badge>
                            </div>
                        </div>

                        {/* Languages */}
                        <div>
                            <p className="text-surface-500 mb-1.5 text-sm font-medium">Default Languages</p>
                            {(() => {
                                const sourceLang = getLanguageDetails(user.source_language, true);
                                const targetLang = getLanguageDetails(user.target_language, false);
                                const SourceFlag = sourceLang.countryCode
                                    ? countriesFlag[sourceLang.countryCode as keyof typeof countriesFlag]
                                    : null;
                                const TargetFlag = targetLang.countryCode
                                    ? countriesFlag[targetLang.countryCode as keyof typeof countriesFlag]
                                    : null;

                                return (
                                    <div className="flex items-center gap-4 rounded-2xl bg-surface-100 p-4 dark:bg-surface-900">
                                        {/* Source Language */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-200 dark:bg-surface-800">
                                                {sourceLang.isAuto ? (
                                                    <GlobeIcon
                                                        className="size-5 text-surface-500"
                                                        weight="duotone"
                                                    />
                                                ) : SourceFlag ? (
                                                    <SourceFlag className="size-6 rounded" />
                                                ) : (
                                                    <GlobeIcon
                                                        className="size-5 text-surface-500"
                                                        weight="duotone"
                                                    />
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium text-surface-500">
                                                    Source
                                                </span>
                                                <span className="font-semibold text-surface-900 dark:text-surface-100">
                                                    {sourceLang.name}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Arrow */}
                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-200 dark:bg-surface-800">
                                            <ArrowRightIcon className="size-4 text-surface-500" />
                                        </div>

                                        {/* Target Language */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-200 dark:bg-surface-800">
                                                {TargetFlag ? (
                                                    <TargetFlag className="size-6 rounded" />
                                                ) : (
                                                    <TranslateIcon
                                                        className="size-5 text-surface-500"
                                                        weight="duotone"
                                                    />
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium text-surface-500">
                                                    Target
                                                </span>
                                                <span className="font-semibold text-surface-900 dark:text-surface-100">
                                                    {targetLang.name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Specializations */}
                        <div>
                            <p className="text-surface-500 mb-1.5 text-sm font-medium">Specializations</p>
                            <div
                                className={cn(
                                    'flex flex-wrap gap-2 rounded-lg transition-all duration-150',
                                    'px-2 py-1.5 -mx-2 -my-1.5',
                                    'hover:bg-surface-100/80 dark:hover:bg-surface-800/50',
                                )}
                            >
                                {Array.isArray(user.specializations) && user.specializations.length > 0 ? (
                                    (user.specializations as string[]).map((spec: string, i: number) => (
                                        <Badge key={i} variant="soft" color="primary" className="text-xs">
                                            {spec}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-surface-400 dark:text-surface-500 text-sm italic">
                                        No specializations
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-5">
                        {/* Qualifications */}
                        <div>
                            <p className="text-surface-500 mb-1.5 text-sm font-medium">Qualifications</p>
                            <div
                                className={cn(
                                    'flex flex-wrap gap-2 rounded-lg transition-all duration-150',
                                    'px-2 py-1.5 -mx-2 -my-1.5',
                                    'hover:bg-surface-100/80 dark:hover:bg-surface-800/50',
                                )}
                            >
                                {Array.isArray(user.qualifications) && user.qualifications.length > 0 ? (
                                    (user.qualifications as string[]).map((qual: string, i: number) => (
                                        <Badge key={i} variant="soft" color="secondary" className="text-xs">
                                            {qual}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-surface-400 dark:text-surface-500 text-sm italic">
                                        No qualifications listed
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Professional Affiliations */}
                        <div>
                            <p className="text-surface-500 mb-1.5 text-sm font-medium">
                                Professional affiliations
                            </p>
                            <div
                                className={cn(
                                    'flex flex-wrap gap-2 rounded-lg transition-all duration-150',
                                    'px-2 py-1.5 -mx-2 -my-1.5',
                                    'hover:bg-surface-100/80 dark:hover:bg-surface-800/50',
                                )}
                            >
                                {Array.isArray(user.professional_affiliations) &&
                                user.professional_affiliations.length > 0 ? (
                                    (user.professional_affiliations as string[]).map(
                                        (aff: string, i: number) => (
                                            <Badge
                                                key={i}
                                                variant="soft"
                                                color="secondary"
                                                className="text-xs"
                                            >
                                                {aff}
                                            </Badge>
                                        ),
                                    )
                                ) : (
                                    <span className="text-surface-400 dark:text-surface-500 text-sm italic">
                                        No affiliations listed
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DefaultCard>

            {/* Account Security - success (emerald) */}
            <DefaultCard className="flex flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <div className="bg-success-100 dark:bg-success-900/20 text-success-600 dark:text-success-400 flex size-12 shrink-0 items-center justify-center rounded-full">
                        <ShieldIcon className="size-6" weight="duotone" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Account Security</h3>
                        <p className="text-surface-500 text-sm">Activity and verification</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {/* Role */}
                    <div>
                        <p className="text-surface-500 mb-1.5 text-sm font-medium">Account role</p>
                        <div
                            className={cn(
                                'flex items-center gap-2 rounded-lg transition-all duration-150',
                                'px-2 py-1.5 -mx-2 -my-1.5',
                                'hover:bg-surface-100/80 dark:hover:bg-surface-800/50',
                            )}
                        >
                            <Badge variant="soft" color={user.role === 'ADMIN' ? 'destructive' : 'secondary'}>
                                {user.role || 'USER'}
                            </Badge>
                        </div>
                    </div>

                    {/* Credits Balance */}
                    <ProfileField
                        label="Credit balance"
                        value={user.credits?.toString() ?? '0'}
                        icon={<CoinIcon className="size-4" />}
                    />

                    {/* Status */}
                    <div>
                        <p className="text-surface-500 mb-1.5 text-sm font-medium">Status</p>
                        <div
                            className={cn(
                                'flex items-center gap-2 rounded-lg transition-all duration-150',
                                'px-2 py-1.5 -mx-2 -my-1.5',
                                'hover:bg-surface-100/80 dark:hover:bg-surface-800/50',
                            )}
                        >
                            <Badge variant="soft" color={user.status === 'ONLINE' ? 'success' : 'secondary'}>
                                {user.status || 'OFFLINE'}
                            </Badge>
                        </div>
                    </div>

                    {/* Profile Completion */}
                    <div>
                        <p className="text-surface-500 mb-1.5 text-sm font-medium">Profile status</p>
                        <div
                            className={cn(
                                'flex items-center gap-2 rounded-lg transition-all duration-150',
                                'px-2 py-1.5 -mx-2 -my-1.5',
                                'hover:bg-surface-100/80 dark:hover:bg-surface-800/50',
                            )}
                        >
                            <Badge
                                variant="soft"
                                color={user.is_profile_complete ? 'success' : 'warning'}
                                className="gap-1.5 pl-1.5"
                            >
                                {user.is_profile_complete ? (
                                    <>
                                        <SealCheckIcon className="size-4" weight="fill" /> Complete
                                    </>
                                ) : (
                                    <>
                                        <SealWarningIcon className="size-4" weight="fill" /> Incomplete
                                    </>
                                )}
                            </Badge>
                        </div>
                    </div>

                    <ProfileField
                        label="Joined"
                        value={user.created_at ? format(new Date(user.created_at), 'MMM do, yyyy') : null}
                        emptyText="Unknown"
                    />
                    <ProfileField
                        label="Last active"
                        value={
                            user.last_active_at ? format(new Date(user.last_active_at), 'MMM do, p') : null
                        }
                        emptyText="Never"
                    />

                    {/* Verification Status */}
                    <div className="sm:col-span-2">
                        <p className="text-surface-500 mb-1.5 text-sm font-medium">Verification status</p>
                        <div
                            className={cn(
                                'flex items-center gap-2 rounded-lg transition-all duration-150',
                                'px-2 py-1.5 -mx-2 -my-1.5',
                                'hover:bg-surface-100/80 dark:hover:bg-surface-800/50',
                            )}
                        >
                            {user.email ? (
                                <Badge variant="soft" color="success" className="gap-1.5 pl-1.5">
                                    <CheckCircleIcon className="size-4" weight="fill" />
                                    Email Verified
                                </Badge>
                            ) : (
                                <Badge variant="soft" color="destructive" className="gap-1.5 pl-1.5">
                                    <XCircleIcon className="size-4" weight="fill" />
                                    Unverified
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* MFA Status */}
                    <div className="sm:col-span-2">
                        <p className="text-surface-500 mb-1.5 text-sm font-medium">
                            Two-factor authentication
                        </p>
                        <MfaStatusDisplay userId={user.id} />
                    </div>

                    {/* User ID (Copyable) */}
                    <div className="sm:col-span-2">
                        <p className="text-surface-500 mb-1.5 text-sm font-medium">User ID</p>
                        <CopyableField value={user.id} />
                    </div>

                    {/* Stripe Customer ID (Masked, Copyable) */}
                    {user.stripe_customer_id && (
                        <div className="sm:col-span-2">
                            <p className="text-surface-500 mb-1.5 text-sm font-medium">Stripe customer</p>
                            <CopyableField value={user.stripe_customer_id} masked />
                        </div>
                    )}
                </div>
            </DefaultCard>

            {/* Notification Preferences - warning (amber) */}
            <DefaultCard className="flex flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <div className="bg-warning-100 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400 flex size-12 shrink-0 items-center justify-center rounded-full">
                        <BellIcon className="size-6" weight="duotone" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Notification Preferences</h3>
                        <p className="text-surface-500 text-sm">Email and alert settings</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <NotificationBadge
                        label="Email notifications"
                        enabled={user.notification_email_enabled}
                    />
                    <NotificationBadge
                        label="Translation complete"
                        enabled={user.notification_translation_complete}
                    />
                    <NotificationBadge
                        label="Translation failed"
                        enabled={user.notification_translation_failed}
                    />
                    <NotificationBadge
                        label="Ready for review"
                        enabled={user.notification_translation_review}
                    />
                    <NotificationBadge label="Low credit alerts" enabled={user.notification_credit_low} />
                    <NotificationBadge label="Product updates" enabled={user.notification_product_updates} />
                    <NotificationBadge label="Marketing emails" enabled={user.notification_marketing} />
                </div>
            </DefaultCard>
        </div>
    );
}
