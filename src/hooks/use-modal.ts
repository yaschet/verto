/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { useEffect, useState } from 'react';

const useModal = <T>() => {
    const [selectedItem, setSelectedItem] = useState<T | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = (item: T) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedItem(null);
        setIsModalOpen(false);
    };

    useEffect(() => {
        if (!isModalOpen) {
            setSelectedItem(null);
        }
    }, [isModalOpen]);

    return {
        closeModal,
        isModalOpen,
        openModal,
        selectedItem,
        setIsModalOpen,
        setSelectedItem,
    };
};

export default useModal;
