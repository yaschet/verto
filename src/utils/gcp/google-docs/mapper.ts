/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { docs_v1 } from 'googleapis';
import {
    NormalisedDocument,
    ContentNode,
    ParagraphNode,
    HeadingNode,
    TableNode,
    ImageNode,
    TextNode,
    DescriptionListNode,
    DescriptionItemNode,
    DescriptionTermNode,
    DescriptionValueNode,
} from '@/engine/document/types';
import {
    ExtendedResolvedBrandingSettings,
    ProseMirrorJSON,
    CERTIFICATION_STAMP_CONSTRAINTS,
} from '@/types/document/branding-settings';
import { generateParagraphRequests } from './generators/text';
import { generateTableRequests } from './generators/table';
import { generateImageRequests } from './generators/image';
import { generateDescriptionListRequests } from './generators/description-list';

export interface MapperContext {
    requests: docs_v1.Schema$Request[];
    currentIndex: number; // Minimal index tracker for calculating table cell locations
}

export class GoogleDocsMapper {
    private doc: NormalisedDocument;
    private context: MapperContext;
    private brandingSettings?: ExtendedResolvedBrandingSettings;
    private headerId?: string;
    private footerId?: string;

    constructor(
        doc: NormalisedDocument,
        brandingSettings?: ExtendedResolvedBrandingSettings,
        headerId?: string,
        footerId?: string,
    ) {
        this.doc = doc;
        this.brandingSettings = brandingSettings;
        this.headerId = headerId;
        this.footerId = footerId;
        this.context = {
            requests: [],
            // Google Docs Body starts at index 1.
            currentIndex: 1,
        };
    }

    /**
     * Converts the NormalisedDocument into lists of batchUpdate requests.
     * Returns separate arrays for header/footer vs body to avoid API internal errors.
     */
    public async convert(): Promise<{
        headerFooterRequests: docs_v1.Schema$Request[];
        bodyRequests: docs_v1.Schema$Request[];
    }> {
        const headerFooterRequests: docs_v1.Schema$Request[] = [];

        // 0. Generate Branding (Headers/Footers) if enabled and IDs provided
        if (this.brandingSettings?.enabled && this.headerId) {
            const headerReqs = await this.generateHeaderRequests(this.headerId);
            headerFooterRequests.push(...headerReqs);
        }

        if (this.brandingSettings?.enabled && this.footerId) {
            const footerReqs = await this.generateFooterRequests(this.footerId);
            headerFooterRequests.push(...footerReqs);
        }

        // 1. Initialise Global Styles (Legendary Default)
        this.context.requests.push(...this.generateGlobalStyleRequests());

        // 2. Process all top-level nodes
        const isDocumentRtl = this.doc.direction === 'rtl';
        for (const node of this.doc.content) {
            await this.processNode(node, undefined, { isDocumentRtl });
        }

        // 3. Append Certification & Stamp (Moved from Footer to Body End)
        const hasCertification = this.brandingSettings?.footerContent?.certification;
        const hasStamp =
            this.brandingSettings?.showCertificationStamp && this.brandingSettings?.certificationStampUrl;

        if (this.brandingSettings?.enabled && (hasCertification || hasStamp)) {
            await this.generateCertificationContent();
        }

        return {
            headerFooterRequests,
            bodyRequests: this.context.requests,
        };
    }

