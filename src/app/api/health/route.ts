/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { env } from '@/env';
import { getLogger } from '@services/logger';
import { createServerClient } from '@utils/supabase/server';

const logger = getLogger('API:HEALTH_CHECK');

/**
 * Health check endpoint for monitoring service availability.
 *
 * Returns:
 * - 200: All services healthy
 * - 207: Partial service degradation
 * - 503: Critical services down
 *
 * @route GET /api/health
 */
async function handleHealthRequest(req: Request): Promise<Response> {
    const startTime = Date.now();
    const checks: {
        supabase: { status: 'healthy' | 'unhealthy'; latency?: number; error?: string };
        trigger: { status: 'healthy' | 'unhealthy'; latency?: number; error?: string };
    } = {
        supabase: { status: 'unhealthy' },
        trigger: { status: 'unhealthy' },
    };

    // Check Supabase connection
    try {
        const checkStart = Date.now();
        const supabase = await createServerClient();
        const { error } = await Promise.race([
            supabase.from('profiles').select('id').limit(1),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Supabase timeout')), 5000)),
        ]);

        if (error && error.code !== 'PGRST116') {
            // PGRST116 = no rows returned (table exists but empty)
            throw error;
        }

        checks.supabase = {
            status: 'healthy',
            latency: Date.now() - checkStart,
        };
    } catch (error) {
        checks.supabase = {
            status: 'unhealthy',
            error: error instanceof Error ? (error as Error).message : 'Unknown error',
        };
        logger.error(['Supabase health check failed:', error]);
    }

    // Check Trigger.dev availability (basic check - just verify env var exists)
    try {
        const checkStart = Date.now();
        const triggerSecret = env.TRIGGER_SECRET_KEY;
        const triggerRef = env.TRIGGER_PROJECT_REF;

        if (!triggerSecret || !triggerRef) {
            throw new Error('Trigger.dev environment variables not configured');
        }

        checks.trigger = {
            status: 'healthy',
            latency: Date.now() - checkStart,
        };
    } catch (error) {
        checks.trigger = {
            status: 'unhealthy',
            error: error instanceof Error ? (error as Error).message : 'Unknown error',
        };
        logger.error(['Trigger.dev health check failed:', error]);
    }

    // Determine overall status
    const allHealthy = checks.supabase.status === 'healthy' && checks.trigger.status === 'healthy';
    const criticalDown = checks.supabase.status === 'unhealthy'; // Supabase is critical

    const status = allHealthy ? 'healthy' : criticalDown ? 'down' : 'degraded';
    const httpStatus = allHealthy ? 200 : criticalDown ? 503 : 207;

    const response = {
        status,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        services: checks,
        version: process.env.npm_package_version || '1.0.0',
    };

    logger.info(`Received request from ${req.url}`);
    logger.info(`System Status: ${status}`);

    return Response.json(response, { status: httpStatus });
}

export { handleHealthRequest as GET, handleHealthRequest as POST };
