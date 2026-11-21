/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

// src/schemas/document/refinement-schema.ts
// Zod schemas for normalised ProseMirror/TipTap document structure
// Used with OpenAI's structured output to guarantee schema compliance

import { z } from 'zod';

/**
 * Mark Schema - Text formatting marks.
 */
export const NormalisedMarkSchema = z
    .object({
        type: z
            .enum(['bold', 'italic', 'underline', 'strikethrough'])
            .describe('Specifies the type of text formatting applied.'),
    })
    .strict()
    .describe('Schema defining text formatting marks.');

/**
 * TextNode Schema - Inline text content with optional marks.
 */
export const NormalisedTextNodeSchema = z
    .object({
        type: z.literal('text').describe("Node type, always 'text' for text nodes."),
        text: z.string().describe('The textual content.'),
        marks: z
            .union([z.array(NormalisedMarkSchema), z.null()])
            .describe('Formatting marks applied to the text, if any.'),
    })
    .strict()
    .describe('Schema for a text node containing text and optional formatting marks.');

/**
 * Forward declaration for ContentNodeSchema to handle recursion.
 */
// eslint-disable-next-line prefer-const
export let NormalisedContentNodeSchema: z.ZodTypeAny;

/**
 * ParagraphNode Schema - Block-level paragraph container.
 */
export const NormalisedParagraphNodeSchema = z
    .object({
        type: z.literal('paragraph').describe("Node type, always 'paragraph' for paragraph nodes."),
        attrs: z
            .union([
                z.object({
                    align: z
                        .enum(['left', 'center', 'right', 'justify'])
                        .describe('Text alignment within the paragraph.'),
                }),
                z.null(),
            ])
            .describe('Attributes of the paragraph, such as alignment.'),
        content: z
            .array(z.lazy(() => NormalisedContentNodeSchema))
            .describe('Content nodes within the paragraph.'),
    })
    .strict()
    .describe('Schema for a paragraph node containing aligned content.');

/**
 * HeadingNode Schema - Block-level heading with level 1-6.
 */
export const NormalisedHeadingNodeSchema = z
    .object({
        type: z.literal('heading').describe("Node type, always 'heading' for heading nodes."),
        attrs: z
            .union([
                z.object({
                    level: z.number().describe('Heading level, from 1 (highest) to 6 (lowest).'),
                    align: z
                        .enum(['left', 'center', 'right', 'justify'])
                        .describe('Text alignment within the heading.'),
                }),
                z.null(),
            ])
            .describe('Attributes of the heading, including level and alignment.'),
        content: z
            .array(z.lazy(() => NormalisedContentNodeSchema))
            .describe('Content nodes within the heading.'),
    })
    .strict()
    .describe('Schema for a heading node with level and alignment.');

/**
 * ListNode Schema - Bullet or ordered list container.
 */
export const NormalisedListNodeSchema = z
    .object({
        type: z
            .enum(['bulletList', 'orderedList'])
            .describe("Type of list, either 'bulletList' for unordered or 'orderedList' for ordered lists."),
        attrs: z
            .union([
                z.object({
                    order: z.number().describe('Starting number for ordered lists.'),
                }),
                z.null(),
            ])
            .describe('Attributes of the list, such as order.'),
        content: z.array(z.lazy(() => NormalisedContentNodeSchema)).describe('List items within the list.'),
    })
    .strict()
    .describe('Schema for list nodes, supporting both unordered and ordered lists.');

/**
 * ListItemNode Schema - Individual list item.
 */
export const NormalisedListItemNodeSchema = z
    .object({
        type: z.literal('listItem').describe("Node type, always 'listItem' for list item nodes."),
        content: z
            .array(z.lazy(() => NormalisedContentNodeSchema))
            .describe('Content nodes within the list item.'),
    })
    .strict()
    .describe('Schema for a list item node containing content.');

/**
 * TableCellNode Schema - Individual table cell with span attributes.
 */
export const NormalisedTableCellNodeSchema = z
    .object({
        type: z.literal('tableCell').describe("Node type, always 'tableCell' for table cells."),
        attrs: z
            .union([
                z.object({
                    colspan: z.number().describe('Number of columns the cell spans.'),
                    rowspan: z.number().describe('Number of rows the cell spans.'),
                    align: z
                        .enum(['left', 'center', 'right', 'justify'])
                        .describe('Text alignment within the table cell.'),
                }),
                z.null(),
            ])
            .describe('Attributes of the table cell, such as colspan and rowspan.'),
        content: z.array(NormalisedParagraphNodeSchema).describe('Paragraph content within the table cell.'),
    })
    .strict()
    .describe('Schema for a table cell node with attributes and content.');

/**
 * TableRowNode Schema - Table row containing cells.
 */
