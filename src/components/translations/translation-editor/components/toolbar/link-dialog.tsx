/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * LinkDialog Component
 * Full-featured link editor dialog replacing native window.prompt
 *
 * Uses CustomContent pattern from Storybook:
 * - Icon + Title layout with proper container
 * - Form fields with balanced spacing
 * - Cancel/Confirm actions
 *
 * Features:
 * - URL input (required)
 * - Display text input (optional - uses selection if empty)
 * - Open in new tab checkbox
 * - Nofollow checkbox
 * - Edit/Remove existing links
 */

'use client';

import { LinkIcon } from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type LinkData = {
    url: string;
    text?: string;
    openInNewTab: boolean;
    nofollow: boolean;
};

type LinkDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: LinkData) => void;
    onRemove?: () => void;
    initialUrl?: string;
    initialText?: string;
    initialTarget?: string | null;
    initialRel?: string | null;
    hasExistingLink?: boolean;
};

export function LinkDialog({
    hasExistingLink = false,
    initialRel = null,
    initialTarget = null,
    initialText = '',
    initialUrl = '',
    onOpenChange,
    onRemove,
    onSubmit,
    open,
}: LinkDialogProps) {
    const [url, setUrl] = useState(initialUrl);
    const [text, setText] = useState(initialText);
    const [openInNewTab, setOpenInNewTab] = useState(false);
    const [nofollow, setNofollow] = useState(false);

    // Reset form when dialog opens with new values
    useEffect(() => {
        if (open) {
            setUrl(initialUrl);
            setText(initialText);
            // Read existing attributes when editing
            setOpenInNewTab(initialTarget === '_blank');
            setNofollow(initialRel?.includes('nofollow') ?? false);
        }
    }, [open, initialUrl, initialText, initialTarget, initialRel]);

    const handleSubmit = useCallback(
        (e?: React.FormEvent) => {
            e?.preventDefault();
            if (url.trim()) {
                onSubmit({
                    url: url.trim(),
                    text: text.trim() || undefined,
                    openInNewTab,
                    nofollow,
                });
            }
            onOpenChange(false);
        },
        [url, text, openInNewTab, nofollow, onSubmit, onOpenChange],
    );

    const handleRemove = useCallback(() => {
        onRemove?.();
        onOpenChange(false);
    }, [onRemove, onOpenChange]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
            }
        },
        [handleSubmit],
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogTitle className="sr-only">{hasExistingLink ? 'Edit Link' : 'Add Link'}</DialogTitle>

                <div className="space-y-6">
                    {/* Icon + Title */}
                    <div className="flex items-center gap-4">
                        <div className="bg-primary-100 dark:bg-primary-900 flex size-12 items-center justify-center rounded-full">
                            <LinkIcon className="text-primary-600 dark:text-primary-400 size-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">
                                {hasExistingLink ? 'Edit Link' : 'Add Link'}
                            </h3>
                            <p className="text-muted-foreground text-sm">
                                {hasExistingLink
                                    ? 'Update the link URL and settings'
                                    : 'Add a hyperlink to the selected text'}
                            </p>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <form className="grid gap-4" onSubmit={handleSubmit}>
                        {/* URL Input */}
                        <div className="grid gap-2">
                            <Label className="text-sm font-medium" htmlFor="link-url">
                                URL
                            </Label>
                            <Input
                                autoFocus
                                id="link-url"
                                placeholder="https://example.com"
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>

                        {/* Display Text Input */}
                        <div className="grid gap-2">
                            <Label className="text-sm font-medium" htmlFor="link-text">
                                Display Text
                            </Label>
                            <Input
                                id="link-text"
                                placeholder="Link text (optional)"
                                type="text"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <p className="text-muted-foreground text-xs">
                                Leave empty to use the selected text
                            </p>
                        </div>

                        {/* Options */}
                        <div className="border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-900 rounded-lg border p-4">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        checked={openInNewTab}
                                        id="link-new-tab"
                                        onCheckedChange={(checked) => setOpenInNewTab(checked === true)}
                                    />
                                    <Label
                                        className="cursor-pointer text-sm font-normal"
                                        htmlFor="link-new-tab"
                                    >
                                        Open in new tab
                                    </Label>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        checked={nofollow}
                                        id="link-nofollow"
                                        onCheckedChange={(checked) => setNofollow(checked === true)}
                                    />
                                    <Label
                                        className="cursor-pointer text-sm font-normal"
                                        htmlFor="link-nofollow"
                                    >
                                        Add nofollow attribute
                                    </Label>
                                </div>
                            </div>
                        </div>
                    </form>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                        {hasExistingLink && onRemove ? (
                            <Button color="destructive" variant="plain" onClick={handleRemove}>
                                Remove Link
                            </Button>
                        ) : (
                            <div />
                        )}
                        <div className="flex gap-2">
                            <Button variant="outlined" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button disabled={!url.trim()} onClick={() => handleSubmit()}>
                                {hasExistingLink ? 'Update' : 'Add'} Link
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
