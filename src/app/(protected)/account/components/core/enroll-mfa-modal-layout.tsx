/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { ShieldCheckIcon } from '@phosphor-icons/react';
import { Fragment } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Button } from '@components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@components/ui/dialog';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@components/ui/drawer';
import type { ReactNode } from 'react';

export function EnrollMFAModalLayout({
    children,
    isModalOpen,
    modalTriggerButton = (
        <Button className="w-fit" color="info" type="button" variant="soft">
            <ShieldCheckIcon className="size-5" color="currentColor" weight="duotone" />
            <span>Enable Two-Factor Authentication</span>
        </Button>
    ),
    setIsModalOpen,
}: {
    isModalOpen: boolean;
    setIsModalOpen: (open: boolean) => void;
    children: ReactNode;
    modalTriggerButton?: ReactNode;
}) {
    const isDesktop = useMediaQuery('(min-width: 768px)');
    return isDesktop ? (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>{modalTriggerButton}</DialogTrigger>
            <DialogContent
                className="mx-auto w-full max-w-lg"
                onInteractOutside={(e) => {
                    e.preventDefault();
                }}
            >
                {children}
            </DialogContent>
        </Dialog>
    ) : (
        <Drawer open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DrawerTrigger asChild>{modalTriggerButton}</DrawerTrigger>
            <DrawerContent>
                <div className="mx-auto w-full max-w-sm">{children}</div>
            </DrawerContent>
        </Drawer>
    );
}

export function EnrollMFAFormLayout({
    children,
    description = 'Description',
    title = 'Title',
}: {
    children?: ReactNode;
    title: string | ReactNode;
    description: string | ReactNode;
}) {
    const isDesktop = useMediaQuery('(min-width: 768px)');

    if (!title || !description) {
        return null;
    }

    return (
        (isDesktop && (
            <Fragment>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                {children}
            </Fragment>
        )) || (
            <div className="mx-auto w-full max-w-sm">
                <DrawerHeader className="text-left">
                    <DrawerTitle>{title}</DrawerTitle>
                    <DrawerDescription>{description}</DrawerDescription>
                </DrawerHeader>
                <div className="px-0 pb-4">{children}</div>
            </div>
        )
    );
}