export const NormalisedTableRowNodeSchema = z
    .object({
        type: z.literal('tableRow').describe("Node type, always 'tableRow' for table rows."),
        content: z.array(NormalisedTableCellNodeSchema).describe('Table cells within the table row.'),
    })
    .strict()
    .describe('Schema for a table row node containing table cells.');

/**
 * TableNode Schema - Table container.
 */
export const NormalisedTableNodeSchema = z
    .object({
        type: z.literal('table').describe("Node type, always 'table' for table nodes."),
        content: z.array(NormalisedTableRowNodeSchema).describe('Table rows within the table.'),
    })
    .strict()
    .describe('Schema for a table node containing table rows.');

/**
 * ImageNode Schema - Embedded image with attributes.
 */
export const NormalisedImageNodeSchema = z
    .object({
        type: z.literal('image').describe("Node type, always 'image' for image nodes."),
        attrs: z
            .object({
                src: z.string().describe('Source URL or base64 string of the image.'),
                alt: z.string().describe('Alternative text for the image.'),
                title: z.string().describe('Title of the image.'),
            })
            .describe('Attributes of the image, including src, alt, and title.'),
    })
    .strict()
    .describe('Schema for an image node with source and descriptive attributes.');

/**
 * KeyValuePairNode Schema - Structured key-value data.
 */
export const NormalisedKeyValuePairNodeSchema = z
    .object({
        type: z
            .literal('keyValuePair')
            .describe("Node type, always 'keyValuePair' for key-value pair nodes."),
        attrs: z
            .object({
                key: z.string().describe('The key of the key-value pair.'),
                value: z.string().describe('The value of the key-value pair.'),
            })
            .describe('Attributes of the key-value pair, including key and value.'),
    })
    .strict()
    .describe('Schema for a key-value pair node containing a key and a value.');

/**
 * HardBreakNode Schema - Explicit line break.
 */
export const NormalisedHardBreakNodeSchema = z
    .object({
        type: z.literal('hardBreak').describe("Node type, always 'hardBreak' for hard line breaks."),
        attrs: z
            .union([
                z.object({
                    count: z.number().describe('The number of line breaks to insert.'),
                }),
                z.null(),
            ])
            .describe('Optional attributes for the hard break, such as count.'),
    })
    .strict()
    .describe('Schema for a hard line break node within a paragraph.');

/**
 * ThematicBreakNode Schema - Horizontal rule.
 */
export const NormalisedThematicBreakNodeSchema = z
    .object({
        type: z.literal('thematicBreak').describe("Node type, always 'thematicBreak' for thematic breaks."),
        attrs: z
            .union([
                z.object({
                    thickness: z.number().describe('The thickness of the thematic break line in pixels.'),
                }),
                z.null(),
            ])
            .describe('Optional attributes for the thematic break, such as thickness.'),
    })
    .strict()
    .describe('Schema for a thematic break (horizontal rule) node in the document.');

/**
 * BlockQuoteNode Schema - Quoted content block.
 */
export const NormalisedBlockQuoteNodeSchema = z
    .object({
        type: z.literal('blockQuote').describe("Node type, always 'blockQuote' for block quotes."),
        content: z
            .array(z.lazy(() => NormalisedContentNodeSchema))
            .describe('Content nodes within the block quote.'),
    })
    .strict()
    .describe('Schema for a block quote node containing quoted content.');

/**
 * FootnoteNode Schema - Footnote reference and content.
 */
export const NormalisedFootnoteNodeSchema = z
    .object({
        type: z.literal('footnote').describe("Node type, always 'footnote' for footnote nodes."),
        attrs: z
            .object({
                id: z.string().describe('Unique identifier for the footnote.'),
            })
            .describe('Attributes of the footnote, including a unique identifier.'),
        content: z
            .array(z.lazy(() => NormalisedContentNodeSchema))
            .describe('Content nodes within the footnote.'),
    })
    .strict()
    .describe('Schema for a footnote node containing additional information or citations.');

/**
 * SpacerNode Schema - Vertical spacing element.
 */
export const NormalisedSpacerNodeSchema = z
    .object({
        type: z.literal('spacer').describe("Node type, always 'spacer' for spacers."),
        attrs: z
            .object({
                height: z.number().describe('The height of the spacer in pixels.'),
            })
            .describe('Attributes of the spacer, such as height.'),
    })
    .strict()
    .describe('Schema for a spacer node to add vertical space within the document.');

/**
 * ContentNode Schema - Discriminated union of all content node types.
 */