    /**
     * Appends Certification Text and Stamp Image to the end of the document body.
     */
    private async generateCertificationContent() {
        if (!this.brandingSettings) return;
        const settings = this.brandingSettings;

        const hasCertification = settings.footerContent?.certification;
        const hasStamp = settings.showCertificationStamp && settings.certificationStampUrl;

        if (!hasCertification && !hasStamp) return;

        // 1. Certification Text (as a Table for distinct block layout)
        if (hasCertification && settings.footerContent?.certification) {
            const certNodes = this.convertProseMirrorToNodes(settings.footerContent.certification); // Non-null assertion safe due to check above

            const certTable: TableNode = {
                type: 'table',
                content: [
                    {
                        type: 'tableRow',
                        content: [
                            {
                                type: 'tableCell',
                                content: certNodes.length ? certNodes : [{ type: 'paragraph', content: [] }],
                            },
                        ],
                    },
                ],
            };

            // Use processNode to insert it into the body (handling index automatically)
            await this.processNode(certTable);
        }

        // 2. Padding/Spacing between Certification and Stamp
        if (settings.showCertificationStamp && settings.certificationStampUrl) {
            // Add a spacer paragraph
            const spacer: ParagraphNode = {
                type: 'paragraph',
                content: [], // Empty paragraph = newline
            };
            await this.processNode(spacer);

            // 3. Certification Stamp (Image)
            // Determine size based on constraints
            const sizeKey = settings.certificationStampSize || 'md';
            const sizePx = CERTIFICATION_STAMP_CONSTRAINTS.displaySizePx[sizeKey];

            const imageNode: ImageNode = {
                type: 'image',
                attrs: {
                    src: settings.certificationStampUrl,
                    width: sizePx,
                    height: sizePx,
                },
            };

            const stampPara: ParagraphNode = {
                type: 'paragraph',
                content: [imageNode],
                attrs: { textAlign: 'right' },
            };

            await this.processNode(stampPara);
        }
    }

