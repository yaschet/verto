/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

// src/types/document/normalised-document.d.ts

/**
 * Normalised Document Types.
 *
 * Represents a document in a structured tree format suitable for editing and storage.
 */

/**
 * The root document interface representing the entire document.
 *
 * Contains metadata about the document type and the content nodes.
 *
 * @category Document Normalization
 */
export type NormalisedDocument = {
    /**
     * The type of the root node, which should always be 'doc'.
     */
    type: 'doc';

    /**
     * An array of content nodes representing the structure and content of the document.
     */
    content: ContentNode[];

    /**
     * An array of translated content nodes in the target language.
     */
    translatedContent?: ContentNode[];

    /**
     * The type of document (e.g., 'invoice', 'certificate', 'resume', 'passport').
     */
    documentType: string;

    /**
     * Languages detected in the document, along with their confidence scores.
     */
    detectedLanguages?: DetectedLanguage[];

    /**
     * The language code of the translated document (e.g., 'en', 'fr').
     */
    translatedLanguage?: string;

    /**
     * Text direction for the document.
     * Set to 'rtl' for Arabic, Hebrew, Persian, Urdu, Pashto, Yiddish.
     *
     * @default 'ltr'
     */
    direction?: 'ltr' | 'rtl';
};

/**
 * Represents a detected language in a document - the language code and the confidence score.
 *
 * @category Document Analysis
 */
export type DetectedLanguage = {
    /**
     * The language code of the detected language (e.g., 'en', 'fr').
     */
    languageCode?: string | null;

    /**
     * The confidence score for the detected language, ranging from 0 to 1.
     */
    confidence?: number | null;
};

/**
 * Represents a node in the document content tree.
 *
 * Each node has a type and may have content, text, and attributes.
 *
 * @category Document Content
 */
export type ContentNode =
    | TextNode
    | ParagraphNode
    | HeadingNode
    | ListNode
    | ListItemNode
    | TableNode
    | TableRowNode
    | TableCellNode
    | TableHeaderNode
    | ImageNode
    | KeyValuePairNode
    | HardBreakNode
    | ThematicBreakNode
    | BlockQuoteNode
    | FootnoteNode
    | SpacerNode
    | DescriptionListNode
    | DescriptionItemNode;

/**
 * Represents a text node containing plain text.
 *
 * @category Document Content
 */
export type TextNode = {
    /**
     * The type of the node, which is 'text'.
     */
    type: 'text';

    /**
     * The actual text content.
     */
    text: string;

    /**
     * Marks applied to the text for styling.
     */
    marks?: Mark[];
};

/**
 * Represents a paragraph node containing text or inline content.
 *
 * @category Document Content
 */
export type ParagraphNode = {
    /**
     * The type of the node, which is 'paragraph'.
     */
    type: 'paragraph';

    /**
     * Attributes for the paragraph, such as alignment.
     */
    attrs?: {
        /**
         * The text alignment of the paragraph, if any.
         * Uses 'textAlign' to match TipTap's expected format.
         *
         * @example 'left', 'center', 'right', 'justify'
         * @default 'left'
         */
        textAlign?: 'left' | 'center' | 'right' | 'justify';
    };

    /**
     * An array of inline content nodes.
     */
    content: ContentNode[];
};

/**
 * Represents a heading node with a specified level.
 *
 * @category Document Content
 */
export type HeadingNode = {
    /**
     * The type of the node, which is 'heading'.
     */
    type: 'heading';

    /**
     * Attributes for the heading, including the level (1-6).
     */
    attrs: {
        /**
         * The level of the heading, from 1 to 6.
         *
         * @example 1 for h1, 2 for h2, etc.
         */
        level: number;

        /**
         * The text alignment of the heading, if any.
         * Uses 'textAlign' to match TipTap's expected format.
         *
         * @example 'left', 'center', 'right', 'justify'
         * @default 'left'
         */
        textAlign?: 'left' | 'center' | 'right' | 'justify';
    };

    /**
     * An array of inline content nodes.
     */
    content: ContentNode[];
};

