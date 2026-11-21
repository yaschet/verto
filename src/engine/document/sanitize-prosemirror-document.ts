/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import type { JSONContent } from '@tiptap/core';
import { repairTableStructure } from './repair-table-structure';

/**
 * Valid ProseMirror node types that TipTap supports.
 * Any node type not in this list will be rejected.
 *
 * Note: keyValuePair is intentionally NOT in this list.
 * It gets converted to table during sanitization for better editability.
 */
/**
 * Inverts textAlign for RTL mode.
 * In RTL, CSS inverts left↔right, so we need to pre-invert the stored values.
 */
function invertAlignmentForRTL(alignment: string | null | undefined): string | null | undefined {
    if (!alignment) return alignment;
    if (alignment === 'left') return 'right';
    if (alignment === 'right') return 'left';
    return alignment; // center, justify stay the same
}

/**
 * Sanitizes a ProseMirror/TipTap document to ensure it's valid.
 * Removes empty text nodes, invalid node types, and ensures all nodes meet schema requirements.
 *
 * @param doc - The document to sanitize
 * @param direction - Optional text direction ('ltr' or 'rtl'). If 'rtl', textAlign values are inverted.
 * @returns Sanitized document that's safe for TipTap editor
 */
export function sanitizeProseMirrorDocument(input: unknown, direction?: 'ltr' | 'rtl'): JSONContent {
    const doc = input as JSONContent & { translatedContent?: JSONContent[] };
    const isRTL = direction === 'rtl';
    // If doc is null/undefined, return minimal valid document
    if (!doc) {
        return {
            type: 'doc',
            content: [
                {
                    type: 'paragraph',
                    content: [
                        {
                            type: 'text',
                            text: 'Translation content unavailable.',
                        },
                    ],
                },
            ],
        };
    }

    // Ensure doc has proper structure
    const sanitized: JSONContent = {
        type: 'doc',
        content: [],
    };

    // Get content array - handle both wrapped and unwrapped documents
    let contentArray: JSONContent[] = [];
    if (doc.type === 'doc' && Array.isArray(doc.content)) {
        contentArray = doc.content;
    } else if (doc.translatedContent && Array.isArray(doc.translatedContent)) {
        // Handle NormalisedDocument format
        contentArray = doc.translatedContent;
    } else if (Array.isArray(doc.content)) {
        contentArray = doc.content;
    } else if (Array.isArray(doc)) {
        contentArray = doc;
    }

    // Recursively sanitize nodes
    function sanitizeNode(node: JSONContent): JSONContent | null {
        if (!node || typeof node !== 'object') {
            return null;
        }

        // CRITICAL: Reject nodes with invalid or malformed types
        // This catches AI hallucinations like {"type": ": "} or {"type": ""}
        if (!node.type || typeof node.type !== 'string' || node.type.trim().length === 0) {
            console.warn('[sanitize] Rejecting node with invalid type:', node);
            return null;
        }

        // Reject malformed types that contain only special characters
        if (/^[\s:;,.\-_]+$/.test(node.type)) {
            console.warn('[sanitize] Rejecting malformed node type:', node.type);
            return null;
        }

        // Handle text nodes - CRITICAL: No empty text allowed!
        if (node.type === 'text') {
            const text = node.text || '';
            if (text.length === 0) {
                return null;
            }
            return {
                type: 'text',
                text: text,
                ...(node.marks && { marks: node.marks }),
            };
        }

        // Handle special node types that don't have content
        if (node.type === 'hardBreak' || node.type === 'thematicBreak') {
            return node;
        }

        // Handle keyValuePair nodes - convert to descriptionList

        // New format: descriptionList > descriptionItem > (descriptionTerm + descriptionValue)
        // Both term and value are content nodes for native ProseMirror editability.
        if (node.type === 'keyValuePair') {
            const key = node.attrs?.key || '';
            const value = node.attrs?.value || '';
            if (key.length === 0 && value.length === 0) {
                return null;
            }
            // Convert to single-item descriptionList
            return {
                type: 'descriptionList',
                content: [
                    {
                        type: 'descriptionItem',
                        content: [
                            {
                                type: 'descriptionTerm',
                                content: key ? [{ type: 'text', text: key }] : [{ type: 'text', text: ' ' }],
                            },
                            {
                                type: 'descriptionValue',
                                content: value
                                    ? [{ type: 'text', text: value }]
                                    : [{ type: 'text', text: ' ' }],
                            },
                        ],
                    },
                ],
            };
        }

        if (node.type === 'keyValueItem') {
            const label = node.attrs?.label || '';
            const sanitizedContent = node.content
                ? node.content.map(sanitizeNode).filter((n) => n !== null)
                : [];

            if (sanitizedContent.length === 0) {
                sanitizedContent.push({ type: 'text', text: ' ' });
            }

            // Convert to single-item descriptionList
            return {
                type: 'descriptionList',
                content: [
                    {
                        type: 'descriptionItem',
                        content: [
                            {
                                type: 'descriptionTerm',
                                content: label
                                    ? [{ type: 'text', text: label }]
                                    : [{ type: 'text', text: ' ' }],
                            },
                            {
                                type: 'descriptionValue',
                                content: sanitizedContent,
                            },
                        ],
                    },
                ],
            };
        }

        // Handle descriptionList nodes - pass through with validation
        if (node.type === 'descriptionList') {
            const sanitizedContent = node.content
                ? node.content.map(sanitizeNode).filter((n) => n !== null)
                : [];

            if (sanitizedContent.length === 0) {
                // Add a default empty item
                sanitizedContent.push({
                    type: 'descriptionItem',
                    content: [
                        { type: 'descriptionTerm', content: [{ type: 'text', text: ' ' }] },
                        { type: 'descriptionValue', content: [{ type: 'text', text: ' ' }] },
                    ],
                });
            }

            return {
                type: 'descriptionList',
                content: sanitizedContent,
            };
        }

        // Handle descriptionItem nodes
        if (node.type === 'descriptionItem') {
            const sanitizedContent = node.content
                ? node.content.map(sanitizeNode).filter((n) => n !== null)
                : [];

            // Ensure we have both term and value
            if (sanitizedContent.length < 2) {
                return {
                    type: 'descriptionItem',
                    content: [
                        { type: 'descriptionTerm', content: [{ type: 'text', text: ' ' }] },
                        { type: 'descriptionValue', content: [{ type: 'text', text: ' ' }] },
                    ],
                };
            }

            return {
                type: 'descriptionItem',
                content: sanitizedContent,
            };
        }

        // Handle descriptionTerm nodes
        if (node.type === 'descriptionTerm') {
            const sanitizedContent = node.content
                ? node.content.map(sanitizeNode).filter((n) => n !== null)
                : [];

            if (sanitizedContent.length === 0) {
                sanitizedContent.push({ type: 'text', text: ' ' });
            }

            return {
                type: 'descriptionTerm',
                content: sanitizedContent,
            };
        }

        // Handle descriptionValue nodes
        if (node.type === 'descriptionValue') {
            const sanitizedContent = node.content
                ? node.content.map(sanitizeNode).filter((n) => n !== null)
                : [];

            if (sanitizedContent.length === 0) {
                sanitizedContent.push({ type: 'text', text: ' ' });
            }

            return {
                type: 'descriptionValue',
                content: sanitizedContent,
            };
        }

        // Handle spacer nodes (custom type)
        if (node.type === 'spacer') {
            return {
                type: 'spacer',
                attrs: { height: node.attrs?.height || 20 },
            };
        }

        // Handle image nodes
        if (node.type === 'image') {
            return {
                type: 'image',
                attrs: {
                    src: node.attrs?.src || '',
                    alt: node.attrs?.alt || '',
                    title: node.attrs?.title || '',
                },
            };
        }

        // Handle table cell nodes - CRITICAL: Preserve colspan, rowspan, textAlign

        //

        // created before TableCellExtended/TableHeaderExtended were fixed to
        // always serialize colspan/rowspan (even when equal to default value 1).
        // With the extension fix, new documents will always have these attributes.
        if (node.type === 'tableCell' || node.type === 'tableHeader') {
            const sanitizedContent = node.content
                ? node.content.map(sanitizeNode).filter((n) => n !== null)
                : [];

            if (sanitizedContent.length === 0) {
                sanitizedContent.push({
                    type: 'paragraph',
                    content: [{ type: 'text', text: ' ' }],
                });
            }

            // Normalize alignment: accept both "align" and "textAlign", output "textAlign"
            // For RTL, invert the alignment so CSS inversion renders correctly
            let alignment = node.attrs?.textAlign || node.attrs?.align;
            if (isRTL) alignment = invertAlignmentForRTL(alignment);

            // ALWAYS include attrs with defaults for colspan, rowspan

            return {
                type: node.type,
                attrs: {
                    colspan: node.attrs?.colspan ?? 1,
                    rowspan: node.attrs?.rowspan ?? 1,
                    colwidth: node.attrs?.colwidth ?? null,
                    ...(alignment && { textAlign: alignment }),
                },
                content: sanitizedContent,
            };
        }

        // Handle heading nodes - preserve level and textAlign

        if (node.type === 'heading') {
            const sanitizedContent = node.content
                ? node.content.map(sanitizeNode).filter((n) => n !== null)
                : [];

            if (sanitizedContent.length === 0) {
                sanitizedContent.push({ type: 'text', text: ' ' });
            }

            // Normalize alignment: accept both "align" and "textAlign", output "textAlign"
            // For RTL, invert the alignment so CSS inversion renders correctly
            let alignment = node.attrs?.textAlign || node.attrs?.align;
            if (isRTL) alignment = invertAlignmentForRTL(alignment);

            return {
                type: 'heading',
                attrs: {
                    level: node.attrs?.level ?? 1,
                    ...(alignment && { textAlign: alignment }),
                },
                content: sanitizedContent,
            };
        }

        // Handle paragraph nodes - preserve textAlign

        if (node.type === 'paragraph') {
            const sanitizedContent = node.content
                ? node.content.map(sanitizeNode).filter((n) => n !== null)
                : [];

            if (sanitizedContent.length === 0) {
                sanitizedContent.push({ type: 'text', text: ' ' });
            }

            // Normalize alignment: accept both "align" and "textAlign", output "textAlign"
            // For RTL, invert the alignment so CSS inversion renders correctly
            let alignment = node.attrs?.textAlign || node.attrs?.align;
            if (isRTL) alignment = invertAlignmentForRTL(alignment);

            return {
                type: 'paragraph',
                ...(alignment && { attrs: { textAlign: alignment } }),
                content: sanitizedContent,
            };
        }

        // Handle footnote nodes (custom type)
        if (node.type === 'footnote') {
            const sanitizedContent = node.content
                ? node.content.map(sanitizeNode).filter((n) => n !== null)
                : [];

            if (sanitizedContent.length === 0) {
                sanitizedContent.push({ type: 'text', text: ' ' });
            }

            return {
                type: 'footnote',
                attrs: node.attrs || { id: 'footnote-1' },
                content: sanitizedContent,
            };
        }

        // Handle nodes with content arrays (generic handler for tables, lists, etc.)
        if (node.content && Array.isArray(node.content)) {
            const sanitizedContent = node.content.map(sanitizeNode).filter((n) => n !== null);

            // Skip empty containers (except listItem which needs placeholder)
            if (sanitizedContent.length === 0) {
                if (node.type === 'listItem') {
                    sanitizedContent.push({
                        type: 'paragraph',
                        content: [{ type: 'text', text: ' ' }],
                    });
                } else if (
                    !['table', 'tableRow', 'bulletList', 'orderedList', 'blockquote'].includes(node.type)
                ) {
                    return null;
                }
            }

            // Preserve attrs for all nodes that have them
            return {
                type: node.type,
                ...(node.attrs && { attrs: node.attrs }),
                content: sanitizedContent,
            };
        }

        // Pass through other node types with minimal sanitization
        return node;
    }

    // Sanitize all content nodes
    const sanitizedContent = contentArray.map(sanitizeNode).filter((n) => n !== null);

    // Ensure document is not empty
    if (sanitizedContent.length === 0) {
        sanitizedContent.push({
            type: 'paragraph',
            content: [
                {
                    type: 'text',
                    text: 'No content available.',
                },
            ],
        });
    }

    // Repair table structures to ensure valid rectangular grids
    // This fixes AI-generated tables with mismatched colspan/rowspan
    sanitized.content = sanitizedContent.map((node: JSONContent) => {
        if (node.type === 'table') {
            return repairTableStructure(node);
        }
        return node;
    });

    return sanitized;
}

/**
 * Validates if a document is valid for ProseMirror/TipTap.
 *
 * @param doc - The document to validate
 * @returns True if valid, false otherwise
 */
export function isValidProseMirrorDocument(input: unknown): boolean {
    const doc = input as JSONContent;
    if (!doc || typeof doc !== 'object') {
        return false;
    }

    if (doc.type !== 'doc' || !Array.isArray(doc.content)) {
        return false;
    }

    function validateNode(node: JSONContent): boolean {
        if (!node || typeof node !== 'object') {
            return false;
        }

        // Text nodes must have non-empty text
        if (node.type === 'text') {
            return typeof node.text === 'string' && node.text.length > 0;
        }

        // Nodes with content must have valid children
        if (node.content && Array.isArray(node.content)) {
            return node.content.every(validateNode);
        }

        // Other nodes are considered valid if they have a type
        return typeof node.type === 'string';
    }

    return doc.content.every(validateNode);
}