    private async generateHeaderRequests(segmentId: string): Promise<docs_v1.Schema$Request[]> {
        const requests: docs_v1.Schema$Request[] = [];
        if (!this.brandingSettings) return requests;

        // Create a 1-row, 3-column table for layout (Left, Center/Logo, Right)
        // We construct a TableNode in memory and use the generator using the segmentId.

        // 1. Prepare Content Nodes
        // 1. Prepare Content Nodes with EXPLICIT ALIGNMENT
        // We inject `textAlign` attribute to ensure `text.ts` respects the column alignment.

        const leftNodes = this.brandingSettings.headerContent?.left
            ? this.convertProseMirrorToNodes(this.brandingSettings.headerContent.left).map((n) => {
                  if (n.type === 'paragraph' || n.type === 'heading') {
                      return {
                          ...n,
                          attrs: { ...(n.attrs || {}), textAlign: 'left' as const },
                      } as ContentNode;
                  }
                  return n;
              })
            : [
                  {
                      type: 'paragraph',
                      content: [] as ContentNode[],
                      attrs: { textAlign: 'left' as const },
                  } as ContentNode,
              ];

        const centerNodes = this.brandingSettings.headerContent?.center
            ? this.convertProseMirrorToNodes(this.brandingSettings.headerContent.center).map((n) => {
                  if (n.type === 'paragraph' || n.type === 'heading') {
                      // Center content
                      return {
                          ...n,
                          attrs: { ...(n.attrs || {}), textAlign: 'center' as const },
                      } as ContentNode;
                  }
                  return n;
              })
            : this.brandingSettings.logoUrl
              ? []
              : [
                    {
                        type: 'paragraph',
                        content: [] as ContentNode[],
                        attrs: { textAlign: 'center' as const },
                    } as ContentNode,
                ];

        // Handle Logo in Center Node if present
        if (this.brandingSettings.logoUrl) {
            // If centerNodes empty or just placeholder, put logo.
            // We append logo to centerNodes
            const logoNode: ImageNode = {
                type: 'image',
                attrs: {
                    src: this.brandingSettings.logoUrl,
                    // 0.75 inches * 72 points/inch = 54 PT
                    height: 54,
                },
            };

            // Wrap in paragraph centered
            centerNodes.push({
                type: 'paragraph',
                content: [logoNode],
                attrs: { textAlign: 'center' as const },
            } as ParagraphNode);
        }

        // Fallback: If Left & Right are empty, add Company Name to Center (below logo)
        // Check for content in Left/Right columns (simple null check for now)
        const hasLeftContent =
            this.brandingSettings.headerContent?.left &&
            this.brandingSettings.headerContent.left.content &&
            this.brandingSettings.headerContent.left.content.length > 0;

        const hasRightContent =
            this.brandingSettings.headerContent?.right &&
            this.brandingSettings.headerContent.right.content &&
            this.brandingSettings.headerContent.right.content.length > 0;

        if (!hasLeftContent && !hasRightContent && this.brandingSettings.companyName) {
            centerNodes.push({
                type: 'paragraph',
                attrs: { textAlign: 'center' as const },
                content: [
                    {
                        type: 'text',
                        text: this.brandingSettings.companyName,
                        marks: [{ type: 'bold' }],
                    } as TextNode,
                ],
            } as ParagraphNode);
        }

        const rightNodes = this.brandingSettings.headerContent?.right
            ? this.convertProseMirrorToNodes(this.brandingSettings.headerContent.right).map((n) => {
                  if (n.type === 'paragraph' || n.type === 'heading') {
                      return {
                          ...n,
                          attrs: { ...(n.attrs || {}), textAlign: 'right' as const },
                      } as ContentNode;
                  }
                  return n;
              })
            : [
                  {
                      type: 'paragraph',
                      content: [] as ContentNode[],
                      attrs: { textAlign: 'right' as const },
                  } as ContentNode,
              ];

        // 2. Wrap in Table
        const tableNode: TableNode = {
            type: 'table',
            content: [
                {
                    type: 'tableRow',
                    content: [
                        {
                            type: 'tableCell',
                            content: leftNodes.length ? leftNodes : [{ type: 'paragraph', content: [] }],
                        },
                        {
                            type: 'tableCell',
                            content: centerNodes.length ? centerNodes : [{ type: 'paragraph', content: [] }],
                        },
                        {
                            type: 'tableCell',
                            content: rightNodes.length ? rightNodes : [{ type: 'paragraph', content: [] }],
                        },
                    ],
                },
            ],
        };

        // 3. Generate Requests
        // Note: We insert a buffer space at 0 to avoid "Table at Start" invalid location issues.
        // Table will start at index 1.
        requests.push({
            insertText: { text: ' ', location: { index: 0, segmentId } },
        });
        requests.push({
            updateParagraphStyle: {
                range: { startIndex: 0, endIndex: 1, segmentId },
                paragraphStyle: {
                    spaceAbove: { magnitude: 0, unit: 'PT' },
                    spaceBelow: { magnitude: 0, unit: 'PT' },
                    lineSpacing: 100,
                },
                fields: 'spaceAbove,spaceBelow,lineSpacing',
            },
        });
        requests.push({
            updateTextStyle: {
                range: { startIndex: 0, endIndex: 1, segmentId },
                textStyle: { fontSize: { magnitude: 1, unit: 'PT' } },
                fields: 'fontSize',
            },
        });

        const tResult = await generateTableRequests(
            tableNode,
            1,
            async (n, i, opts) => await this.processNode(n, i, opts),
            { segmentId, overrideFontSize: 11, skipHeaderStyling: true },
        );
        requests.push(...tResult.requests);

        // 3.1 Layout: Set Balanced Column Widths (Total 504pt - Full Width)
        // Left: 168pt, Center: 168pt, Right: 168pt (Exact 1:1:1)
        requests.push({
            updateTableColumnProperties: {
                tableStartLocation: { index: 2, segmentId },
                columnIndices: [0],
                tableColumnProperties: { width: { magnitude: 168, unit: 'PT' }, widthType: 'FIXED_WIDTH' },
                fields: 'width,widthType',
            },
        });
        requests.push({
            updateTableColumnProperties: {
                tableStartLocation: { index: 2, segmentId },
                columnIndices: [1],
                tableColumnProperties: { width: { magnitude: 168, unit: 'PT' }, widthType: 'FIXED_WIDTH' },
                fields: 'width,widthType',
            },
        });
        requests.push({
            updateTableColumnProperties: {
                tableStartLocation: { index: 2, segmentId },
                columnIndices: [2],
                tableColumnProperties: { width: { magnitude: 168, unit: 'PT' }, widthType: 'FIXED_WIDTH' },
                fields: 'width,widthType',
            },
        });

        // 4. Remove Borders for cleaner look
        requests.push({
            updateTableCellStyle: {
                tableRange: {
                    tableCellLocation: {
                        tableStartLocation: { index: 2, segmentId }, // Table starts at 2 (1 + implicit newline)
                        rowIndex: 0,
                        columnIndex: 0,
                    },
                    rowSpan: 1,
                    columnSpan: 3,
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
                    contentAlignment: 'MIDDLE',
                },
                fields: 'borderTop,borderBottom,borderLeft,borderRight,contentAlignment',
            },
        });

        return requests;
    }