/**
 * Represents a list node, which can be ordered or unordered.
 *
 * @category Document Content
 */
export type ListNode = {
    /**
     * The type of the node, either 'bulletList' or 'orderedList'.
     */
    type: 'bulletList' | 'orderedList';

    /**
     * Attributes for the list node.
     */
    attrs?: {
        /**
         * For ordered lists, the starting number.
         */
        order?: number;
    };

    /**
     * An array of list item nodes.
     */
    content: ListItemNode[];
};

/**
 * Represents a list item node.
 *
 * @category Document Content
 */
export type ListItemNode = {
    /**
     * The type of the node, which is 'listItem'.
     */
    type: 'listItem';

    /**
     * An array of content nodes representing the item's content.
     */
    content: ContentNode[];
};

/**
 * Represents a table node containing rows.
 *
 * @category Document Content
 */
export type TableNode = {
    /**
     * The type of the node, which is 'table'.
     */
    type: 'table';

    /**
     * An array of table row nodes.
     */
    content: TableRowNode[];
};

/**
 * Represents a table row node containing cells.
 *
 * @category Document Content
 */
export type TableRowNode = {
    /**
     * The type of the node, which is 'tableRow'.
     */
    type: 'tableRow';

    /**
     * An array of table cell or header nodes.
     * Rows can contain either regular cells (tableCell) or header cells (tableHeader).
     */
    content: (TableCellNode | TableHeaderNode)[];
};

/**
 * Represents a table cell node containing content.
 *
 * @category Document Content
 */
export type TableCellNode = {
    /**
     * The type of the node, which is 'tableCell'.
     */
    type: 'tableCell';

    /**
     * Attributes for the table cell, such as column and row spans.
     */
    attrs?: {
        /**
         * Number of columns spanned by the cell.
         *
         * @default 1
         */
        colspan?: number;

        /**
         * Number of rows spanned by the cell.
         *
         * @default 1
         */
        rowspan?: number;

        /**
         * Column width array for resizable tables.
         * Contains the width in pixels for each column this cell spans.
         *
         * @default null
         */
        colwidth?: number[] | null;

        /**
         * The text alignment of the cell, if any.
         * Uses 'textAlign' to match TipTap's expected format.
         *
         * @example 'left', 'center', 'right', 'justify'
         * @default 'left'
         */
        textAlign?: 'left' | 'center' | 'right' | 'justify';
    };

    /**
     * An array of content nodes within the cell.
     */
    content: ContentNode[];
};

/**
 * Represents a table header cell node containing content.
 * Similar to TableCellNode but for header cells in tables.
 *
 * @category Document Content
 */
export type TableHeaderNode = {
    /**
     * The type of the node, which is 'tableHeader'.
     */
    type: 'tableHeader';

    /**
     * Attributes for the table header cell, such as column and row spans.
     */
    attrs?: {
        /**
         * Number of columns spanned by the header cell.
         *
         * @default 1
         */
        colspan?: number;

        /**
         * Number of rows spanned by the header cell.
         *
         * @default 1
         */
        rowspan?: number;

        /**
         * Column width array for resizable tables.
         * Contains the width in pixels for each column this cell spans.
         *
         * @default null
         */
        colwidth?: number[] | null;

        /**
         * The text alignment of the header cell, if any.
         * Uses 'textAlign' to match TipTap's expected format.
         *
         * @example 'left', 'center', 'right', 'justify'
         * @default 'left'
         */
        textAlign?: 'left' | 'center' | 'right' | 'justify';
    };

    /**
     * An array of content nodes within the header cell.
     */
    content: ContentNode[];
};

/**
 * Represents an image node.
 *
 * @category Document Content
 */
export type ImageNode = {
    /**
     * The type of the node, which is 'image'.
     */
    type: 'image';

    /**
     * Attributes for the image node.
     */
    attrs: {
        /**
         * The source URL or base64 string of the image.
         */
        src: string;

        /**
         * Alternative text for the image.
         */
        alt?: string;

        /**
         * Title of the image.
         */
        title?: string;

        /**
         * Width of the image in pixels (or points).
         */
        width?: number;

        /**
         * Height of the image in pixels (or points).
         */
        height?: number;
    };
};

