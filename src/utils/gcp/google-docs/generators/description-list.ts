/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { docs_v1 } from 'googleapis';
import {
    DescriptionListNode,
    ContentNode,
    TableNode,
    TableRowNode,
    TableCellNode,
    TextNode,
} from '@/engine/document/types';
import { generateTableRequests } from './table';

/**
 * Generates requests for a Description List (Key-Value Pairs).
 * Renders as a 2-column invisible table.
 * Left Column (Term): Bold, ~30% width.
 * Right Column (Value): Regular, ~70% width.
 */
export async function generateDescriptionListRequests(
    node: DescriptionListNode,
    startIndex: number,
    processNode: (
        node: ContentNode,
        index: number,
        options?: {
            skipTrailingNewline?: boolean;
            segmentId?: string;
            overrideFontSize?: number;
            overrideColor?: docs_v1.Schema$OptionalColor;
            isDocumentRtl?: boolean;
        },
    ) => Promise<{ requests: docs_v1.Schema$Request[]; length: number }>,
    options?: { segmentId?: string; overrideFontSize?: number; isDocumentRtl?: boolean },
): Promise<{ requests: docs_v1.Schema$Request[]; length: number }> {
    // 1. Convert DescriptionList to TableNode
    const tableNode: TableNode = {
        type: 'table',
        content: node.content.map((item) => {
            // item is DescriptionItemNode [Term, Value]
            const termNode = item.content[0];
            const valueNode = item.content[1];

            // Enforce Bold on Term Content
            const boldTermContent =
                termNode.content?.map((c) => {
                    if (c.type === 'text') {
                        return {
                            ...c,
                            marks: [...(c.marks || []), { type: 'bold' }],
                        } as TextNode;
                    }
                    return c;
                }) || [];

            // RTL: Swap column order (Value on left/col0, Term on right/col1)
            const termCell: TableCellNode = {
                type: 'tableCell',
                content: [
                    {
                        type: 'paragraph',
                        content: boldTermContent.length ? boldTermContent : [{ type: 'text', text: '' }],
                    },
                ],
            };
            const valueCell: TableCellNode = {
                type: 'tableCell',
                content: [
                    {
                        type: 'paragraph',
                        content: valueNode.content || [{ type: 'text', text: '' }],
                    },
                ],
            };

            return {
                type: 'tableRow',
                content: options?.isDocumentRtl ? [valueCell, termCell] : [termCell, valueCell],
            } as TableRowNode;
        }),
    };

    // 2. Generate Table Requests
    // We skip header styling because we want a clean list look, not a data table look.
    const tableResult = await generateTableRequests(tableNode, startIndex, processNode, {
        ...options,
        skipHeaderStyling: true,
        isDocumentRtl: options?.isDocumentRtl,
    });

    const requests = [...tableResult.requests];
    const locationProps = options?.segmentId ? { segmentId: options.segmentId } : {};

    // 3. Post-Processing styling

    // 3.1 Set Column Widths (30% / 70%)
    // Total Width assumed 504pt (standard margin-inclusive content area)
    // RTL: Swap widths (col0 = value = 70%, col1 = term = 30%)
    const termWidth = 150; // ~30%
    const valueWidth = 354; // ~70%
    const col0Width = options?.isDocumentRtl ? valueWidth : termWidth;
    const col1Width = options?.isDocumentRtl ? termWidth : valueWidth;

    // We can set this for the whole table at the start location
    requests.push({
        updateTableColumnProperties: {
            tableStartLocation: { index: startIndex + 1, ...locationProps },
            columnIndices: [0],
            tableColumnProperties: { width: { magnitude: col0Width, unit: 'PT' }, widthType: 'FIXED_WIDTH' },
            fields: 'width,widthType',
        },
    });

    requests.push({
        updateTableColumnProperties: {
            tableStartLocation: { index: startIndex + 1, ...locationProps },
            columnIndices: [1],
            tableColumnProperties: { width: { magnitude: col1Width, unit: 'PT' }, widthType: 'FIXED_WIDTH' },
            fields: 'width,widthType',
        },
    });

    // 3.2 Remove Borders (Make Invisible)
    // generateTableRequests adds a default border. We override it.
    requests.push({
        updateTableCellStyle: {
            tableRange: {
                tableCellLocation: {
                    tableStartLocation: { index: startIndex + 1, ...locationProps },
                    rowIndex: 0,
                    columnIndex: 0,
                },
                rowSpan: node.content.length,
                columnSpan: 2,
            },
            tableCellStyle: {
                borderTop: {
                    dashStyle: 'SOLID',
                    width: { magnitude: 0, unit: 'PT' },
                    color: { color: { rgbColor: { red: 0, green: 0, blue: 0 } } },
                },
                borderBottom: {
                    dashStyle: 'SOLID',
                    width: { magnitude: 0, unit: 'PT' },
                    color: { color: { rgbColor: { red: 0, green: 0, blue: 0 } } },
                },
                borderLeft: {
                    dashStyle: 'SOLID',
                    width: { magnitude: 0, unit: 'PT' },
                    color: { color: { rgbColor: { red: 0, green: 0, blue: 0 } } },
                },
                borderRight: {
                    dashStyle: 'SOLID',
                    width: { magnitude: 0, unit: 'PT' },
                    color: { color: { rgbColor: { red: 0, green: 0, blue: 0 } } },
                },
                paddingTop: { magnitude: 0, unit: 'PT' }, // Tighter vertical spacing for lists
                paddingBottom: { magnitude: 2, unit: 'PT' },
            },
            fields: 'borderTop,borderBottom,borderLeft,borderRight,paddingTop,paddingBottom',
        },
    });

    return {
        requests,
        length: tableResult.length,
    };
}
