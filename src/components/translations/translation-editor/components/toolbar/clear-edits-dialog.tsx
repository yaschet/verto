/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * ClearEditsDialog Component
 * Confirmation dialog for clearing all user edits
 *
 * Uses CustomContent pattern from Storybook:
 * - Icon + Title layout
 * - Info box with explanation
 * - Cancel/Confirm actions
 */

'use client';

import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

type ClearEditsDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
};

export function ClearEditsDialog({ onConfirm, onOpenChange, open }: ClearEditsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle className="sr-only">Clear All Edits</DialogTitle>
                <div className="space-y-4">
                    {/* Icon + Title */}
                    <div className="flex items-center gap-4">
                        <div className="bg-primary-100 dark:bg-primary-900 flex size-12 items-center justify-center rounded-full">
                            <ArrowCounterClockwiseIcon className="text-primary-600 dark:text-primary-400 size-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Clear All Edits</h3>
                            <p className="text-muted-foreground text-sm">Restore the original translation</p>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-900 rounded-lg border p-4">
                        <p className="text-sm">
                            This will discard all your edits and restore the original machine translation.
                            Your changes will not be saved until you manually save.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                        <Button variant="outlined" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button onClick={onConfirm}>Clear Edits</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