    private async generateFooterRequests(segmentId: string): Promise<docs_v1.Schema$Request[]> {
        const requests: docs_v1.Schema$Request[] = [];
        if (!this.brandingSettings) return requests;

        // Footer Structure:
        // Only Company Details + Page Number (Row 1 of original design)

        const detailsNodes = this.brandingSettings.footerContent?.companyDetails
            ? this.convertProseMirrorToNodes(this.brandingSettings.footerContent.companyDetails)
            : [];

        const tableNode: TableNode = {
            type: 'table',
            content: [
                {
                    type: 'tableRow',
                    content: [
                        {
                            type: 'tableCell',
                            attrs: { colspan: 2 },
                            content: detailsNodes.length
                                ? detailsNodes.map((n) => {
                                      if (n.type === 'paragraph' || n.type === 'heading') {
                                          return {
                                              ...n,
                                              attrs: { ...(n.attrs || {}), textAlign: 'center' as const },
                                          } as ContentNode;
                                      }
                                      return n;
                                  })
                                : [
                                      {
                                          type: 'paragraph',
                                          content: [] as ContentNode[],
                                          attrs: { textAlign: 'center' as const },
                                      } as ContentNode,
                                  ],
                        },
                    ],
                },
            ],
        };

        // 3.5 Insert Buffer Space at 0
        requests.push({
            insertText: { text: ' ', location: { index: 0, segmentId } },
        });
        requests.push({
            updateParagraphStyle: {
                range: { startIndex: 0, endIndex: 1, segmentId },
                paragraphStyle: {
                    spaceAbove: { magnitude: 0, unit: 'PT' },
                    spaceBelow: { magnitude: 0, unit: 'PT' },
                    lineSpacing: 100,
                },
                fields: 'spaceAbove,spaceBelow,lineSpacing',
            },
        });
        requests.push({
            updateTextStyle: {
                range: { startIndex: 0, endIndex: 1, segmentId },
                textStyle: { fontSize: { magnitude: 1, unit: 'PT' } },
                fields: 'fontSize',
            },
        });

        // 4. Generate Table at 1
        const tResult = await generateTableRequests(
            tableNode,
            1,
            async (n, i, opts) => await this.processNode(n, i, opts),
            {
                segmentId,
                overrideFontSize: 10,
                skipHeaderStyling: true,
                overrideColor: { color: { rgbColor: { red: 0.4, green: 0.4, blue: 0.4 } } }, // Muted Gray (#666666)
            },
        );

        requests.push(...tResult.requests);

        // Remove borders & Apply Specific Divider
        // First, Remove other borders for the entire table (Reset)
        requests.push({
            updateTableCellStyle: {
                tableRange: {
                    tableCellLocation: {
                        tableStartLocation: { index: 2, segmentId }, // Table starts at 2 (1 + implicit newline)
                        rowIndex: 0,
                        columnIndex: 0,
                    },
                    rowSpan: 1,
                    columnSpan: 1, // Only 1 cell now (colspan 2? No, `tableNode` defines structure. GenerateTableRequests generates 1 row, 1 cell effectively?)
                    // wait, tableNode above has 1 row with 1 cell (which has colspan: 2 in logic? Docs API doesn't support colspan in creation like HTML, but `generateTable` might handle it?
                    // Let's check `generateTableRequests`. It creates a grid.
                    // Actually, if I just pass a 1x1 table structure in `tableNode`, `generateTableRequests` creates a 1x1 table.
                    // The original `tableNode` had 2 rows. Now 1 row.
                    // The content is a single cell spanning 2 cols? Or just 1 cell?
                    // Let's just make it a simple 1x1 table for Company Details.
                },
                tableCellStyle: {
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
                    borderTop: {
                        dashStyle: 'SOLID',
                        width: { magnitude: 0.5, unit: 'PT' },
                        color: { color: { rgbColor: { red: 0.6, green: 0.6, blue: 0.6 } } },
                    }, // Grey Top Border
                    contentAlignment: 'MIDDLE',
                },
                fields: 'borderBottom,borderLeft,borderRight,borderTop,contentAlignment',
            },
        });

        return requests;
    }