/**
 * Represents a key-value pair node.
 *
 * @category Document Content
 */
export type KeyValuePairNode = {
    /**
     * The type of the node, which is 'keyValuePair'.
     */
    type: 'keyValuePair';

    /**
     * Attributes containing the key and value.
     */
    attrs: {
        /**
         * The key in the key-value pair.
         */
        key: string;

        /**
         * The value associated with the key.
         */
        value: string;
    };
};

/**
 * Represents a hard line break within a paragraph.
 *
 * @category Document Content
 */
export type HardBreakNode = {
    /**
     * The type of the node, which is 'hardBreak'.
     */
    type: 'hardBreak';

    /**
     * Optional attributes for the hard break.
     */
    attrs?: {
        /**
         * The number of line breaks to insert.
         *
         * @default 1
         */
        count?: number;
    };
};

/**
 * Represents a thematic break (horizontal rule) in the document.
 *
 * @category Document Content
 */
export type ThematicBreakNode = {
    /**
     * The type of the node, which is 'thematicBreak'.
     */
    type: 'thematicBreak';

    /**
     * Optional attributes for the thematic break.
     */
    attrs?: {
        /**
         * The thickness of the line in pixels.
         *
         * @default 1
         */
        thickness?: number;
    };
};

/**
 * Represents a block quote in the document.
 *
 * @category Document Content
 */
export type BlockQuoteNode = {
    /**
     * The type of the node, which is 'blockQuote'.
     */
    type: 'blockQuote';

    /**
     * An array of content nodes within the block quote.
     */
    content: ContentNode[];
};

/**
 * Represents a footnote in the document.
 *
 * @category Document Content
 */
export type FootnoteNode = {
    /**
     * The type of the node, which is 'footnote'.
     */
    type: 'footnote';

    /**
     * The identifier for the footnote reference.
     */
    attrs: {
        /**
         * Unique identifier for the footnote.
         */
        id: string;
    };

    /**
     * An array of content nodes within the footnote.
     */
    content: ContentNode[];
};

/**
 * Represents a spacer in the document to add vertical space.
 *
 * @category Document Content
 */
export type SpacerNode = {
    /**
     * The type of the node, which is 'spacer'.
     */
    type: 'spacer';

    /**
     * Attributes for the spacer, such as height.
     */
    attrs: {
        /**
         * The height of the spacer in pixels.
         */
        height: number;
    };
};

/**
 * Represents styling marks that can be applied to text nodes.
 *
 * @category Document Content
 */
export type Mark = {
    /**
     * The type of the mark (e.g., 'bold', 'italic', 'underline', 'strikethrough', 'link').
     */
    type: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'link';

    /**
     * Attributes for the mark, if any.
     * For link marks, this includes the href attribute.
     */
    attrs?: {
        href?: string;
        [key: string]: unknown;
    };
};

/**
 * Represents a Description List (Key-Value Pair List).
 *
 * @category Document Content
 */
export type DescriptionListNode = {
    /**
     * The type of the node, which is 'descriptionList'.
     */
    type: 'descriptionList';

    /**
     * An array of description items (Term + Value pairs).
     */
    content: DescriptionItemNode[];
};

/**
 * Represents a Description List Item.
 * Contains both Term (DT) and Description/Value (DD).
 * Modeled as an array of 2 ContentNodes: [Term, Value]
 */
export type DescriptionItemNode = {
    type: 'descriptionItem';
    content: [DescriptionTermNode, DescriptionValueNode];
};

/**
 * The Term (Key) part of a Description List item.
 * Usually rendered bold.
 */
export type DescriptionTermNode = {
    type: 'descriptionTerm';
    content: ContentNode[]; // Usually TextNode
};

/**
 * The Value (Description) part of a Description List item.
 */
export type DescriptionValueNode = {
    type: 'descriptionValue';
    content: ContentNode[];
};
