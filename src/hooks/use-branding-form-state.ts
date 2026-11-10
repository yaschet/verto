/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useReducer, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { updateBrandingSettings } from '@actions/services/branding/update-branding-settings';
import { toast } from 'sonner';
import type {
    CertificationStampPlacement,
    CertificationStampSize,
    ExtendedBrandingSettings,
    FooterTextContent,
    HeaderTextContent,
} from '@/types/document/branding-settings';

/**
 * Branding Form State Hook
 *
 * Implements Notion/Figma-level form performance:
 * 1. Local state is the SINGLE SOURCE OF TRUTH for UI
 * 2. All inputs update local state instantly (no lag)
 * 3. Preview reads from local state (always in sync)
 * 4. Server sync is decoupled and debounced in background
 * 5. No race conditions - local state always wins during editing
 *
 * @see https://epicreact.dev/improve-the-performance-of-your-react-forms
 */

type BrandingFormState = ExtendedBrandingSettings & {
    /** Whether form has been initialized from server */
    isInitialized: boolean;
    /** Whether there are unsaved changes */
    isDirty: boolean;
    /** Whether currently saving to server */
    isSaving: boolean;
    /** Last save error, if any */
    lastError: string | null;
};

type BrandingFormAction =
    | { type: 'INITIALIZE'; payload: ExtendedBrandingSettings }
    | { type: 'UPDATE'; payload: Partial<ExtendedBrandingSettings> }
    | { type: 'SAVE_START' }
    | { type: 'SAVE_SUCCESS' }
    | { type: 'SAVE_ERROR'; payload: string }
    | { type: 'RESET'; payload: ExtendedBrandingSettings }
    | { type: 'MARK_CLEAN' };

const initialState: BrandingFormState = {
    enabled: false,
    logoUrl: null,
    companyName: null,
    headerContent: null,
    footerContent: null,
    showPageNumbers: true,
    showCertificationStamp: false,
    certificationNumber: null,
    certificationStampUrl: null,
    certificationStampPlacement: 'page_bottom_right_margin',
    certificationStampSize: 'md',
    watermarkText: null,
    watermarkPreset: 'light',

    showTranslationDirection: true,
    isInitialized: false,
    isDirty: false,
    isSaving: false,
    lastError: null,
};

function brandingFormReducer(state: BrandingFormState, action: BrandingFormAction): BrandingFormState {
    switch (action.type) {
        case 'INITIALIZE':
            // Only initialize if not already initialized or if explicitly reset
            if (state.isInitialized) return state;
            return {
                ...state,
                ...action.payload,
                isInitialized: true,
                isDirty: false,
            };

        case 'UPDATE':
            return {
                ...state,
                ...action.payload,
                isDirty: true,
                lastError: null,
            };

        case 'SAVE_START':
            return {
                ...state,
                isSaving: true,
            };

        case 'SAVE_SUCCESS':
            return {
                ...state,
                isSaving: false,
                isDirty: false,
                lastError: null,
            };

        case 'SAVE_ERROR':
            return {
                ...state,
                isSaving: false,
                lastError: action.payload,
            };

        case 'RESET':
            return {
                ...state,
                ...action.payload,
                isInitialized: true,
                isDirty: false,
                isSaving: false,
                lastError: null,
            };

        case 'MARK_CLEAN':
            return {
                ...state,
                isDirty: false,
            };

        default:
            return state;
    }
}