    private convertProseMirrorToNodes(pm: ProseMirrorJSON): ContentNode[] {
        const nodes: ContentNode[] = [];

        // If it's a doc/root, process content
        if (pm.type === 'doc' && pm.content) {
            pm.content.forEach((child) => nodes.push(...this.convertProseMirrorToNodes(child)));
            return nodes;
        }

        // Paragraph
        if (pm.type === 'paragraph') {
            const pNode: ParagraphNode = {
                type: 'paragraph',
                content: [],
                attrs: pm.attrs as ParagraphNode['attrs'],
            };
            if (pm.content) {
                pm.content.forEach((child) => {
                    const childNodes = this.convertProseMirrorToNodes(child);
                    // PM paragraph content is text/inline.
                    // Flatten to TextNodes
                    childNodes.forEach((c) => {
                        if (c.type === 'text') pNode.content.push(c as TextNode);
                        if (c.type === 'hardBreak') pNode.content.push(c);
                    });
                });
            }
            nodes.push(pNode);
        }

        // Text
        if (pm.type === 'text') {
            const tNode: TextNode = {
                type: 'text',
                text: pm.text || '',
                marks: pm.marks?.map((m) => ({ type: m.type, attrs: m.attrs })) as TextNode['marks'],
            };
            nodes.push(tNode);
        }

        // Hard Break
        if (pm.type === 'hardBreak') {
            // Treat as ContentNode? NormalisedDocument supports 'hardBreak' type in content?
            // Checking `text.ts`: `if (child.type === 'hardBreak')` in `generateParagraphRequests`.
            // Yes, it expects hardBreak in content.
            nodes.push({ type: 'hardBreak' });
        }

        return nodes;
    }

    /**
     * Generates requests to set up the "Legendary Default" typography and layout.
     * Implements settings from specs/sworn-translation-styling.md
     *
     * NOTE: Google Docs API does NOT support updating named style definitions (e.g. Redefining "Normal Text").
     * We only set Document Styles (Margins) here. Typography must be applied explicitly to each paragraph in `text.ts`.
     */
    private generateGlobalStyleRequests(): docs_v1.Schema$Request[] {
        const requests: docs_v1.Schema$Request[] = [];

        // 1. Document Layout (Margins 0.75" = 54pt)
        requests.push({
            updateDocumentStyle: {
                documentStyle: {
                    marginTop: { magnitude: 54, unit: 'PT' },
                    marginBottom: { magnitude: 54, unit: 'PT' },
                    marginLeft: { magnitude: 54, unit: 'PT' },
                    marginRight: { magnitude: 54, unit: 'PT' },
                },
                fields: 'marginTop,marginBottom,marginLeft,marginRight',
            },
        });

        // 2. RTL Support: Set section content direction for RTL languages

        if (this.doc.direction === 'rtl') {
            // Set section content direction to RTL
            // This affects table cell "head" position and overall section flow
            requests.push({
                updateSectionStyle: {
                    range: {
                        segmentId: '',
                        startIndex: 1,
                        endIndex: 2,
                    },
                    sectionStyle: {
                        contentDirection: 'RIGHT_TO_LEFT',
                    },
                    fields: 'contentDirection',
                },
            });
        }

        return requests;
    }

