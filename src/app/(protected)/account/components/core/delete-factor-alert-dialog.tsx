/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { TrashIcon, WarningIcon, XIcon } from '@phosphor-icons/react';
import { Fragment } from 'react';
import { titleCase } from 'title-case';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { Dispatch, SetStateAction } from 'react';

export default function DeleteFactorAlertDialog({
    deletionLoading,
    handleDeleteFactor,
    isDeletionModalOpen,
    isTheOnlyFactor = false,
    selectedFactorId,
    setIsDeletionModalOpen,
}: {
    isDeletionModalOpen: boolean;
    setIsDeletionModalOpen: Dispatch<SetStateAction<boolean>>;
    selectedFactorId: string | null;
    handleDeleteFactor: (factorId: string) => Promise<void>;
    deletionLoading: boolean;
    isTheOnlyFactor?: boolean;
}) {
    return (
        <AlertDialog open={isDeletionModalOpen} onOpenChange={setIsDeletionModalOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-start">
                        {titleCase('Are you absolutely sure?')}
                    </AlertDialogTitle>
                    {isTheOnlyFactor && (
                        <Fragment>
                            <div className="relative flex flex-col items-start justify-start gap-2 py-3 text-start">
                                <div className="flex items-start justify-start gap-3">
                                    <div className="bg-destructive-50 dark:bg-destructive-950/20 flex aspect-square h-8 w-auto items-center justify-center rounded-full">
                                        <WarningIcon
                                            className="text-destructive size-4"
                                            color="currentColor"
                                            weight="fill"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <h4 className="text-destructive text-start text-sm font-semibold">
                                            Multi-factor authentication will be disabled!
                                        </h4>
                                        <p className="text-muted text-start text-sm">
                                            There are no other factors that are set up once you delete this
                                            factor, as such your account is not protected by multi-factor
                                            authentication.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <AlertDialogDescription className="text-foreground dark:text-foreground-500 text-start text-sm">
                                Before deleting this factor, consider:
                            </AlertDialogDescription>
                            <ul
                                className="text-surface-500 marker:text-destructive list-disc space-y-1 px-4 py-2 text-start text-sm marker:font-bold"
                                role="list"
                            >
                                <li>Adding another authenticator app as a factor prior to deleting.</li>
                                <li>Ensure that your account does not need multi-factor authentication.</li>
                            </ul>
                        </Fragment>
                    )}
                    {!isTheOnlyFactor && (
                        <Fragment>
                            <div className="relative flex flex-col items-start justify-start gap-2 py-3 text-start">
                                <div className="flex items-start justify-start gap-3">
                                    <div className="bg-destructive-50 dark:bg-destructive-950/20 flex aspect-square h-8 w-auto items-center justify-center rounded-full">
                                        <WarningIcon
                                            className="text-destructive size-4"
                                            color="currentColor"
                                            weight="fill"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <h4 className="text-destructive text-start text-sm font-semibold">
                                            This action cannot be undone.
                                        </h4>
                                        <p className="text-muted text-start text-sm">
                                            This authenticator app cannot be used for multi-factor
                                            authentication when signing in to the dashboard.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <AlertDialogDescription className="text-foreground dark:text-foreground-500 text-start text-sm">
                                Before deleting this factor, consider:
                            </AlertDialogDescription>
                            <ul
                                className="text-surface-500 marker:text-destructive list-disc space-y-1 px-4 py-2 text-start text-sm marker:font-bold"
                                role="list"
                            >
                                <li>Your backup authenticator app is still available to use.</li>
                                <li>Adding another authenticator app thereafter as a backup.</li>
                            </ul>
                        </Fragment>
                    )}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel
                        color="default"
                        variant="soft"
                        onClick={() => setIsDeletionModalOpen(false)}
                    >
                        <XIcon className="size-4" color="currentColor" />
                        Cancel
                    </AlertDialogCancel>
                    {!deletionLoading && (
                        <Button
                            color="destructive"
                            variant="solid"
                            onClick={async () => {
                                if (!selectedFactorId) return;
                                await handleDeleteFactor(selectedFactorId);
                            }}
                        >
                            <TrashIcon className="size-4" color="currentColor" />
                            <span>Remove</span>
                        </Button>
                    )}
                    {deletionLoading && (
                        <Button disabled loading color="destructive" variant="solid">
                            Deleting
                        </Button>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
