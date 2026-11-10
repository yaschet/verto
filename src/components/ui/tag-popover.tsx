/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@components/ui/popover';
import { type Tag as TagType } from '@components/ui/tag-input';
import { TagList } from '@components/ui/tag-list';
import { cn } from '@library/utils';
import type { TagListProps } from '@components/ui/tag-list';

type TagPopoverProps = {
    children: React.ReactNode;
    tags: TagType[];
    customTagRenderer?: (tag: TagType) => React.ReactNode;
} & TagListProps;

export const TagPopover: React.FC<TagPopoverProps> = ({ children, customTagRenderer, tags, ...tagProps }) => {
    const { size } = tagProps;
    const popoverSize = size && size !== 'md' ? size : 'md';

    return (
        <Popover>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent className="w-full max-w-[450px] space-y-3" size={popoverSize}>
                <div className="space-y-1">
                    <h4 className="text-sm leading-none font-medium">Entered Tags</h4>
                    <p className={cn('text-muted text-left text-sm')}>These are the tags you've entered.</p>
                </div>
                <TagList customTagRenderer={customTagRenderer} tags={tags} {...tagProps} />
            </PopoverContent>
        </Popover>
    );
};
