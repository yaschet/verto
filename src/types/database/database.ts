/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
    auth: {
        Tables: {
            audit_log_entries: {
                Row: {
                    created_at: string | null;
                    id: string;
                    instance_id: string | null;
                    ip_address: string;
                    payload: Json | null;
                };
                Insert: {
                    created_at?: string | null;
                    id: string;
                    instance_id?: string | null;
                    ip_address?: string;
                    payload?: Json | null;
                };
                Update: {
                    created_at?: string | null;
                    id?: string;
                    instance_id?: string | null;
                    ip_address?: string;
                    payload?: Json | null;
                };
                Relationships: [];
            };
            flow_state: {
                Row: {
                    auth_code: string;
                    auth_code_issued_at: string | null;
                    authentication_method: string;
                    code_challenge: string;
                    code_challenge_method: Database['auth']['Enums']['code_challenge_method'];
                    created_at: string | null;
                    id: string;
                    provider_access_token: string | null;
                    provider_refresh_token: string | null;
                    provider_type: string;
                    updated_at: string | null;
                    user_id: string | null;
                };
                Insert: {
                    auth_code: string;
                    auth_code_issued_at?: string | null;
                    authentication_method: string;
                    code_challenge: string;
                    code_challenge_method: Database['auth']['Enums']['code_challenge_method'];
                    created_at?: string | null;
                    id: string;
                    provider_access_token?: string | null;
                    provider_refresh_token?: string | null;
                    provider_type: string;
                    updated_at?: string | null;
                    user_id?: string | null;
                };
                Update: {
                    auth_code?: string;
                    auth_code_issued_at?: string | null;
                    authentication_method?: string;
                    code_challenge?: string;
                    code_challenge_method?: Database['auth']['Enums']['code_challenge_method'];
                    created_at?: string | null;
                    id?: string;
                    provider_access_token?: string | null;
                    provider_refresh_token?: string | null;
                    provider_type?: string;
                    updated_at?: string | null;
                    user_id?: string | null;
                };
                Relationships: [];
            };
            identities: {
                Row: {
                    created_at: string | null;
                    email: string | null;
                    id: string;
                    identity_data: Json;
                    last_sign_in_at: string | null;
                    provider: string;
                    provider_id: string;
                    updated_at: string | null;
                    user_id: string;
                };
                Insert: {
                    created_at?: string | null;
                    email?: string | null;
                    id?: string;
                    identity_data: Json;
                    last_sign_in_at?: string | null;
                    provider: string;
                    provider_id: string;
                    updated_at?: string | null;
                    user_id: string;
                };
                Update: {
                    created_at?: string | null;
                    email?: string | null;
                    id?: string;
                    identity_data?: Json;
                    last_sign_in_at?: string | null;
                    provider?: string;
                    provider_id?: string;
                    updated_at?: string | null;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'identities_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            instances: {
                Row: {
                    created_at: string | null;
                    id: string;
                    raw_base_config: string | null;
                    updated_at: string | null;
                    uuid: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    id: string;
                    raw_base_config?: string | null;
                    updated_at?: string | null;
                    uuid?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    id?: string;
                    raw_base_config?: string | null;
                    updated_at?: string | null;
                    uuid?: string | null;
                };
                Relationships: [];
            };
            mfa_amr_claims: {
                Row: {
                    authentication_method: string;
                    created_at: string;
                    id: string;
                    session_id: string;
                    updated_at: string;
                };
                Insert: {
                    authentication_method: string;
                    created_at: string;
                    id: string;
                    session_id: string;
                    updated_at: string;
                };
                Update: {
                    authentication_method?: string;
                    created_at?: string;
                    id?: string;
                    session_id?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'mfa_amr_claims_session_id_fkey';
                        columns: ['session_id'];
                        isOneToOne: false;
                        referencedRelation: 'sessions';
                        referencedColumns: ['id'];
                    },
                ];
            };
            mfa_challenges: {
                Row: {
                    created_at: string;
                    factor_id: string;
                    id: string;
                    ip_address: unknown;
                    otp_code: string | null;
                    verified_at: string | null;
                    web_authn_session_data: Json | null;
                };
                Insert: {
                    created_at: string;
                    factor_id: string;
                    id: string;
                    ip_address: unknown;
                    otp_code?: string | null;
                    verified_at?: string | null;
                    web_authn_session_data?: Json | null;
                };
                Update: {
                    created_at?: string;
                    factor_id?: string;
                    id?: string;
                    ip_address?: unknown;
                    otp_code?: string | null;
                    verified_at?: string | null;
                    web_authn_session_data?: Json | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'mfa_challenges_auth_factor_id_fkey';
                        columns: ['factor_id'];
                        isOneToOne: false;
                        referencedRelation: 'mfa_factors';
                        referencedColumns: ['id'];
                    },
                ];
            };
            mfa_factors: {
                Row: {
                    created_at: string;
                    factor_type: Database['auth']['Enums']['factor_type'];
                    friendly_name: string | null;
                    id: string;
                    last_challenged_at: string | null;
                    last_webauthn_challenge_data: Json | null;
                    phone: string | null;
                    secret: string | null;
                    status: Database['auth']['Enums']['factor_status'];
                    updated_at: string;
                    user_id: string;
                    web_authn_aaguid: string | null;
                    web_authn_credential: Json | null;
                };
                Insert: {
                    created_at: string;
                    factor_type: Database['auth']['Enums']['factor_type'];
                    friendly_name?: string | null;
                    id: string;
                    last_challenged_at?: string | null;
                    last_webauthn_challenge_data?: Json | null;
                    phone?: string | null;
                    secret?: string | null;
                    status: Database['auth']['Enums']['factor_status'];
                    updated_at: string;
                    user_id: string;
                    web_authn_aaguid?: string | null;
                    web_authn_credential?: Json | null;
                };
                Update: {
                    created_at?: string;
                    factor_type?: Database['auth']['Enums']['factor_type'];
                    friendly_name?: string | null;
                    id?: string;
                    last_challenged_at?: string | null;
                    last_webauthn_challenge_data?: Json | null;
                    phone?: string | null;
                    secret?: string | null;
                    status?: Database['auth']['Enums']['factor_status'];
                    updated_at?: string;
                    user_id?: string;
                    web_authn_aaguid?: string | null;
                    web_authn_credential?: Json | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'mfa_factors_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            oauth_authorizations: {
                Row: {
                    approved_at: string | null;
                    authorization_code: string | null;
                    authorization_id: string;
                    client_id: string;
                    code_challenge: string | null;
                    code_challenge_method: Database['auth']['Enums']['code_challenge_method'] | null;
                    created_at: string;
                    expires_at: string;
                    id: string;
                    redirect_uri: string;
                    resource: string | null;
                    response_type: Database['auth']['Enums']['oauth_response_type'];
                    scope: string;
                    state: string | null;
                    status: Database['auth']['Enums']['oauth_authorization_status'];
                    user_id: string | null;
                };
                Insert: {
                    approved_at?: string | null;
                    authorization_code?: string | null;
                    authorization_id: string;
                    client_id: string;
                    code_challenge?: string | null;
                    code_challenge_method?: Database['auth']['Enums']['code_challenge_method'] | null;
                    created_at?: string;
                    expires_at?: string;
                    id: string;
                    redirect_uri: string;
                    resource?: string | null;
                    response_type?: Database['auth']['Enums']['oauth_response_type'];
                    scope: string;
                    state?: string | null;
                    status?: Database['auth']['Enums']['oauth_authorization_status'];
                    user_id?: string | null;
                };
                Update: {
                    approved_at?: string | null;
                    authorization_code?: string | null;
                    authorization_id?: string;
                    client_id?: string;
                    code_challenge?: string | null;
                    code_challenge_method?: Database['auth']['Enums']['code_challenge_method'] | null;
                    created_at?: string;
                    expires_at?: string;
                    id?: string;
                    redirect_uri?: string;
                    resource?: string | null;
                    response_type?: Database['auth']['Enums']['oauth_response_type'];
                    scope?: string;
                    state?: string | null;
                    status?: Database['auth']['Enums']['oauth_authorization_status'];
                    user_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'oauth_authorizations_client_id_fkey';
                        columns: ['client_id'];
                        isOneToOne: false;
                        referencedRelation: 'oauth_clients';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'oauth_authorizations_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            oauth_clients: {
                Row: {
                    client_name: string | null;
                    client_secret_hash: string | null;
                    client_type: Database['auth']['Enums']['oauth_client_type'];
                    client_uri: string | null;
                    created_at: string;
                    deleted_at: string | null;
                    grant_types: string;
                    id: string;
                    logo_uri: string | null;
                    redirect_uris: string;
                    registration_type: Database['auth']['Enums']['oauth_registration_type'];
                    updated_at: string;
                };
                Insert: {
                    client_name?: string | null;
                    client_secret_hash?: string | null;
                    client_type?: Database['auth']['Enums']['oauth_client_type'];
                    client_uri?: string | null;
                    created_at?: string;
                    deleted_at?: string | null;
                    grant_types: string;
                    id: string;
                    logo_uri?: string | null;
                    redirect_uris: string;
                    registration_type: Database['auth']['Enums']['oauth_registration_type'];
                    updated_at?: string;
                };
                Update: {
                    client_name?: string | null;
                    client_secret_hash?: string | null;
                    client_type?: Database['auth']['Enums']['oauth_client_type'];
                    client_uri?: string | null;
                    created_at?: string;
                    deleted_at?: string | null;
                    grant_types?: string;
                    id?: string;
                    logo_uri?: string | null;
                    redirect_uris?: string;
                    registration_type?: Database['auth']['Enums']['oauth_registration_type'];
                    updated_at?: string;
                };
                Relationships: [];
            };
            oauth_consents: {
                Row: {
                    client_id: string;
                    granted_at: string;
                    id: string;
                    revoked_at: string | null;
                    scopes: string;
                    user_id: string;
                };
                Insert: {
                    client_id: string;
                    granted_at?: string;
                    id: string;
                    revoked_at?: string | null;
                    scopes: string;
                    user_id: string;
                };
                Update: {
                    client_id?: string;
                    granted_at?: string;
                    id?: string;
                    revoked_at?: string | null;
                    scopes?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'oauth_consents_client_id_fkey';
                        columns: ['client_id'];
                        isOneToOne: false;
                        referencedRelation: 'oauth_clients';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'oauth_consents_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            one_time_tokens: {
                Row: {
                    created_at: string;
                    id: string;
                    relates_to: string;
                    token_hash: string;
                    token_type: Database['auth']['Enums']['one_time_token_type'];
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string;
                    id: string;
                    relates_to: string;
                    token_hash: string;
                    token_type: Database['auth']['Enums']['one_time_token_type'];
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    id?: string;
                    relates_to?: string;
                    token_hash?: string;
                    token_type?: Database['auth']['Enums']['one_time_token_type'];
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'one_time_tokens_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            refresh_tokens: {
                Row: {
                    created_at: string | null;
                    id: number;
                    instance_id: string | null;
                    parent: string | null;
                    revoked: boolean | null;
                    session_id: string | null;
                    token: string | null;
                    updated_at: string | null;
                    user_id: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    id?: number;
                    instance_id?: string | null;
                    parent?: string | null;
                    revoked?: boolean | null;
                    session_id?: string | null;
                    token?: string | null;
                    updated_at?: string | null;
                    user_id?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    id?: number;
                    instance_id?: string | null;
                    parent?: string | null;
                    revoked?: boolean | null;
                    session_id?: string | null;
                    token?: string | null;
                    updated_at?: string | null;
                    user_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'refresh_tokens_session_id_fkey';
                        columns: ['session_id'];
                        isOneToOne: false;
                        referencedRelation: 'sessions';
                        referencedColumns: ['id'];
                    },
                ];
            };
            saml_providers: {
                Row: {
                    attribute_mapping: Json | null;
                    created_at: string | null;
                    entity_id: string;
                    id: string;
                    metadata_url: string | null;
                    metadata_xml: string;
                    name_id_format: string | null;
                    sso_provider_id: string;
                    updated_at: string | null;
                };
                Insert: {
                    attribute_mapping?: Json | null;
                    created_at?: string | null;
                    entity_id: string;
                    id: string;
                    metadata_url?: string | null;
                    metadata_xml: string;
                    name_id_format?: string | null;
                    sso_provider_id: string;
                    updated_at?: string | null;
                };
                Update: {
                    attribute_mapping?: Json | null;
                    created_at?: string | null;
                    entity_id?: string;
                    id?: string;
                    metadata_url?: string | null;
                    metadata_xml?: string;
                    name_id_format?: string | null;
                    sso_provider_id?: string;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'saml_providers_sso_provider_id_fkey';
                        columns: ['sso_provider_id'];
                        isOneToOne: false;
                        referencedRelation: 'sso_providers';
                        referencedColumns: ['id'];
                    },
                ];
            };
            saml_relay_states: {
                Row: {
                    created_at: string | null;
                    flow_state_id: string | null;
                    for_email: string | null;
                    id: string;
                    redirect_to: string | null;
                    request_id: string;
                    sso_provider_id: string;
                    updated_at: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    flow_state_id?: string | null;
                    for_email?: string | null;
                    id: string;
                    redirect_to?: string | null;
                    request_id: string;
                    sso_provider_id: string;
                    updated_at?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    flow_state_id?: string | null;
                    for_email?: string | null;
                    id?: string;
                    redirect_to?: string | null;
                    request_id?: string;
                    sso_provider_id?: string;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'saml_relay_states_flow_state_id_fkey';
                        columns: ['flow_state_id'];
                        isOneToOne: false;
                        referencedRelation: 'flow_state';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'saml_relay_states_sso_provider_id_fkey';
                        columns: ['sso_provider_id'];
                        isOneToOne: false;
                        referencedRelation: 'sso_providers';
                        referencedColumns: ['id'];
                    },
                ];
            };
            schema_migrations: {
                Row: {
                    version: string;
                };
                Insert: {
                    version: string;
                };
                Update: {
                    version?: string;
                };
                Relationships: [];
            };
            sessions: {
                Row: {
                    aal: Database['auth']['Enums']['aal_level'] | null;
                    created_at: string | null;
                    factor_id: string | null;
                    id: string;
                    ip: unknown;
                    not_after: string | null;
                    oauth_client_id: string | null;
                    refresh_token_counter: number | null;
                    refresh_token_hmac_key: string | null;
                    refreshed_at: string | null;
                    tag: string | null;
                    updated_at: string | null;
                    user_agent: string | null;
                    user_id: string;
                };
                Insert: {
                    aal?: Database['auth']['Enums']['aal_level'] | null;
                    created_at?: string | null;
                    factor_id?: string | null;
                    id: string;
                    ip?: unknown;
                    not_after?: string | null;
                    oauth_client_id?: string | null;
                    refresh_token_counter?: number | null;
                    refresh_token_hmac_key?: string | null;
                    refreshed_at?: string | null;
                    tag?: string | null;
                    updated_at?: string | null;
                    user_agent?: string | null;
                    user_id: string;
                };
                Update: {
                    aal?: Database['auth']['Enums']['aal_level'] | null;
                    created_at?: string | null;
                    factor_id?: string | null;
                    id?: string;
                    ip?: unknown;
                    not_after?: string | null;
                    oauth_client_id?: string | null;
                    refresh_token_counter?: number | null;
                    refresh_token_hmac_key?: string | null;
                    refreshed_at?: string | null;
                    tag?: string | null;
                    updated_at?: string | null;
                    user_agent?: string | null;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'sessions_oauth_client_id_fkey';
                        columns: ['oauth_client_id'];
                        isOneToOne: false;
                        referencedRelation: 'oauth_clients';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'sessions_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            sso_domains: {
                Row: {
                    created_at: string | null;
                    domain: string;
                    id: string;
                    sso_provider_id: string;
                    updated_at: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    domain: string;
                    id: string;
                    sso_provider_id: string;
                    updated_at?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    domain?: string;
                    id?: string;
                    sso_provider_id?: string;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'sso_domains_sso_provider_id_fkey';
                        columns: ['sso_provider_id'];
                        isOneToOne: false;
                        referencedRelation: 'sso_providers';
                        referencedColumns: ['id'];
                    },
                ];
            };
            sso_providers: {
                Row: {
                    created_at: string | null;
                    disabled: boolean | null;
                    id: string;
                    resource_id: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    disabled?: boolean | null;
                    id: string;
                    resource_id?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    disabled?: boolean | null;
                    id?: string;
                    resource_id?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [];
            };
            users: {
                Row: {
                    aud: string | null;
                    banned_until: string | null;
                    confirmation_sent_at: string | null;
                    confirmation_token: string | null;
                    confirmed_at: string | null;
                    created_at: string | null;
                    deleted_at: string | null;
                    email: string | null;
                    email_change: string | null;
                    email_change_confirm_status: number | null;
                    email_change_sent_at: string | null;
                    email_change_token_current: string | null;
                    email_change_token_new: string | null;
                    email_confirmed_at: string | null;
                    encrypted_password: string | null;
                    id: string;
                    instance_id: string | null;
                    invited_at: string | null;
                    is_anonymous: boolean;
                    is_sso_user: boolean;
                    is_super_admin: boolean | null;
                    last_sign_in_at: string | null;
                    phone: string | null;
                    phone_change: string | null;
                    phone_change_sent_at: string | null;
                    phone_change_token: string | null;
                    phone_confirmed_at: string | null;
                    raw_app_meta_data: Json | null;
                    raw_user_meta_data: Json | null;
                    reauthentication_sent_at: string | null;
                    reauthentication_token: string | null;
                    recovery_sent_at: string | null;
                    recovery_token: string | null;
                    role: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    aud?: string | null;
                    banned_until?: string | null;
                    confirmation_sent_at?: string | null;
                    confirmation_token?: string | null;
                    confirmed_at?: string | null;
                    created_at?: string | null;
                    deleted_at?: string | null;
                    email?: string | null;
                    email_change?: string | null;
                    email_change_confirm_status?: number | null;
                    email_change_sent_at?: string | null;
                    email_change_token_current?: string | null;
                    email_change_token_new?: string | null;
                    email_confirmed_at?: string | null;
                    encrypted_password?: string | null;
                    id: string;
                    instance_id?: string | null;
                    invited_at?: string | null;
                    is_anonymous?: boolean;
                    is_sso_user?: boolean;
                    is_super_admin?: boolean | null;
                    last_sign_in_at?: string | null;
                    phone?: string | null;
                    phone_change?: string | null;
                    phone_change_sent_at?: string | null;
                    phone_change_token?: string | null;
                    phone_confirmed_at?: string | null;
                    raw_app_meta_data?: Json | null;
                    raw_user_meta_data?: Json | null;
                    reauthentication_sent_at?: string | null;
                    reauthentication_token?: string | null;
                    recovery_sent_at?: string | null;
                    recovery_token?: string | null;
                    role?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    aud?: string | null;
                    banned_until?: string | null;
                    confirmation_sent_at?: string | null;
                    confirmation_token?: string | null;
                    confirmed_at?: string | null;
                    created_at?: string | null;
                    deleted_at?: string | null;
                    email?: string | null;
                    email_change?: string | null;
                    email_change_confirm_status?: number | null;
                    email_change_sent_at?: string | null;
                    email_change_token_current?: string | null;
                    email_change_token_new?: string | null;
                    email_confirmed_at?: string | null;
                    encrypted_password?: string | null;
                    id?: string;
                    instance_id?: string | null;
                    invited_at?: string | null;
                    is_anonymous?: boolean;
                    is_sso_user?: boolean;
                    is_super_admin?: boolean | null;
                    last_sign_in_at?: string | null;
                    phone?: string | null;
                    phone_change?: string | null;
                    phone_change_sent_at?: string | null;
                    phone_change_token?: string | null;
                    phone_confirmed_at?: string | null;
                    raw_app_meta_data?: Json | null;
                    raw_user_meta_data?: Json | null;
                    reauthentication_sent_at?: string | null;
                    reauthentication_token?: string | null;
                    recovery_sent_at?: string | null;
                    recovery_token?: string | null;
                    role?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [];
            };
        };
        Views: Record<never, never>;
        Functions: {
            email: { Args: never; Returns: string };
            jwt: { Args: never; Returns: Json };
            role: { Args: never; Returns: string };
            uid: { Args: never; Returns: string };
        };
        Enums: {
            aal_level: 'aal1' | 'aal2' | 'aal3';
            code_challenge_method: 's256' | 'plain';
            factor_status: 'unverified' | 'verified';
            factor_type: 'totp' | 'webauthn' | 'phone';
            oauth_authorization_status: 'pending' | 'approved' | 'denied' | 'expired';
            oauth_client_type: 'public' | 'confidential';
            oauth_registration_type: 'dynamic' | 'manual';
            oauth_response_type: 'code';
            one_time_token_type:
                | 'confirmation_token'
                | 'reauthentication_token'
                | 'recovery_token'
                | 'email_change_token_new'
                | 'email_change_token_current'
                | 'phone_change_token';
        };
        CompositeTypes: Record<never, never>;
    };
    extensions: {
        Tables: {
            wrappers_fdw_stats: {
                Row: {
                    bytes_in: number | null;
                    bytes_out: number | null;
                    create_times: number | null;
                    created_at: string;
                    fdw_name: string;
                    metadata: Json | null;
                    rows_in: number | null;
                    rows_out: number | null;
                    updated_at: string;
                };
                Insert: {
                    bytes_in?: number | null;
                    bytes_out?: number | null;
                    create_times?: number | null;
                    created_at?: string;
                    fdw_name: string;
                    metadata?: Json | null;
                    rows_in?: number | null;
                    rows_out?: number | null;
                    updated_at?: string;
                };
                Update: {
                    bytes_in?: number | null;
                    bytes_out?: number | null;
                    create_times?: number | null;
                    created_at?: string;
                    fdw_name?: string;
                    metadata?: Json | null;
                    rows_in?: number | null;
                    rows_out?: number | null;
                    updated_at?: string;
                };
                Relationships: [];
            };
        };
        Views: {
            pg_stat_statements: {
                Row: {
                    blk_read_time: number | null;
                    blk_write_time: number | null;
                    calls: number | null;
                    dbid: unknown;
                    jit_emission_count: number | null;
                    jit_emission_time: number | null;
                    jit_functions: number | null;
                    jit_generation_time: number | null;
                    jit_inlining_count: number | null;
                    jit_inlining_time: number | null;
                    jit_optimization_count: number | null;
                    jit_optimization_time: number | null;
                    local_blks_dirtied: number | null;
                    local_blks_hit: number | null;
                    local_blks_read: number | null;
                    local_blks_written: number | null;
                    max_exec_time: number | null;
                    max_plan_time: number | null;
                    mean_exec_time: number | null;
                    mean_plan_time: number | null;
                    min_exec_time: number | null;
                    min_plan_time: number | null;
                    plans: number | null;
                    query: string | null;
                    queryid: number | null;
                    rows: number | null;
                    shared_blks_dirtied: number | null;
                    shared_blks_hit: number | null;
                    shared_blks_read: number | null;
                    shared_blks_written: number | null;
                    stddev_exec_time: number | null;
                    stddev_plan_time: number | null;
                    temp_blk_read_time: number | null;
                    temp_blk_write_time: number | null;
                    temp_blks_read: number | null;
                    temp_blks_written: number | null;
                    toplevel: boolean | null;
                    total_exec_time: number | null;
                    total_plan_time: number | null;
                    userid: unknown;
                    wal_bytes: number | null;
                    wal_fpi: number | null;
                    wal_records: number | null;
                };
                Relationships: [];
            };
            pg_stat_statements_info: {
                Row: {
                    dealloc: number | null;
                    stats_reset: string | null;
                };
                Relationships: [];
            };
        };
        Functions: {
            airtable_fdw_handler: { Args: never; Returns: unknown };
            airtable_fdw_meta: {
                Args: never;
                Returns: {
                    author: string;
                    name: string;
                    version: string;
                    website: string;
                }[];
            };
            airtable_fdw_validator: {
                Args: { catalog: unknown; options: string[] };
                Returns: undefined;
            };
            algorithm_sign: {
                Args: { algorithm: string; secret: string; signables: string };
                Returns: string;
            };
            auth0_fdw_handler: { Args: never; Returns: unknown };
            auth0_fdw_meta: {
                Args: never;
                Returns: {
                    author: string;
                    name: string;
                    version: string;
                    website: string;
                }[];
            };
            auth0_fdw_validator: {
                Args: { catalog: unknown; options: string[] };
                Returns: undefined;
            };
            big_query_fdw_handler: { Args: never; Returns: unknown };
            big_query_fdw_meta: {
                Args: never;
                Returns: {
                    author: string;
                    name: string;
                    version: string;
                    website: string;
                }[];
            };
            big_query_fdw_validator: {
                Args: { catalog: unknown; options: string[] };
                Returns: undefined;
            };
            click_house_fdw_handler: { Args: never; Returns: unknown };
            click_house_fdw_meta: {
                Args: never;
                Returns: {
                    author: string;
                    name: string;
                    version: string;
                    website: string;
                }[];
            };
            click_house_fdw_validator: {
                Args: { catalog: unknown; options: string[] };
                Returns: undefined;
            };
            cognito_fdw_handler: { Args: never; Returns: unknown };
            cognito_fdw_meta: {
                Args: never;
                Returns: {
                    author: string;
                    name: string;
                    version: string;
                    website: string;
                }[];
            };
            cognito_fdw_validator: {
                Args: { catalog: unknown; options: string[] };
                Returns: undefined;
            };
            dearmor: { Args: { '': string }; Returns: string };
            firebase_fdw_handler: { Args: never; Returns: unknown };
            firebase_fdw_meta: {
                Args: never;
                Returns: {
                    author: string;
                    name: string;
                    version: string;
                    website: string;
                }[];
            };
            firebase_fdw_validator: {
                Args: { catalog: unknown; options: string[] };
                Returns: undefined;
            };
            gen_random_uuid: { Args: never; Returns: string };
            gen_salt: { Args: { '': string }; Returns: string };
            hello_world_fdw_handler: { Args: never; Returns: unknown };
            hello_world_fdw_meta: {
                Args: never;
                Returns: {
                    author: string;
                    name: string;
                    version: string;
                    website: string;
                }[];
            };
            hello_world_fdw_validator: {
                Args: { catalog: unknown; options: string[] };
                Returns: undefined;
            };
            logflare_fdw_handler: { Args: never; Returns: unknown };
            logflare_fdw_meta: {
                Args: never;
                Returns: {
                    author: string;
                    name: string;
                    version: string;
                    website: string;
                }[];
            };
            logflare_fdw_validator: {
                Args: { catalog: unknown; options: string[] };
                Returns: undefined;
            };
            mssql_fdw_handler: { Args: never; Returns: unknown };
            mssql_fdw_meta: {
                Args: never;
                Returns: {
                    author: string;
                    name: string;
                    version: string;
                    website: string;
                }[];
            };
            mssql_fdw_validator: {
                Args: { catalog: unknown; options: string[] };
                Returns: undefined;
            };
            pg_stat_statements: {
                Args: { showtext: boolean };
                Returns: Record<string, unknown>[];
            };
            pg_stat_statements_info: { Args: never; Returns: Record<string, unknown> };
            pg_stat_statements_reset: {
                Args: { dbid?: unknown; queryid?: number; userid?: unknown };
                Returns: undefined;
            };
            pgp_armor_headers: {
                Args: { '': string };
                Returns: Record<string, unknown>[];
            };
            postgres_fdw_disconnect: { Args: { '': string }; Returns: boolean };
            postgres_fdw_disconnect_all: { Args: never; Returns: boolean };
            postgres_fdw_get_connections: {
                Args: never;
                Returns: Record<string, unknown>[];
            };
            postgres_fdw_handler: { Args: never; Returns: unknown };
            redis_fdw_handler: { Args: never; Returns: unknown };
            redis_fdw_meta: {
                Args: never;
                Returns: {
                    author: string;
                    name: string;
                    version: string;
                    website: string;
                }[];
            };
            redis_fdw_validator: {
                Args: { catalog: unknown; options: string[] };
                Returns: undefined;
            };
            s3_fdw_handler: { Args: never; Returns: unknown };
            s3_fdw_meta: {
                Args: never;
                Returns: {
                    author: string;
                    name: string;
                    version: string;
                    website: string;
                }[];
            };
            s3_fdw_validator: {
                Args: { catalog: unknown; options: string[] };
                Returns: undefined;
            };
            sign: {
                Args: { algorithm?: string; payload: Json; secret: string };
                Returns: string;
            };
            stripe_fdw_handler: { Args: never; Returns: unknown };
            stripe_fdw_meta: {
                Args: never;
                Returns: {
                    author: string;
                    name: string;
                    version: string;
                    website: string;
                }[];
            };
            stripe_fdw_validator: {
                Args: { catalog: unknown; options: string[] };
                Returns: undefined;
            };
            try_cast_double: { Args: { inp: string }; Returns: number };
            url_decode: { Args: { data: string }; Returns: string };
            url_encode: { Args: { data: string }; Returns: string };
            uuid_generate_v1: { Args: never; Returns: string };
            uuid_generate_v1mc: { Args: never; Returns: string };
            uuid_generate_v3: {
                Args: { name: string; namespace: string };
                Returns: string;
            };
            uuid_generate_v4: { Args: never; Returns: string };
            uuid_generate_v5: {
                Args: { name: string; namespace: string };
                Returns: string;
            };
            uuid_nil: { Args: never; Returns: string };
            uuid_ns_dns: { Args: never; Returns: string };
            uuid_ns_oid: { Args: never; Returns: string };
            uuid_ns_url: { Args: never; Returns: string };
            uuid_ns_x500: { Args: never; Returns: string };
            verify: {
                Args: { algorithm?: string; secret: string; token: string };
                Returns: {
                    header: Json;
                    payload: Json;
                    valid: boolean;
                }[];
            };
            wasm_fdw_handler: { Args: never; Returns: unknown };
            wasm_fdw_meta: {
                Args: never;
                Returns: {
                    author: string;
                    name: string;
                    version: string;
                    website: string;
                }[];
            };
            wasm_fdw_validator: {
                Args: { catalog: unknown; options: string[] };
                Returns: undefined;
            };
        };
        Enums: Record<never, never>;
        CompositeTypes: Record<never, never>;
    };
    graphql_public: {
        Tables: Record<never, never>;
        Views: Record<never, never>;
        Functions: {
            graphql: {
                Args: {
                    extensions?: Json;
                    operationName?: string;
                    query?: string;
                    variables?: Json;
                };
                Returns: Json;
            };
        };
        Enums: Record<never, never>;
        CompositeTypes: Record<never, never>;
    };
    public: {
        Tables: {
            active_users: {
                Row: {
                    created_at: string;
                    last_active: string;
                    profile_id: string;
                };
                Insert: {
                    created_at?: string;
                    last_active?: string;
                    profile_id: string;
                };
                Update: {
                    created_at?: string;
                    last_active?: string;
                    profile_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'active_users_profile_id_fkey';
                        columns: ['profile_id'];
                        isOneToOne: true;
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            credits: {
                Row: {
                    amount: number;
                    created_at: string;
                    id: string;
                    profile_id: string;
                    updated_at: string;
                };
                Insert: {
                    amount: number;
                    created_at?: string;
                    id?: string;
                    profile_id: string;
                    updated_at?: string;
                };
                Update: {
                    amount?: number;
                    created_at?: string;
                    id?: string;
                    profile_id?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'credits_profile_id_fkey';
                        columns: ['profile_id'];
                        isOneToOne: true;
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            credits_transactions: {
                Row: {
                    created_at: string;
                    credits: number;
                    description: string | null;
                    details: Json | null;
                    id: string;
                    profile_id: string;
                    translation_id: string | null;
                    type: Database['public']['Enums']['credits_transaction_type'];
                    updated_at: string;
                };
                Insert: {
                    created_at?: string;
                    credits: number;
                    description?: string | null;
                    details?: Json | null;
                    id?: string;
                    profile_id: string;
                    translation_id?: string | null;
                    type: Database['public']['Enums']['credits_transaction_type'];
                    updated_at?: string;
                };
                Update: {
                    created_at?: string;
                    credits?: number;
                    description?: string | null;
                    details?: Json | null;
                    id?: string;
                    profile_id?: string;
                    translation_id?: string | null;
                    type?: Database['public']['Enums']['credits_transaction_type'];
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'credits_transactions_profile_id_fkey';
                        columns: ['profile_id'];
                        isOneToOne: false;
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'credits_transactions_translation_id_fkey';
                        columns: ['translation_id'];
                        isOneToOne: false;
                        referencedRelation: 'extended_translation_view';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'credits_transactions_translation_id_fkey';
                        columns: ['translation_id'];
                        isOneToOne: false;
                        referencedRelation: 'translations';
                        referencedColumns: ['id'];
                    },
                ];
            };
            customers: {
                Row: {
                    created_at: string;
                    display_name: string;
                    email: string;
                    id: string;
                    phone: string | null;
                    profile_id: string;
                    updated_at: string;
                };
                Insert: {
                    created_at?: string;
                    display_name: string;
                    email: string;
                    id?: string;
                    phone?: string | null;
                    profile_id?: string;
                    updated_at?: string;
                };
                Update: {
                    created_at?: string;
                    display_name?: string;
                    email?: string;
                    id?: string;
                    phone?: string | null;
                    profile_id?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'customers_profile_id_fkey';
                        columns: ['profile_id'];
                        isOneToOne: false;
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            newsletter_subscriptions: {
                Row: {
                    created_at: string;
                    email: string;
                    id: number;
                    source: Database['public']['Enums']['subscription_source'] | null;
                    status: Database['public']['Enums']['subscription_status'];
                    subscription_date: string;
                    unsubscribed_at: string | null;
                    updated_at: string;
                };
                Insert: {
                    created_at?: string;
                    email: string;
                    id?: number;
                    source?: Database['public']['Enums']['subscription_source'] | null;
                    status?: Database['public']['Enums']['subscription_status'];
                    subscription_date?: string;
                    unsubscribed_at?: string | null;
                    updated_at?: string;
                };
                Update: {
                    created_at?: string;
                    email?: string;
                    id?: number;
                    source?: Database['public']['Enums']['subscription_source'] | null;
                    status?: Database['public']['Enums']['subscription_status'];
                    subscription_date?: string;
                    unsubscribed_at?: string | null;
                    updated_at?: string;
                };
                Relationships: [];
            };
            notifications: {
                Row: {
                    created_at: string;
                    id: string;
                    link: string | null;
                    message: string;
                    metadata: Json | null;
                    profile_id: string;
                    read: boolean;
                    read_at: string | null;
                    title: string;
                    type: Database['public']['Enums']['notification_type'];
                    updated_at: string;
                };
                Insert: {
                    created_at?: string;
                    id?: string;
                    link?: string | null;
                    message: string;
                    metadata?: Json | null;
                    profile_id: string;
                    read?: boolean;
                    read_at?: string | null;
                    title: string;
                    type: Database['public']['Enums']['notification_type'];
                    updated_at?: string;
                };
                Update: {
                    created_at?: string;
                    id?: string;
                    link?: string | null;
                    message?: string;
                    metadata?: Json | null;
                    profile_id?: string;
                    read?: boolean;
                    read_at?: string | null;
                    title?: string;
                    type?: Database['public']['Enums']['notification_type'];
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'notifications_profile_id_fkey';
                        columns: ['profile_id'];
                        isOneToOne: false;
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            profiles: {
                Row: {
                    account_status: Database['public']['Enums']['account_status'];
                    address: string | null;
                    avatar_url: string | null;
                    city: string | null;
                    company_name: string | null;
                    country: string | null;
                    created_at: string | null;
                    date_of_birth: string | null;
                    doc_branding_enabled: boolean;
                    doc_certification_number: string | null;
                    doc_company_name: string | null;
                    doc_footer_text: string | null;
                    doc_header_text: string | null;
                    doc_logo_url: string | null;
                    doc_show_certification_stamp: boolean;
                    doc_certification_stamp_url: string | null;
                    doc_certification_stamp_placement: string | null;
                    doc_certification_stamp_size: string | null;
                    doc_show_page_numbers: boolean;
                    doc_watermark_text: string | null;
                    doc_watermark_preset: string | null;
                    email: string;
                    first_name: string | null;
                    full_name: string | null;
                    id: string;
                    is_profile_complete: boolean;
                    last_name: string | null;
                    notification_credit_low: boolean;
                    notification_email_enabled: boolean;
                    notification_marketing: boolean;
                    notification_product_updates: boolean;
                    notification_translation_complete: boolean;
                    notification_translation_failed: boolean;
                    notification_translation_review: boolean;
                    phone: string | null;
                    professional_affiliations: Json | null;
                    qualifications: Json | null;
                    source_language: string;
                    specializations: Json | null;
                    state: string | null;
                    status: Database['public']['Enums']['profile_status'];
                    stripe_customer_id: string | null;
                    target_language: string;
                    translation_experience: string | null;
                    updated_at: string | null;
                    zip_code: string | null;
                };
                Insert: {
                    account_status?: Database['public']['Enums']['account_status'];
                    address?: string | null;
                    avatar_url?: string | null;
                    city?: string | null;
                    company_name?: string | null;
                    country?: string | null;
                    created_at?: string | null;
                    date_of_birth?: string | null;
                    doc_branding_enabled?: boolean;
                    doc_certification_number?: string | null;
                    doc_company_name?: string | null;
                    doc_footer_text?: string | null;
                    doc_header_text?: string | null;
                    doc_logo_url?: string | null;
                    doc_show_certification_stamp?: boolean;
                    doc_certification_stamp_url?: string | null;
                    doc_certification_stamp_placement?: string | null;
                    doc_certification_stamp_size?: string | null;
                    doc_show_page_numbers?: boolean;
                    doc_watermark_text?: string | null;
                    doc_watermark_preset?: string | null;
                    email?: string;
                    first_name?: string | null;
                    full_name?: string | null;
                    id: string;
                    is_profile_complete?: boolean;
                    last_name?: string | null;
                    notification_credit_low?: boolean;
                    notification_email_enabled?: boolean;
                    notification_marketing?: boolean;
                    notification_product_updates?: boolean;
                    notification_translation_complete?: boolean;
                    notification_translation_failed?: boolean;
                    notification_translation_review?: boolean;
                    phone?: string | null;
                    professional_affiliations?: Json | null;
                    qualifications?: Json | null;
                    source_language?: string;
                    specializations?: Json | null;
                    state?: string | null;
                    status?: Database['public']['Enums']['profile_status'];
                    stripe_customer_id?: string | null;
                    target_language?: string;
                    translation_experience?: string | null;
                    updated_at?: string | null;
                    zip_code?: string | null;
                };
                Update: {
                    account_status?: Database['public']['Enums']['account_status'];
                    address?: string | null;
                    avatar_url?: string | null;
                    city?: string | null;
                    company_name?: string | null;
                    country?: string | null;
                    created_at?: string | null;
                    date_of_birth?: string | null;
                    doc_branding_enabled?: boolean;
                    doc_certification_number?: string | null;
                    doc_company_name?: string | null;
                    doc_footer_text?: string | null;
                    doc_header_text?: string | null;
                    doc_logo_url?: string | null;
                    doc_show_certification_stamp?: boolean;
                    doc_certification_stamp_url?: string | null;
                    doc_certification_stamp_placement?: string | null;
                    doc_certification_stamp_size?: string | null;
                    doc_show_page_numbers?: boolean;
                    doc_watermark_text?: string | null;
                    doc_watermark_preset?: string | null;
                    email?: string;
                    first_name?: string | null;
                    full_name?: string | null;
                    id?: string;
                    is_profile_complete?: boolean;
                    last_name?: string | null;
                    notification_credit_low?: boolean;
                    notification_email_enabled?: boolean;
                    notification_marketing?: boolean;
                    notification_product_updates?: boolean;
                    notification_translation_complete?: boolean;
                    notification_translation_failed?: boolean;
                    notification_translation_review?: boolean;
                    phone?: string | null;
                    professional_affiliations?: Json | null;
                    qualifications?: Json | null;
                    source_language?: string;
                    specializations?: Json | null;
                    state?: string | null;
                    status?: Database['public']['Enums']['profile_status'];
                    stripe_customer_id?: string | null;
                    target_language?: string;
                    translation_experience?: string | null;
                    updated_at?: string | null;
                    zip_code?: string | null;
                };
                Relationships: [];
            };
            templates: {
                Row: {
                    collection_id: string | null;
                    content_details: Json | null;
                    content_type: Database['public']['Enums']['content_type'][];
                    created_at: string;
                    description: string | null;
                    id: string;
                    label: string | null;
                    name: string;
                    slug: string;
                    status: Database['public']['Enums']['template_status'];
                    tags: string[] | null;
                    updated_at: string;
                };
                Insert: {
                    collection_id?: string | null;
                    content_details?: Json | null;
                    content_type?: Database['public']['Enums']['content_type'][];
                    created_at?: string;
                    description?: string | null;
                    id?: string;
                    label?: string | null;
                    name: string;
                    slug: string;
                    status?: Database['public']['Enums']['template_status'];
                    tags?: string[] | null;
                    updated_at?: string;
                };
                Update: {
                    collection_id?: string | null;
                    content_details?: Json | null;
                    content_type?: Database['public']['Enums']['content_type'][];
                    created_at?: string;
                    description?: string | null;
                    id?: string;
                    label?: string | null;
                    name?: string;
                    slug?: string;
                    status?: Database['public']['Enums']['template_status'];
                    tags?: string[] | null;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'templates_collection_id_fkey';
                        columns: ['collection_id'];
                        isOneToOne: false;
                        referencedRelation: 'templates_collections';
                        referencedColumns: ['id'];
                    },
                ];
            };
            templates_collections: {
                Row: {
                    created_at: string;
                    description: string | null;
                    id: string;
                    name: string;
                    slug: string;
                    updated_at: string;
                };
                Insert: {
                    created_at?: string;
                    description?: string | null;
                    id?: string;
                    name: string;
                    slug: string;
                    updated_at?: string;
                };
                Update: {
                    created_at?: string;
                    description?: string | null;
                    id?: string;
                    name?: string;
                    slug?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            translations: {
                Row: {
                    completed_at: string | null;
                    created_at: string;
                    customer_id: string | null;
                    description: string | null;
                    details: Json | null;
                    display_name: string;
                    file_url: string;
                    id: string;
                    profile_id: string;
                    progress: number;
                    source_language: string;
                    started_at: string | null;
                    status: Database['public']['Enums']['translation_status'];
                    target_language: string;
                    template_id: string;
                    updated_at: string;
                };
                Insert: {
                    completed_at?: string | null;
                    created_at?: string;
                    customer_id?: string | null;
                    description?: string | null;
                    details?: Json | null;
                    display_name: string;
                    file_url: string;
                    id?: string;
                    profile_id?: string;
                    progress?: number;
                    source_language?: string;
                    started_at?: string | null;
                    status?: Database['public']['Enums']['translation_status'];
                    target_language?: string;
                    template_id: string;
                    updated_at?: string;
                };
                Update: {
                    completed_at?: string | null;
                    created_at?: string;
                    customer_id?: string | null;
                    description?: string | null;
                    details?: Json | null;
                    display_name?: string;
                    file_url?: string;
                    id?: string;
                    profile_id?: string;
                    progress?: number;
                    source_language?: string;
                    started_at?: string | null;
                    status?: Database['public']['Enums']['translation_status'];
                    target_language?: string;
                    template_id?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'translations_customer_id_fkey';
                        columns: ['customer_id'];
                        isOneToOne: false;
                        referencedRelation: 'customers';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'translations_customer_id_fkey';
                        columns: ['customer_id'];
                        isOneToOne: false;
                        referencedRelation: 'extended_customer_view';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'translations_profile_id_fkey';
                        columns: ['profile_id'];
                        isOneToOne: false;
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'translations_template_id_fkey';
                        columns: ['template_id'];
                        isOneToOne: false;
                        referencedRelation: 'templates';
                        referencedColumns: ['id'];
                    },
                ];
            };
            user_activity: {
                Row: {
                    created_at: string;
                    details: Json | null;
                    id: string;
                    profile_id: string | null;
                    type: Database['public']['Enums']['user_activity_type'];
                };
                Insert: {
                    created_at?: string;
                    details?: Json | null;
                    id?: string;
                    profile_id?: string | null;
                    type?: Database['public']['Enums']['user_activity_type'];
                };
                Update: {
                    created_at?: string;
                    details?: Json | null;
                    id?: string;
                    profile_id?: string | null;
                    type?: Database['public']['Enums']['user_activity_type'];
                };
                Relationships: [
                    {
                        foreignKeyName: 'user_activity_profile_id_fkey';
                        columns: ['profile_id'];
                        isOneToOne: false;
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            user_roles: {
                Row: {
                    created_at: string;
                    id: number;
                    role: Database['public']['Enums']['app_role'];
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string;
                    id?: number;
                    role?: Database['public']['Enums']['app_role'];
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    id?: number;
                    role?: Database['public']['Enums']['app_role'];
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'user_roles_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
        };
        Views: {
            extended_customer_view: {
                Row: {
                    created_at: string | null;
                    display_name: string | null;
                    email: string | null;
                    id: string | null;
                    number_of_translations: number | null;
                    phone: string | null;
                    profile_id: string | null;
                    updated_at: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'customers_profile_id_fkey';
                        columns: ['profile_id'];
                        isOneToOne: false;
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            extended_translation_view: {
                Row: {
                    completed_at: string | null;
                    created_at: string | null;
                    customer_email: string | null;
                    customer_id: string | null;
                    customer_name: string | null;
                    description: string | null;
                    details: Json | null;
                    display_name: string | null;
                    file_url: string | null;
                    id: string | null;
                    profile_id: string | null;
                    progress: number | null;
                    source_language: string | null;
                    started_at: string | null;
                    status: Database['public']['Enums']['translation_status'] | null;
                    status_order: number | null;
                    target_language: string | null;
                    template_id: string | null;
                    template_name: string | null;
                    updated_at: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'translations_customer_id_fkey';
                        columns: ['customer_id'];
                        isOneToOne: false;
                        referencedRelation: 'customers';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'translations_customer_id_fkey';
                        columns: ['customer_id'];
                        isOneToOne: false;
                        referencedRelation: 'extended_customer_view';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'translations_profile_id_fkey';
                        columns: ['profile_id'];
                        isOneToOne: false;
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'translations_template_id_fkey';
                        columns: ['template_id'];
                        isOneToOne: false;
                        referencedRelation: 'templates';
                        referencedColumns: ['id'];
                    },
                ];
            };
            stripe_balance: {
                Row: {
                    amount: number | null;
                    attrs: Json | null;
                    balance_type: string | null;
                    currency: string | null;
                };
                Insert: {
                    amount?: number | null;
                    attrs?: Json | null;
                    balance_type?: string | null;
                    currency?: string | null;
                };
                Update: {
                    amount?: number | null;
                    attrs?: Json | null;
                    balance_type?: string | null;
                    currency?: string | null;
                };
                Relationships: [];
            };
            stripe_balance_transactions: {
                Row: {
                    amount: number | null;
                    attrs: Json | null;
                    created: string | null;
                    currency: string | null;
                    description: string | null;
                    fee: number | null;
                    id: string | null;
                    net: number | null;
                    status: string | null;
                    type: string | null;
                };
                Insert: {
                    amount?: number | null;
                    attrs?: Json | null;
                    created?: string | null;
                    currency?: string | null;
                    description?: string | null;
                    fee?: number | null;
                    id?: string | null;
                    net?: number | null;
                    status?: string | null;
                    type?: string | null;
                };
                Update: {
                    amount?: number | null;
                    attrs?: Json | null;
                    created?: string | null;
                    currency?: string | null;
                    description?: string | null;
                    fee?: number | null;
                    id?: string | null;
                    net?: number | null;
                    status?: string | null;
                    type?: string | null;
                };
                Relationships: [];
            };
        };
        Functions: {
            check_user_has_password: { Args: { user_id: string }; Returns: Json };
            cleanup_inactive_users: { Args: never; Returns: undefined };
            custom_access_token_hook: { Args: { event: Json }; Returns: Json };
            deduct_credits_for_translation: {
                Args: {
                    p_credits_required: number;
                    p_document_name: string;
                    p_page_count: number;
                    p_translation_id: string;
                    p_user_id: string;
                };
                Returns: Json;
            };
            log_user_activity_action: {
                Args: {
                    action_type: Database['public']['Enums']['user_activity_type'];
                    details?: Json;
                    profile_id: string;
                };
                Returns: undefined;
            };
            verify_user_password: {
                Args: { current_plain_password: string };
                Returns: Json;
            };
        };
        Enums: {
            account_status: 'ACTIVE' | 'SUSPENDED';
            app_role: 'ADMIN' | 'USER';
            content_type: 'text' | 'table';
            credits_transaction_type: 'purchase' | 'refund' | 'bonus' | 'penalty' | 'consumption';
            notification_type:
                | 'translation_complete'
                | 'translation_failed'
                | 'translation_review'
                | 'credit_low'
                | 'credit_added'
                | 'payment_success'
                | 'payment_failed'
                | 'product_update'
                | 'system_alert';
            profile_status: 'ONLINE' | 'OFFLINE' | 'SUSPENDED';
            subscription_source:
                | 'coming_soon'
                | 'website_footer'
                | 'blog_post'
                | 'social_media'
                | 'paid_ads'
                | 'landing_page'
                | 'referral'
                | 'webinar'
                | 'event'
                | 'email_campaign'
                | 'direct';
            subscription_status: 'subscribed' | 'unsubscribed';
            template_status:
                | 'draft'
                | 'active'
                | 'inactive'
                | 'deleted'
                | 'archived'
                | 'locked'
                | 'updated'
                | 'outdated'
                | 'upcoming';
            translation_status:
                | 'queued'
                | 'processing'
                | 'translating'
                | 'polishing'
                | 'ready'
                | 'generating'
                | 'completed'
                | 'failed'
                | 'canceled'
                | 'retrying';
            user_activity_type:
                | 'sign_in'
                | 'sign_out'
                | 'heartbeat'
                | 'enabled_mfa'
                | 'disabled_mfa'
                | 'changed_email'
                | 'changed_password'
                | 'closed_account'
                | 'updated_profile'
                | 'created_customer'
                | 'updated_customer'
                | 'deleted_customer'
                | 'created_translation'
                | 'deleted_translation'
                | 'assigned_customer_to_translation'
                | 'initiated_checkout'
                | 'completed_checkout'
                | 'failed_checkout'
                | 'opened_billing_portal'
                | 'customer_deleted'
                | 'accessed_signed_url';
        };
        CompositeTypes: Record<never, never>;
    };
    stripe: {
        Tables: {
            balance: {
                Row: {
                    amount: number | null;
                    attrs: Json | null;
                    balance_type: string | null;
                    currency: string | null;
                };
                Insert: {
                    amount?: number | null;
                    attrs?: Json | null;
                    balance_type?: string | null;
                    currency?: string | null;
                };
                Update: {
                    amount?: number | null;
                    attrs?: Json | null;
                    balance_type?: string | null;
                    currency?: string | null;
                };
                Relationships: [];
            };
            balance_transactions: {
                Row: {
                    amount: number | null;
                    attrs: Json | null;
                    created: string | null;
                    currency: string | null;
                    description: string | null;
                    fee: number | null;
                    id: string | null;
                    net: number | null;
                    status: string | null;
                    type: string | null;
                };
                Insert: {
                    amount?: number | null;
                    attrs?: Json | null;
                    created?: string | null;
                    currency?: string | null;
                    description?: string | null;
                    fee?: number | null;
                    id?: string | null;
                    net?: number | null;
                    status?: string | null;
                    type?: string | null;
                };
                Update: {
                    amount?: number | null;
                    attrs?: Json | null;
                    created?: string | null;
                    currency?: string | null;
                    description?: string | null;
                    fee?: number | null;
                    id?: string | null;
                    net?: number | null;
                    status?: string | null;
                    type?: string | null;
                };
                Relationships: [];
            };
        };
        Views: Record<never, never>;
        Functions: Record<never, never>;
        Enums: Record<never, never>;
        CompositeTypes: Record<never, never>;
    };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
    DefaultSchemaTableNameOrOptions extends
        | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
              DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
          DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
          Row: infer R;
      }
        ? R
        : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
      ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R;
        }
          ? R
          : never
      : never;

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema['Tables']
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Insert: infer I;
      }
        ? I
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Insert: infer I;
        }
          ? I
          : never
      : never;

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema['Tables']
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Update: infer U;
      }
        ? U
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Update: infer U;
        }
          ? U
          : never
      : never;

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
        | keyof DefaultSchema['Enums']
        | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
        : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
      ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
      : never;

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
        | keyof DefaultSchema['CompositeTypes']
        | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
        : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
      ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
      : never;

export const Constants = {
    auth: {
        Enums: {
            aal_level: ['aal1', 'aal2', 'aal3'],
            code_challenge_method: ['s256', 'plain'],
            factor_status: ['unverified', 'verified'],
            factor_type: ['totp', 'webauthn', 'phone'],
            oauth_authorization_status: ['pending', 'approved', 'denied', 'expired'],
            oauth_client_type: ['public', 'confidential'],
            oauth_registration_type: ['dynamic', 'manual'],
            oauth_response_type: ['code'],
            one_time_token_type: [
                'confirmation_token',
                'reauthentication_token',
                'recovery_token',
                'email_change_token_new',
                'email_change_token_current',
                'phone_change_token',
            ],
        },
    },
    extensions: {
        Enums: {},
    },
    graphql_public: {
        Enums: {},
    },
    public: {
        Enums: {
            app_role: ['ADMIN', 'USER'],
            content_type: ['text', 'table'],
            credits_transaction_type: ['purchase', 'refund', 'bonus', 'penalty', 'consumption'],
            notification_type: [
                'translation_complete',
                'translation_failed',
                'translation_review',
                'credit_low',
                'credit_added',
                'payment_success',
                'payment_failed',
                'product_update',
                'system_alert',
            ],
            profile_status: ['ONLINE', 'OFFLINE', 'SUSPENDED'],
            subscription_source: [
                'coming_soon',
                'website_footer',
                'blog_post',
                'social_media',
                'paid_ads',
                'landing_page',
                'referral',
                'webinar',
                'event',
                'email_campaign',
                'direct',
            ],
            subscription_status: ['subscribed', 'unsubscribed'],
            template_status: [
                'draft',
                'active',
                'inactive',
                'deleted',
                'archived',
                'locked',
                'updated',
                'outdated',
                'upcoming',
            ],
            translation_status: [
                'queued',
                'processing',
                'translating',
                'polishing',
                'ready',
                'generating',
                'completed',
                'failed',
                'canceled',
                'retrying',
            ],
            user_activity_type: [
                'sign_in',
                'sign_out',
                'heartbeat',
                'enabled_mfa',
                'disabled_mfa',
                'changed_email',
                'changed_password',
                'closed_account',
                'updated_profile',
                'created_customer',
                'updated_customer',
                'deleted_customer',
                'created_translation',
                'deleted_translation',
                'assigned_customer_to_translation',
                'initiated_checkout',
                'completed_checkout',
                'failed_checkout',
                'opened_billing_portal',
                'customer_deleted',
                'accessed_signed_url',
            ],
        },
    },
    stripe: {
        Enums: {},
    },
} as const;
