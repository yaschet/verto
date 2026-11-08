/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import useSession from '@hooks/queries/auth/use-session';
import { userDataQueryOptions } from '@queries/tanstack/auth-query-options';
import { createBrowserClient } from '@utils/supabase/client';

export const useUserData = () => {
    const session = useSession();
    const supabase = createBrowserClient();
    const queryClient = useQueryClient();
    const router = useRouter();
    const pathname = usePathname();

    const query = useQuery(
        userDataQueryOptions(session?.user.id ?? undefined, {
            throwOnError: false,
        }),
    );

    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
            const handleAuthChange = async () => {
                try {
                    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
                        // Refresh the router to update server components:
                        router.refresh();

                        if (newSession?.user?.id !== session?.user?.id) {
                            await queryClient.invalidateQueries(
                                {
                                    queryKey: ['user-profile-query', newSession?.user?.id],
                                    exact: true,
                                    refetchType: 'all',
                                },
                                { throwOnError: true, cancelRefetch: false },
                            );
                        } else {
                            await queryClient.refetchQueries(
                                {
                                    queryKey: ['user-profile-query', newSession?.user?.id],
                                    type: 'all',
                                    exact: true,
                                },
                                { throwOnError: true, cancelRefetch: false },
                            );
                        }

                        if (event === 'SIGNED_OUT' && pathname !== '/auth/sign-in' && pathname !== '/') {
                            router.push('/auth/sign-in');
                        }
                    }
                } catch (error) {
                    console.error('An error occurred while handling the auth change:', error);
                    toast.error('An Error Occurred While Handling the Auth Change', {
                        description: (error as Error)?.message ?? 'Please try again.',
                        id: 'auth-change-error',
                    });
                }
            };

            handleAuthChange().catch((error: unknown) => {
                console.error('An error occurred while handling the auth change:', error);
                toast.error('An Error Occurred While Handling the Auth Change', {
                    description: (error as Error)?.message ?? 'Please try again.',
                    id: 'auth-change-error',
                });
            });
        });

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, [queryClient, supabase.auth, session?.user?.id, pathname, router]);

    return query;
};
