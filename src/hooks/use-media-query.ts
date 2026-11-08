/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import React from 'react';

export const useMediaQuery = (query: string) => {
    const [isMatching, setIsMatching] = React.useState(false);

    React.useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== isMatching) {
            setIsMatching(media.matches);
        }
        const listener = () => setIsMatching(media.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, [isMatching, query]);

    return isMatching;
};
