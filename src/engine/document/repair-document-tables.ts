/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * Repair Tables in Normalised Document
 *
 * This utility applies table structure repair to all tables in a NormalisedDocument.
 * It's designed to be called in the translation pipeline BEFORE storing to the database,
 * ensuring that translated_document is stored with valid table structures.
 *
 * The repairTableStructure function handles:
 * - Calculating expected column count from the widest row
 * - Building occupancy maps for rowspan/colspan
 * - Filling missing cells with empty placeholders
 * - Trimming excess cells and capping rowspan values
 */

import type { ContentNode, NormalisedDocument } from '@/engine/document/types';
import { repairTableStructure } from '@/engine/document/repair-table-structure';
import type { JSONContent } from '@tiptap/core';

/**
 * Repairs all tables in a NormalisedDocument.
 * This should be called before storing to ensure valid table structures.
 *
 * @param document - The document to repair
 * @returns Document with all tables repaired
 */
export function repairDocumentTables(document: NormalisedDocument): NormalisedDocument {
    if (!document || !document.content || !Array.isArray(document.content)) {
        return document;
    }

    let tablesRepaired = 0;

    // Recursively process all nodes
    function processNode(node: JSONContent): JSONContent {
        if (!node) return node;

        // If this is a table, repair it
        if (node.type === 'table') {
            tablesRepaired++;
            return repairTableStructure(node);
        }

        // If node has content array, process children
        if (node.content && Array.isArray(node.content)) {
            return {
                ...node,
                content: node.content.map(processNode),
            };
        }

        return node;
    }

    // Process all nodes and cast back to ContentNode[]
    // The repair function preserves the structure, just fixes table cells
    const repairedContent = document.content.map((node) => processNode(node as JSONContent)) as ContentNode[];

    if (tablesRepaired > 0) {
        console.log(`[repairDocumentTables] Repaired ${tablesRepaired} table(s) in document`);
    }

    return {
        ...document,
        content: repairedContent,
    };
}
