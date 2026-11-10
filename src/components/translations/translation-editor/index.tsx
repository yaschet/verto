/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * TranslationEditor Module
 * Main export file
 */

// Main component
export { TranslationEditor } from './translation-editor';

// Hooks
export { useToolbarState, type ToolbarState } from './hooks/use-toolbar-state';
export { useTableControls, type TableControls } from './hooks/use-table-controls';
export { useEditorConfig } from './hooks/use-editor-config';

// Extensions
export { createExtensions } from './extensions';
export { Spacer } from './extensions/custom/spacer';
export { DescriptionList } from './extensions/custom/description-list';
export { DescriptionItem } from './extensions/custom/description-item';
export { DescriptionTerm } from './extensions/custom/description-term';
export { DescriptionValue } from './extensions/custom/description-value';

export { ThematicBreak } from './extensions/custom/thematic-break';

// Components (for advanced customization)
export { Toolbar } from './components/toolbar';
export { EditorBubbleMenu } from './components/bubble-menu';
export { EditorDragHandle } from './components/drag-handle';
export { CharacterCount } from './components/character-count';
export { TableFloatingMenu, TableContextMenu } from './components/table-menu';
