/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { ShieldCheckIcon, WarningIcon } from '@phosphor-icons/react';
import React from 'react';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@components/ui/alert';

type AlertSectionProps = {
    errorAlert: {
        error?: boolean;
        message: string;
        description: string;
    } | null;
    successAlert: {
        success?: boolean;
        message: string;
        description: string;
    } | null;
    onClose: () => void;
};

function AlertSection({ errorAlert, onClose, successAlert }: AlertSectionProps) {
    return (
        <>
            {/* Error Alert */}
            {errorAlert && errorAlert.error && (
                <Alert withCloseButton className="w-full" show={true} variant="destructive" onClose={onClose}>
                    <AlertIcon>
                        <WarningIcon className="size-5" color="currentColor" weight="duotone" />
                    </AlertIcon>
                    <AlertTitle>{errorAlert.message}</AlertTitle>
                    <AlertDescription>{errorAlert.description}</AlertDescription>
                </Alert>
            )}

            {/* Success Alert */}
            {successAlert && successAlert.success && (
                <Alert
                    withCloseButton
                    className="w-full"
                    show={true}
                    variant="success"
                    onClose={() => {
                        return;
                    }}
                >
                    <AlertIcon>
                        <ShieldCheckIcon className="size-5" color="currentColor" weight="duotone" />
                    </AlertIcon>
                    <AlertTitle>{successAlert.message}</AlertTitle>
                    <AlertDescription>{successAlert.description}</AlertDescription>
                </Alert>
            )}
        </>
    );
}

export default AlertSection;
