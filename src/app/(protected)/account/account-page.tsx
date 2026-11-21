/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { checkIfUserHasPassword } from '@/src/actions/auth/change-user-password';
import ChangePasswordPanel from '@app/(protected)/account/components/change-password-panel';
import CloseAccountPanel from '@app/(protected)/account/components/close-account-panel';
import MultiFactorPanel from '@app/(protected)/account/components/mfa-panel';
import UpdateProfilePanel from '@app/(protected)/account/components/update-profile-panel';

export default async function AccountPageContent() {
    const hasPassword = await checkIfUserHasPassword();

    return (
        <div className="flex w-full max-w-screen-lg flex-col gap-6 py-6">
            <ul className="flex w-full flex-col items-start justify-start gap-12">
                <UpdateProfilePanel />
                <ChangePasswordPanel {...{ hasPassword }} />
                <MultiFactorPanel />
                <CloseAccountPanel />
            </ul>
        </div>
    );
}
