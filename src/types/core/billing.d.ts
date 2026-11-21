/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import type { Enums } from '@/types/database/database';
import type { ExtendedTableRow } from '@/types/database/database.extended';

export type Credit = number;

export type CreditsTransaction = ExtendedTableRow<'credits_transactions'>;

export type CreditsTransactionType = Enums<'credits_transaction_type'>;