    /**
     * Internal method to process nodes, exposed for recursive generators (like Table).
     */
    public async processNode(
        node: ContentNode,
        overrideIndex?: number,
        options?: {
            skipTrailingNewline?: boolean;
            segmentId?: string;
            overrideFontSize?: number;
            overrideColor?: docs_v1.Schema$OptionalColor;
            isDocumentRtl?: boolean;
        },
    ): Promise<{ requests: docs_v1.Schema$Request[]; length: number }> {
        const index = overrideIndex !== undefined ? overrideIndex : this.context.currentIndex;
        const result = { requests: [] as docs_v1.Schema$Request[], length: 0 };

        const baseOptions = {
            segmentId: options?.segmentId,
            overrideFontSize: options?.overrideFontSize,
            overrideColor: options?.overrideColor,
            isDocumentRtl: options?.isDocumentRtl,
        };

        switch (node.type) {
            case 'paragraph':
            case 'heading': {
                const pResult = await generateParagraphRequests(
                    node as ParagraphNode | HeadingNode,
                    index,
                    options,
                );
                result.requests.push(...pResult.requests);
                result.length = pResult.length;
                break;
            }
            case 'table': {
                const tResult = await generateTableRequests(
                    node as TableNode,
                    index,
                    async (n, i, opts) => await this.processNode(n, i, opts),
                    baseOptions, // Pass base options (style, segment) to table
                );
                result.requests.push(...tResult.requests);
                result.length = tResult.length;
                break;
            }
            case 'text': {
                // Handle direct TextNodes (e.g. inside Table Cells) by wrapping in a Paragraph
                // This ensures they get inserted with proper structure (and implicitly a newline)
                const textWrapper: ParagraphNode = {
                    type: 'paragraph',
                    content: [node as TextNode],
                };
                const txResult = await generateParagraphRequests(textWrapper, index, options);
                result.requests.push(...txResult.requests);
                result.length = txResult.length;
                break;
            }
            case 'image': {
                const iResult = await generateImageRequests(node as ImageNode, index, baseOptions);
                result.requests.push(...iResult.requests);
                result.length = iResult.length;
                break;
            }
            case 'descriptionList': {
                const dlResult = await generateDescriptionListRequests(
                    node as DescriptionListNode,
                    index,
                    async (n, i, opts) => await this.processNode(n, i, opts),
                    baseOptions,
                );
                result.requests.push(...dlResult.requests);
                result.length = dlResult.length;
                break;
            }
            case 'bulletList':
            case 'orderedList':
                // Lists are complex. Treat as paragraphs for MVP?
                // Or implement specialized list handler.
                // Currently just skipping or treating contents as paragraphs?
                // Lists in NormalisedDocument have `content: ListItemNode[]`.
                // Recursive...
                if (node.content) {
                    let listCursor = index;
                    for (const item of node.content) {
                        if (item.content) {
                            for (const child of item.content) {
                                const cResult = await this.processNode(child, listCursor, baseOptions);
                                result.requests.push(...cResult.requests);
                                result.length += cResult.length;
                                listCursor += cResult.length;
                            }
                        }
                    }
                }
                break;
            case 'spacer': {
                // Spacer: Vertical whitespace
                // Represent as an empty paragraph with explicit spaceBelow matching the height
                // Default height is often in pixels. Convert to PT? 1 px = 0.75 pt approx.
                // Or just assume units are roughly compatible or use a generic multiplier.
                // NormalisedDocument spacer usually has `attrs.height`.
                const spacerHeight = (node as { attrs?: { height?: number } }).attrs?.height || 20;
                const spacerRequest: docs_v1.Schema$Request = {
                    insertText: {
                        text: '\n',
                        location: { index, segmentId: baseOptions.segmentId },
                    },
                };
                result.requests.push(spacerRequest);

                const spacerStyleRequest: docs_v1.Schema$Request = {
                    updateParagraphStyle: {
                        range: { startIndex: index, endIndex: index + 1, segmentId: baseOptions.segmentId },
                        paragraphStyle: {
                            spaceAbove: { magnitude: 0, unit: 'PT' },
                            spaceBelow: { magnitude: spacerHeight, unit: 'PT' }, // Treat directly as PT for simplicity, or scale if needed.
                            lineSpacing: 100, // Single spacing
                        },
                        fields: 'spaceAbove,spaceBelow,lineSpacing',
                    },
                };
                result.requests.push(spacerStyleRequest);
                result.length = 1;
                break;
            }
            case 'keyValuePair': {
                // Key Value Pair: Treat as a single-item Description List to match styling exactly.
                const kvNode = node;

                // Construct transient Description List structure
                const dlNode: DescriptionListNode = {
                    type: 'descriptionList',
                    content: [
                        {
                            type: 'descriptionItem',
                            content: [
                                {
                                    type: 'descriptionTerm',
                                    content: [{ type: 'text', text: kvNode.attrs?.key || '' } as TextNode],
                                } as DescriptionTermNode,
                                {
                                    type: 'descriptionValue',
                                    content: [{ type: 'text', text: kvNode.attrs?.value || '' } as TextNode],
                                } as DescriptionValueNode,
                            ],
                        } as DescriptionItemNode,
                    ],
                };

                const kvResult = await generateDescriptionListRequests(
                    dlNode,
                    index,
                    async (n, i, opts) => await this.processNode(n, i, opts),
                    baseOptions,
                );
                result.requests.push(...kvResult.requests);
                result.length = kvResult.length;
                break;
            }
            case 'thematicBreak': {
                // Insert Horizontal Rule (Section Break / Page Break is different)
                // Google Docs API uses insertInlineImage for lines? No, we can use insertHorizontalRule.
                // Wait, batchUpdate supports insertHorizontalRule?
                // Checks API: insertHorizontalRule is NOT a valid request type.
                // Supported: insertText, insertTable, insertInlineImage, insertPageBreak, insertSectionBreak.

                // Workaround: Use a Paragraph with a Bottom Border "Thematic Break" style
                // Or insert an inline image of a line? No, too complex.
                // Best practice: Paragraph with bottom border.

                const hrRequest: docs_v1.Schema$Request = {
                    insertText: {
                        text: '\n', // Newline for the HR paragraph
                        location: { index, segmentId: baseOptions.segmentId },
                    },
                };
                result.requests.push(hrRequest);

                // Apply border to this new paragraph
                const hrStyleRequest: docs_v1.Schema$Request = {
                    updateParagraphStyle: {
                        range: { startIndex: index, endIndex: index + 1, segmentId: baseOptions.segmentId },
                        paragraphStyle: {
                            borderBottom: {
                                dashStyle: 'SOLID',
                                width: { magnitude: 1.5, unit: 'PT' },
                                color: { color: { rgbColor: { red: 0.8, green: 0.8, blue: 0.8 } } },
                            },
                            spaceAbove: { magnitude: 6, unit: 'PT' },
                            spaceBelow: { magnitude: 6, unit: 'PT' },
                        },
                        fields: 'borderBottom,spaceAbove,spaceBelow',
                    },
                };
                result.requests.push(hrStyleRequest);

                result.length = 1; // 1 char (\n)
                break;
            }
            default:
                console.warn(`[GoogleDocsMapper] Unsupported node type: ${node.type}`);
        }

        // If this was a top-level call (no override) AND we are not in a segment (Body), update global state
        if (overrideIndex === undefined) {
            this.context.requests.push(...result.requests);
            this.context.currentIndex += result.length;
        }

        return result;
    }
}