export function useBrandingFormState(serverSettings: ExtendedBrandingSettings | null) {
    const [state, dispatch] = useReducer(brandingFormReducer, initialState);
    const queryClient = useQueryClient();

    // Refs for debouncing
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pendingChangesRef = useRef<Partial<ExtendedBrandingSettings>>({});
    const lastSavedRef = useRef<string>('');

    // Initialize from server data (only once)
    useEffect(() => {
        if (serverSettings && !state.isInitialized) {
            dispatch({ type: 'INITIALIZE', payload: serverSettings });
        }
    }, [serverSettings, state.isInitialized]);

    // Debounced save to server
    const saveToServer = useCallback(
        async (changes: Partial<ExtendedBrandingSettings>) => {
            // Create a hash of changes to detect duplicates
            const changesHash = JSON.stringify(changes);
            if (changesHash === lastSavedRef.current) {
                dispatch({ type: 'MARK_CLEAN' });
                return;
            }

            dispatch({ type: 'SAVE_START' });

            try {
                const result = await updateBrandingSettings(changes);
                if (result.error) {
                    dispatch({ type: 'SAVE_ERROR', payload: result.message || 'Failed to save' });
                    toast.error('Failed to save', { description: result.message });
                } else {
                    dispatch({ type: 'SAVE_SUCCESS' });
                    lastSavedRef.current = changesHash;
                    // Invalidate query to sync other components (but don't refetch immediately)
                    queryClient.invalidateQueries({ queryKey: ['user-profile-query'], refetchType: 'none' });
                }
            } catch (error) {
                const message = error instanceof Error ? (error as Error).message : 'Unknown error';
                dispatch({ type: 'SAVE_ERROR', payload: message });
                toast.error('Failed to save', { description: message });
            }
        },
        [queryClient],
    );

    // Schedule debounced save
    const scheduleSave = useCallback(
        (changes: Partial<ExtendedBrandingSettings>) => {
            // Accumulate changes
            pendingChangesRef.current = { ...pendingChangesRef.current, ...changes };

            // Clear existing timer
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            // Schedule save after 800ms of inactivity
            saveTimeoutRef.current = setTimeout(() => {
                const batch = { ...pendingChangesRef.current };
                pendingChangesRef.current = {};
                if (Object.keys(batch).length > 0) {
                    saveToServer(batch);
                }
            }, 800);
        },
        [saveToServer],
    );

    // Update handlers - these update local state INSTANTLY
    const updateField = useCallback(
        <K extends keyof ExtendedBrandingSettings>(field: K, value: ExtendedBrandingSettings[K]) => {
            dispatch({ type: 'UPDATE', payload: { [field]: value } });
            scheduleSave({ [field]: value });
        },
        [scheduleSave],
    );

    // Convenience handlers for each field
    const setEnabled = useCallback((value: boolean) => updateField('enabled', value), [updateField]);
    const setLogoUrl = useCallback((value: string | null) => updateField('logoUrl', value), [updateField]);
    const setCompanyName = useCallback(
        (value: string | null) => updateField('companyName', value),
        [updateField],
    );
    const setHeaderContent = useCallback(
        (value: HeaderTextContent | null) => updateField('headerContent', value),
        [updateField],
    );
    const setFooterContent = useCallback(
        (value: FooterTextContent | null) => updateField('footerContent', value),
        [updateField],
    );
    const setShowPageNumbers = useCallback(
        (value: boolean) => updateField('showPageNumbers', value),
        [updateField],
    );
    const setShowCertificationStamp = useCallback(
        (value: boolean) => updateField('showCertificationStamp', value),
        [updateField],
    );
    const setCertificationNumber = useCallback(
        (value: string | null) => updateField('certificationNumber', value),
        [updateField],
    );
    const setCertificationStampUrl = useCallback(
        (value: string | null) => updateField('certificationStampUrl', value),
        [updateField],
    );
    const setCertificationStampPlacement = useCallback(
        (value: CertificationStampPlacement) => updateField('certificationStampPlacement', value),
        [updateField],
    );
    const setCertificationStampSize = useCallback(
        (value: CertificationStampSize) => updateField('certificationStampSize', value),
        [updateField],
    );
    const setWatermarkText = useCallback(
        (value: string | null) => updateField('watermarkText', value),
        [updateField],
    );
    const setWatermarkPreset = useCallback(
        (value: 'light' | 'dark' | 'off') => updateField('watermarkPreset', value),
        [updateField],
    );

    const setShowTranslationDirection = useCallback(
        (value: boolean) => updateField('showTranslationDirection', value),
        [updateField],
    );

    // Reset to defaults (immediate server update)
    const resetToDefaults = useCallback(async () => {
        // Clear any pending saves
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            pendingChangesRef.current = {};
        }

        const defaults: ExtendedBrandingSettings = {
            enabled: false,
            logoUrl: null,
            companyName: null,
            headerContent: null,
            footerContent: null,
            showPageNumbers: true,
            showCertificationStamp: false,
            certificationNumber: null,
            certificationStampUrl: null,
            certificationStampPlacement: 'page_bottom_right_margin',
            certificationStampSize: 'md',
            watermarkText: null,
            watermarkPreset: 'light',

            showTranslationDirection: true,
        };

        // Update local state immediately
        dispatch({ type: 'RESET', payload: defaults });

        // Save to server immediately
        dispatch({ type: 'SAVE_START' });
        try {
            const result = await updateBrandingSettings(defaults);
            if (result.error) {
                dispatch({ type: 'SAVE_ERROR', payload: result.message || 'Failed to reset' });
                toast.error('Failed to reset settings');
            } else {
                dispatch({ type: 'SAVE_SUCCESS' });
                toast.success('Settings reset to defaults');
                queryClient.invalidateQueries({ queryKey: ['user-profile-query'] });
            }
        } catch (error) {
            const message = error instanceof Error ? (error as Error).message : 'Unknown error';
            dispatch({ type: 'SAVE_ERROR', payload: message });
            toast.error('Failed to reset settings');
        }
    }, [queryClient]);

    // Flush pending changes immediately (call on unmount or explicit save)
    const flushChanges = useCallback(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        const batch = { ...pendingChangesRef.current };
        pendingChangesRef.current = {};
        if (Object.keys(batch).length > 0) {
            saveToServer(batch);
        }
    }, [saveToServer]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            // Flush any pending changes
            const batch = { ...pendingChangesRef.current };
            if (Object.keys(batch).length > 0) {
                // Fire and forget - component is unmounting
                updateBrandingSettings(batch).catch(console.error);
            }
        };
    }, []);

    // Extract settings for UI (excludes meta state)
    const settings: ExtendedBrandingSettings = {
        enabled: state.enabled,
        logoUrl: state.logoUrl,
        companyName: state.companyName,
        headerContent: state.headerContent,
        footerContent: state.footerContent,
        showPageNumbers: state.showPageNumbers,
        showCertificationStamp: state.showCertificationStamp,
        certificationNumber: state.certificationNumber,
        certificationStampUrl: state.certificationStampUrl,
        certificationStampPlacement: state.certificationStampPlacement,
        certificationStampSize: state.certificationStampSize,
        watermarkText: state.watermarkText,
        watermarkPreset: state.watermarkPreset,

        showTranslationDirection: state.showTranslationDirection,
    };

    return {
        // Current form state (use this for UI)
        settings,

        // Meta state
        isInitialized: state.isInitialized,
        isDirty: state.isDirty,
        isSaving: state.isSaving,
        lastError: state.lastError,

        // Field setters (instant local update + debounced server sync)
        setEnabled,
        setLogoUrl,
        setCompanyName,
        setHeaderContent,
        setFooterContent,
        setShowPageNumbers,
        setShowCertificationStamp,
        setCertificationNumber,
        setCertificationStampUrl,
        setCertificationStampPlacement,
        setCertificationStampSize,
        setWatermarkText,
        setWatermarkPreset,

        setShowTranslationDirection,

        // Actions
        resetToDefaults,
        flushChanges,
    };
}
