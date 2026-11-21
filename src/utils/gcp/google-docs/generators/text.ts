/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { docs_v1 } from 'googleapis';
import { ParagraphNode, HeadingNode, TextNode, ImageNode } from '@/engine/document/types';
import { generateImageRequests } from './image';

/**
 * Handles Text, Paragraphs, and Headings.
 * Returns the requests and the length of the inserted content to update the global index.
 */
export async function generateParagraphRequests(
    node: ParagraphNode | HeadingNode,
    startIndex: number,
    options?: {
        skipTrailingNewline?: boolean;
        segmentId?: string;
        overrideFontSize?: number; // For Headers/Footers (e.g. 8pt)
        overrideColor?: docs_v1.Schema$OptionalColor; // For Footer (Muted Gray)
        /** If true, force RTL direction on all content (document-level RTL) */
        isDocumentRtl?: boolean;
    },
): Promise<{ requests: docs_v1.Schema$Request[]; length: number }> {
    const insertionRequests: docs_v1.Schema$Request[] = [];
    const markRequests: docs_v1.Schema$Request[] = [];

    let currentIndex = startIndex;
    const locationProps = options?.segmentId ? { segmentId: options.segmentId } : {};

    // RTL Script Detection - Covers Arabic, Hebrew, Persian, Urdu, etc.
    // Unicode ranges:
    // - Arabic: \u0600-\u06FF (Basic), \u0750-\u077F (Supplement), \u08A0-\u08FF (Extended-A)
    // - Arabic Presentation Forms: \uFB50-\uFDFF (Form A), \uFE70-\uFEFF (Form B)
    // - Hebrew: \u0590-\u05FF
    // - Syriac: \u0700-\u074F
    // - Thaana (Maldivian): \u0780-\u07BF
    const RTL_REGEX =
        /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0590-\u05FF\u0700-\u074F\u0780-\u07BF]/;
    const RTL_REGEX_GLOBAL =
        /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0590-\u05FF\u0700-\u074F\u0780-\u07BF]/g;

    // Helper: Count RTL characters in text
    const countRtlChars = (text: string): number => (text.match(RTL_REGEX_GLOBAL) || []).length;

    // Helper: Split text into segments based on script (RTL vs LTR)
    const splitTextByScript = (text: string): { content: string; isRtl: boolean }[] => {
        const rtlSplitRegex =
            /([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0590-\u05FF\u0700-\u074F\u0780-\u07BF]+)/g;
        const parts = text.split(rtlSplitRegex);
        const segments: { content: string; isRtl: boolean }[] = [];

        for (const part of parts) {
            if (!part) continue;
            const isRtl = RTL_REGEX.test(part);
            segments.push({ content: part, isRtl });
        }
        return segments;
    };

    // Track RTL character count for paragraph-level direction
    let rtlCharCount = 0;
    let totalCharCount = 0;

    // 1. Process inline content (Text Nodes)
    if (node.content && node.content.length > 0) {
        // Create a working copy of content to sanitize if needed
        const contentToProcess = [...node.content];

        // If we want to skip the trailing newline (e.g. end of table cell),
        // we MUST also ensure the content itself doesn't end with a forced break or newline.
        if (options?.skipTrailingNewline) {
            // 1. Remove trailing HardBreaks
            while (
                contentToProcess.length > 0 &&
                contentToProcess[contentToProcess.length - 1].type === 'hardBreak'
            ) {
                contentToProcess.pop();
            }

            // 2. Trim trailing newlines from the last TextNode
            if (contentToProcess.length > 0) {
                const lastIdx = contentToProcess.length - 1;
                const lastNode = contentToProcess[lastIdx];

                if (lastNode.type === 'text') {
                    const txtNode = lastNode as TextNode;
                    if (txtNode.text && txtNode.text.endsWith('\n')) {
                        // Create a clean copy with trimmed text
                        const trimmedText = txtNode.text.replace(/\n+$/, '');
                        if (trimmedText) {
                            contentToProcess[lastIdx] = {
                                ...txtNode,
                                text: trimmedText,
                            };
                        } else {
                            // If text becomes empty, remove the node entirely
                            contentToProcess.pop();
                        }
                    }
                }
            }
        }

        for (const child of contentToProcess) {
            if (child.type === 'text') {
                const textNode = child as TextNode;
                const rawText = textNode.text;

                if (!rawText) continue;

                // Track RTL characters for paragraph direction
                rtlCharCount += countRtlChars(rawText);
                totalCharCount += rawText.length;

                // Split text into script segments (LTR vs RTL)
                const textSegments = splitTextByScript(rawText);

                for (const segment of textSegments) {
                    const text = segment.content;

                    // Insert Text
                    insertionRequests.push({
                        insertText: {
                            text: text,
                            location: { index: currentIndex, ...locationProps },
                        },
                    });

                    const endOfTextIndex = currentIndex + text.length;

                    // Apply Marks (Existing Logic)
                    if (textNode.marks && textNode.marks.length > 0) {
                        const textStyle: docs_v1.Schema$TextStyle = {};
                        const fields: string[] = [];

                        for (const mark of textNode.marks) {
                            if (mark.type === 'bold') {
                                textStyle.bold = true;
                                fields.push('bold');
                            } else if (mark.type === 'italic') {
                                textStyle.italic = true;
                                fields.push('italic');
                            } else if (mark.type === 'underline') {
                                textStyle.underline = true;
                                fields.push('underline');
                            } else if (mark.type === 'strikethrough') {
                                textStyle.strikethrough = true;
                                fields.push('strikethrough');
                            } else if (mark.type === 'link' && mark.attrs?.href) {
                                textStyle.link = { url: mark.attrs.href };
                                fields.push('link');
                            }
                        }

                        if (fields.length > 0) {
                            markRequests.push({
                                updateTextStyle: {
                                    range: {
                                        startIndex: currentIndex,
                                        endIndex: endOfTextIndex,
                                        ...locationProps,
                                    },
                                    textStyle: textStyle,
                                    fields: fields.join(','),
                                },
                            });
                        }
                    }

                    // Apply Font Fallback for RTL Scripts (Arabic, Hebrew, etc.)
                    if (segment.isRtl) {
                        const isHeading = node.type === 'heading';
                        // Check for Bold mark on this text node
                        const hasBold = textNode.marks?.some((m) => m.type === 'bold');
                        const shouldUseBold = isHeading || hasBold;

                        // Use Cairo for all RTL text - modern, pairs well with Inter
                        const rtlFontFamily = 'Cairo';

                        markRequests.push({
                            updateTextStyle: {
                                range: {
                                    startIndex: currentIndex,
                                    endIndex: endOfTextIndex,
                                    ...locationProps,
                                },
                                textStyle: {
                                    weightedFontFamily: {
                                        fontFamily: rtlFontFamily,
                                        weight: shouldUseBold ? 700 : 400,
                                    },
                                },
                                fields: 'weightedFontFamily',
                            },
                        });
                    }

                    currentIndex += text.length;
                }
            } else if (child.type === 'hardBreak') {
                insertionRequests.push({
                    insertText: {
                        text: '\u000b',
                        location: { index: currentIndex, ...locationProps },
                    },
                });
                currentIndex += 1;
            } else if (child.type === 'image') {
                const imgResult = await generateImageRequests(
                    child as ImageNode,
                    currentIndex,
                    locationProps,
                );
                insertionRequests.push(...imgResult.requests); // Images are usually inserted inline

                currentIndex += imgResult.length;
            }
        }
    }

    // 2. Handle Paragraph Closure (Newline)
    // By default, we append \n to finish the block.
    // If skipTrailingNewline is true, we omit it (useful for last item in table cell).
    const shouldInsertNewline = !options?.skipTrailingNewline;

    if (shouldInsertNewline) {
        insertionRequests.push({
            insertText: {
                text: '\n',
                location: { index: currentIndex, ...locationProps },
            },
        });
    }

    // Styling Range: always include the newline (whether inserted or existing)
    // to ensure paragraph properties apply to the block.
    // Range [startIndex, currentIndex + 1) covers the content + the newline.
    const stylingEndIndex = currentIndex + 1;

    // Returned Length: reflects actual inserted characters.
    // If newline inserted: currentIndex + 1 - startIndex
    // If skipped: currentIndex - startIndex
    const totalLength = shouldInsertNewline ? currentIndex + 1 - startIndex : currentIndex - startIndex;

    // 3. Apply Paragraph Styles (Alignment, Heading, Typography, Direction)
    const isCompact = !!options?.overrideFontSize && options.overrideFontSize <= 10;

    // Determine if paragraph is RTL:
    // - Document-level RTL (isDocumentRtl) forces all content to RTL
    // - Otherwise, use character detection (>50% RTL characters)
    const isParagraphRtlByContent = totalCharCount > 0 && rtlCharCount / totalCharCount > 0.5;
    const isRtl = options?.isDocumentRtl || isParagraphRtlByContent;

    const paragraphStyle: docs_v1.Schema$ParagraphStyle = {
        lineSpacing: 115, // 1.15 - optimal for readability
        // If this is the last item in a cell (skipTrailingNewline), remove spacing to fit flush.
        // If compact (Header/Footer), use 0 or minimal spacing.
        spaceBelow: { magnitude: options?.skipTrailingNewline ? 0 : isCompact ? 2 : 8, unit: 'PT' },
        spaceAbove: { magnitude: isCompact ? 2 : 0, unit: 'PT' },
    };

    // Set paragraph direction for RTL content (document-level OR character-detected)
    if (isRtl) {
        paragraphStyle.direction = 'RIGHT_TO_LEFT';
    }

    // Explicit Text Config (bypass named styles)
    const textStyle: docs_v1.Schema$TextStyle = {};
    let textFields = '';

    // Alignment
    if (node.attrs?.textAlign) {
        // Direction-aware mapping: In RTL, START=visual right, END=visual left
        const visualAlign = node.attrs.textAlign;
        if (visualAlign === 'center') {
            paragraphStyle.alignment = 'CENTER';
        } else if (visualAlign === 'justify') {
            paragraphStyle.alignment = 'JUSTIFIED';
        } else if (visualAlign === 'left') {
            paragraphStyle.alignment = isRtl ? 'START' : 'START';
        } else if (visualAlign === 'right') {
            paragraphStyle.alignment = isRtl ? 'END' : 'END';
        }
    } else {
        // DEFAULT: Justified for that "Book/Legal" block look
        // UNLESS: We are in Header/Footer (compact/overrideFontSize), then START (Left) looks better.
        // For RTL paragraphs without explicit alignment, START aligns to the right (natural RTL flow)
        if (options?.overrideFontSize) {
            paragraphStyle.alignment = 'START';
        } else {
            paragraphStyle.alignment = 'JUSTIFIED';
        }
    }

    // Heading Configuration
    if (node.type === 'heading') {
        const hNode = node as HeadingNode;
        const level = hNode.attrs?.level || 1;

        // Map to Named Style for semantics (Outline view)
        const styleMap: Record<number, string> = {
            1: 'HEADING_1',
            2: 'HEADING_2',
            3: 'HEADING_3',
            4: 'HEADING_4',
            5: 'HEADING_5',
            6: 'HEADING_6',
        };
        paragraphStyle.namedStyleType = styleMap[level] || 'NORMAL_TEXT';
        paragraphStyle.keepWithNext = true; // "Glue"

        // Only enforce default alignment if none specified
        if (!node.attrs?.textAlign) {
            paragraphStyle.alignment = 'START'; // Default to Left
        }

        // Heading Typography (Inter Bold - Modern Premium)
        textStyle.weightedFontFamily = { fontFamily: 'Inter', weight: 700 };
        textStyle.bold = true;
        textFields = 'weightedFontFamily,bold,fontSize';

        // Size & Spacing per level (optimized for Inter)
        if (level === 1) {
            textStyle.fontSize = { magnitude: 18, unit: 'PT' };
            paragraphStyle.spaceAbove = { magnitude: 24, unit: 'PT' };
            paragraphStyle.spaceBelow = { magnitude: 12, unit: 'PT' };
        } else if (level === 2) {
            textStyle.fontSize = { magnitude: 15, unit: 'PT' };
            paragraphStyle.spaceAbove = { magnitude: 18, unit: 'PT' };
            paragraphStyle.spaceBelow = { magnitude: 8, unit: 'PT' };
        } else if (level === 3) {
            textStyle.fontSize = { magnitude: 13, unit: 'PT' };
            paragraphStyle.spaceAbove = { magnitude: 14, unit: 'PT' };
            paragraphStyle.spaceBelow = { magnitude: 6, unit: 'PT' };
        } else {
            // Fallback / Title
            textStyle.fontSize = { magnitude: 24, unit: 'PT' };
            paragraphStyle.spaceAbove = { magnitude: 24, unit: 'PT' };
            paragraphStyle.spaceBelow = { magnitude: 12, unit: 'PT' };
            paragraphStyle.keepLinesTogether = true;

            if (!node.attrs?.textAlign) {
                paragraphStyle.alignment = 'CENTER';
            }
        }
    } else {
        // Normal Text Configuration
        paragraphStyle.namedStyleType = 'NORMAL_TEXT';

        // Body Typography (Inter 12pt - Modern Clean)
        textStyle.weightedFontFamily = { fontFamily: 'Inter', weight: 400 };
        textStyle.fontSize = { magnitude: 12, unit: 'PT' };
        textFields = 'weightedFontFamily,fontSize';
    }

    // OVERRIDE FOR HEADER/FOOTER (User Requested "Fine Print")
    if (options?.overrideFontSize) {
        textStyle.fontSize = { magnitude: options.overrideFontSize, unit: 'PT' };
        // Force compact spacing override again to be sure
        paragraphStyle.spaceAbove = { magnitude: isCompact ? 2 : 0, unit: 'PT' };
        paragraphStyle.spaceBelow = {
            magnitude: options.skipTrailingNewline ? 0 : isCompact ? 2 : 8,
            unit: 'PT',
        };
        // Ensure fields are included
        if (!textFields.includes('fontSize')) textFields += ',fontSize';
    }

    if (options?.overrideColor) {
        textStyle.foregroundColor = options.overrideColor;
        if (!textFields.includes('foregroundColor')) textFields += ',foregroundColor';
    }

    // Build fields list - add direction only for RTL paragraphs
    // Build fields list - add direction only for RTL paragraphs
    // Check if direction is explicitly set to RTL in the style object
    const hasRtlDirection = paragraphStyle.direction === 'RIGHT_TO_LEFT';
    const paragraphFields = hasRtlDirection
        ? 'alignment,namedStyleType,lineSpacing,spaceAbove,spaceBelow,keepWithNext,keepLinesTogether,direction'
        : 'alignment,namedStyleType,lineSpacing,spaceAbove,spaceBelow,keepWithNext,keepLinesTogether,direction';

    // Push Paragraph Style Request (GLOBAL)
    insertionRequests.push({
        updateParagraphStyle: {
            range: {
                startIndex: startIndex,
                endIndex: stylingEndIndex,
                ...locationProps,
            },
            paragraphStyle: paragraphStyle,
            fields: paragraphFields,
        },
    });

    // Push Text Style Request (GLOBAL - Enforce Fonts)
    insertionRequests.push({
        updateTextStyle: {
            range: {
                startIndex: startIndex,
                endIndex: stylingEndIndex, // Apply to paragraph mark too just in case
                ...locationProps,
            },
            textStyle: textStyle,
            fields: textFields,
        },
    });

    // Order: Inserts -> Global Styles -> Specific Marks (to override global)
    return {
        requests: [...insertionRequests, ...markRequests],
        length: totalLength,
    };
}
