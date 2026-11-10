/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { getLogger } from '@services/logger';

const logger = getLogger('API:HEALTH');

async function handleHealthRequest(req: Request): Promise<Response> {
    try {
        const data = { status: 'OK' };

        logger.info(`Received request from ${req.url}`);
        logger.info(`System Status: OK`);

        return Response.json(data, { status: 200 });
    } catch (error) {
        logger.error(
            `An error occurred: ${(error as Error)?.name ?? 'Unknown Error'} - ${(error as Error)?.message ?? 'Unknown Message'}`,
        );

        const errorObject = {
            description: 'An unexpected error occurred. Please try again soon.',
            message: 'Internal Server Error',
            status: 500,
        };

        return Response.json(errorObject, { status: 500 });
    }
}

export { handleHealthRequest as GET, handleHealthRequest as POST };