NormalisedContentNodeSchema = z
    .lazy(() =>
        z.union([
            NormalisedTextNodeSchema,
            NormalisedParagraphNodeSchema,
            NormalisedHeadingNodeSchema,
            NormalisedListNodeSchema,
            NormalisedListItemNodeSchema,
            NormalisedTableNodeSchema,
            NormalisedTableRowNodeSchema,
            NormalisedTableCellNodeSchema,
            NormalisedImageNodeSchema,
            NormalisedKeyValuePairNodeSchema,
            NormalisedHardBreakNodeSchema,
            NormalisedThematicBreakNodeSchema,
            NormalisedBlockQuoteNodeSchema,
            NormalisedFootnoteNodeSchema,
            NormalisedSpacerNodeSchema,
        ]),
    )
    .describe('Union of all possible content node types in the document.');

/**
 * NormalisedDocumentSchema - Root document schema for translated documents.
 * This is the primary export used with zodResponseFormat for OpenAI structured output.
 */
export const NormalisedDocumentSchema = z
    .object({
        type: z.literal('doc').describe("Type of the root object, always 'doc'."),
        documentType: z.string().describe("The type of document, e.g., 'invoice', 'certificate'."),
        detectedLanguages: z
            .array(
                z.object({
                    languageCode: z
                        .string()
                        .describe("Language code of the detected language, e.g., 'en', 'fr'."),
                    confidence: z.number().describe('Confidence score of the detected language.'),
                }),
            )
            .describe('Languages detected in the document with confidence scores.'),
        translatedLanguage: z.string().describe("Language code of the translated document, e.g., 'en'."),
        content: z
            .array(NormalisedContentNodeSchema)
            .describe('Content nodes representing the document structure and content.'),
    })
    .strict()
    .describe('Schema for the entire normalized document.');

// Type exports for TypeScript inference
export type NormalisedMark = z.infer<typeof NormalisedMarkSchema>;
export type NormalisedTextNode = z.infer<typeof NormalisedTextNodeSchema>;
export type NormalisedParagraphNode = z.infer<typeof NormalisedParagraphNodeSchema>;
export type NormalisedHeadingNode = z.infer<typeof NormalisedHeadingNodeSchema>;
export type NormalisedListNode = z.infer<typeof NormalisedListNodeSchema>;
export type NormalisedListItemNode = z.infer<typeof NormalisedListItemNodeSchema>;
export type NormalisedTableCellNode = z.infer<typeof NormalisedTableCellNodeSchema>;
export type NormalisedTableRowNode = z.infer<typeof NormalisedTableRowNodeSchema>;
export type NormalisedTableNode = z.infer<typeof NormalisedTableNodeSchema>;
export type NormalisedImageNode = z.infer<typeof NormalisedImageNodeSchema>;
export type NormalisedKeyValuePairNode = z.infer<typeof NormalisedKeyValuePairNodeSchema>;
export type NormalisedHardBreakNode = z.infer<typeof NormalisedHardBreakNodeSchema>;
export type NormalisedThematicBreakNode = z.infer<typeof NormalisedThematicBreakNodeSchema>;
export type NormalisedBlockQuoteNode = z.infer<typeof NormalisedBlockQuoteNodeSchema>;
export type NormalisedFootnoteNode = z.infer<typeof NormalisedFootnoteNodeSchema>;
export type NormalisedSpacerNode = z.infer<typeof NormalisedSpacerNodeSchema>;
export type NormalisedContentNode = z.infer<typeof NormalisedContentNodeSchema>;
export type NormalisedDocument = z.infer<typeof NormalisedDocumentSchema>;

// ============================================================================

// ============================================================================

export const MarkSchema = NormalisedMarkSchema;

export const TextNodeSchema = NormalisedTextNodeSchema;

export const ParagraphNodeSchema = NormalisedParagraphNodeSchema;

export const HeadingNodeSchema = NormalisedHeadingNodeSchema;

export const ListNodeSchema = NormalisedListNodeSchema;

export const ListItemNodeSchema = NormalisedListItemNodeSchema;

export const TableCellNodeSchema = NormalisedTableCellNodeSchema;

export const TableRowNodeSchema = NormalisedTableRowNodeSchema;

export const TableNodeSchema = NormalisedTableNodeSchema;

export const ImageNodeSchema = NormalisedImageNodeSchema;

export const KeyValuePairNodeSchema = NormalisedKeyValuePairNodeSchema;

export const HardBreakNodeSchema = NormalisedHardBreakNodeSchema;

export const ThematicBreakNodeSchema = NormalisedThematicBreakNodeSchema;

export const BlockQuoteNodeSchema = NormalisedBlockQuoteNodeSchema;

export const FootnoteNodeSchema = NormalisedFootnoteNodeSchema;

export const SpacerNodeSchema = NormalisedSpacerNodeSchema;

export const ContentNodeSchema = NormalisedContentNodeSchema;

export const RefinementSchema = NormalisedDocumentSchema;
