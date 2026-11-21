/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import React from 'react';
import { Tag } from '@components/ui/tag';
import { type Tag as TagType } from '@components/ui/tag-input';
import { cn } from '@library/utils';
import type { TagProps } from '@components/ui/tag';

export type TagListProps = {
    tags: TagType[];
    customTagRenderer?: (tag: TagType) => React.ReactNode;
    direction?: TagProps['direction'];
} & Omit<TagProps, 'tagObj'>;

export const TagList: React.FC<TagListProps> = ({ customTagRenderer, direction, tags, ...tagProps }) => {
    return (
        <div
            className={cn('max-w-[450px] rounded-md', {
                'flex flex-col gap-2': direction === 'column',
                'flex flex-wrap gap-2': direction === 'row',
            })}
        >
            {}
            {tags.map((tagObj) =>
                customTagRenderer ? (
                    customTagRenderer(tagObj)
                ) : (
                    <Tag key={tagObj.id} tagObj={tagObj} {...tagProps} />
                ),
            )}
        </div>
    );
};
