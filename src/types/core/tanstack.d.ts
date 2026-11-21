/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import type { CustomerRow } from '@schemas/customer-schemas';
import type { TranslationRow } from '@schemas/translation-schemas';

export type TranslationsTableMetaType = {
    triggerTranslationDeletion?: (translation: TranslationRow) => void;
    triggerMultipleTranslationsDeletion?: (translations: TranslationRow[]) => void;
    triggerAssignmentToCustomer?: (translation: TranslationRow) => void;
    triggerTranslationCancellation?: (translation: TranslationRow) => void;
    triggerTranslationRetry?: (translation: TranslationRow) => void;
    triggerRegeneration?: (translation: TranslationRow) => void;
    triggerRetranslate?: (translation: TranslationRow) => void;
    triggerDownloadOriginal?: (translation: TranslationRow) => void;
};

export type CustomersTableMetaType = {
    triggerCustomerAddition?: () => void;
    triggerCustomerUpdate?: (customer: CustomerRow) => void;
    triggerCustomerDeletion?: (customer: CustomerRow) => void;
    triggerMultipleCustomersDeletion?: (customers: CustomerRow[]) => void;
};

export type TableMetaType = {
    isPlaceholderData?: boolean;
} & TranslationsTableMetaType &
    CustomersTableMetaType;

declare module '@tanstack/react-table' {
    type TableMeta = TranslationsTableMetaType | CustomersTableMetaType;
}
