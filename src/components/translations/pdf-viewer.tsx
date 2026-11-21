/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import {
    ArrowsInIcon,
    ArrowsOutIcon,
    MagnifyingGlassMinusIcon,
    MagnifyingGlassPlusIcon,
} from '@phosphor-icons/react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { VariableSizeList as List } from 'react-window';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/library/utils';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { PdfSkeleton } from './pdf-skeleton';

// Custom ScrollArea wrapper for react-window
const CustomScrollArea = forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        style: React.CSSProperties | undefined;
        outerRef?: React.Ref<HTMLDivElement>;
    }
>(({ children, outerRef, style, ...props }, ref) => {
    const { overflow, overflowX, overflowY, ...restStyle } = style ?? {};

    const setRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (typeof ref === 'function') {
                ref(node);
            } else if (ref) {
                (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }

            if (typeof outerRef === 'function') {
                outerRef(node);
            } else if (outerRef) {
                (outerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }
        },
        [ref, outerRef],
    );

    return (
        <ScrollAreaPrimitive.Root className="relative h-full w-full overflow-hidden" style={restStyle}>
            <ScrollAreaPrimitive.Viewport
                ref={setRef}
                className="h-full w-full rounded-[inherit]"
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    overflowX:
                        (overflowX as React.CSSProperties['overflowX']) ??
                        (overflow as React.CSSProperties['overflowX']) ??
                        'auto',
                    overflowY:
                        (overflowY as React.CSSProperties['overflowY']) ??
                        (overflow as React.CSSProperties['overflowY']) ??
                        'auto',
                }}
                {...props}
            >
                {children}
            </ScrollAreaPrimitive.Viewport>
            <ScrollBar />
            <ScrollAreaPrimitive.Corner />
        </ScrollAreaPrimitive.Root>
    );
});
CustomScrollArea.displayName = 'CustomScrollArea';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Suppress AbortException warnings
const originalWarn = console.warn;
const originalError = console.error;

const suppressAbortExceptionWarnings = () => {
    const warnFilter = (...args: unknown[]) => {
        const fullMessage = args.map((arg) => String(arg)).join(' ');
        if (fullMessage.includes('AbortException') || fullMessage.includes('TextLayer task cancelled')) {
            return;
        }
        originalWarn.apply(console, args);
    };

    const errorFilter = (...args: unknown[]) => {
        const fullMessage = args.map((arg) => String(arg)).join(' ');
        if (fullMessage.includes('AbortException') || fullMessage.includes('TextLayer task cancelled')) {
            return;
        }
        originalError.apply(console, args);
    };

    console.warn = warnFilter;
    console.error = errorFilter;
};

suppressAbortExceptionWarnings();

type PdfViewerProps = {
    fileUrl: string;
    className?: string;
    isCollapsed?: boolean;
    isResizing?: boolean;
};

export function PdfViewer({ fileUrl, isCollapsed = false }: PdfViewerProps) {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [scale, setScale] = useState(1.0);
    const [renderedScale, setRenderedScale] = useState(1.0);
    const [containerWidth, setContainerWidth] = useState<number>(0);
    const [renderedContainerWidth, setRenderedContainerWidth] = useState<number>(0);
    const [containerHeight, setContainerHeight] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pageHeights, setPageHeights] = useState<Record<number, number>>({});
    const [pageAspectRatios, setPageAspectRatios] = useState<Record<number, number>>({});
    const scrollOffsetRef = useRef<number>(0);
    const scrollViewportRef = useRef<HTMLDivElement | null>(null);
    const horizontalScrollRef = useRef<number>(0);
    useRef<number>(1.0);
    const previousRenderedScaleRef = useRef<number>(1.0);
    const previousContainerWidthRef = useRef<number>(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageInput, setPageInput] = useState('1');
    const isTypingRef = useRef(false);
    const [isFocused, setIsFocused] = useState(false); // Track focus for keyboard shortcuts
    const viewerRef = useRef<HTMLDivElement>(null); // Ref for the focusable viewer area

    // Use a ref for the list to access methods like resetAfterIndex
    type ListRef = {
        resetAfterIndex: (index: number, shouldForceUpdate?: boolean) => void;
        scrollTo: (offset: number) => void;
        scrollToItem: (index: number, align?: 'auto' | 'smart' | 'center' | 'end' | 'start') => void;
    };

    const listRef = useRef<ListRef | null>(null);
    const innerListRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isMountedRef = useRef(true);
    const [shouldRenderTextLayer, setShouldRenderTextLayer] = useState(true);

    // Track items rendered to update current page
    const onItemsRendered = useCallback(({ visibleStartIndex }: { visibleStartIndex: number }) => {
        const newPage = visibleStartIndex + 1;
        setCurrentPage(newPage);
    }, []);

    // Sync page input with current page when not typing
    useEffect(() => {
        if (!isTypingRef.current) {
            setPageInput(currentPage.toString());
        }
    }, [currentPage]);

    // Handle page input change
    const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        isTypingRef.current = true;
        setPageInput(e.target.value);
    };

    const handlePageInputBlur = () => {
        isTypingRef.current = false;
        setPageInput(currentPage.toString());
    };

    const handlePageSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        isTypingRef.current = false;
        const page = parseInt(pageInput);
        if (page >= 1 && page <= (numPages || 1)) {
            setCurrentPage(page);
            requestAnimationFrame(() => {
                if (listRef.current) {
                    listRef.current.scrollToItem(page - 1, 'start');
                }
            });
        } else {
            setPageInput(currentPage.toString());
        }
    };

    // Debounce renderedScale update to avoid flickering during pinch zoom
    useEffect(() => {
        if (scale === renderedScale) return;

        const timeoutId = setTimeout(() => {
            setRenderedScale(scale);
        }, 200);

        return () => clearTimeout(timeoutId);
    }, [scale, renderedScale]);

    // Debounce renderedContainerWidth update to avoid flickering during resize
    useEffect(() => {
        if (containerWidth === 0) return;

        // If it's the first render (0 -> value), update immediately
        if (renderedContainerWidth === 0) {
            setRenderedContainerWidth(containerWidth);
            return;
        }

        if (containerWidth === renderedContainerWidth) return;

        const timeoutId = setTimeout(() => {
            setRenderedContainerWidth(containerWidth);
        }, 200);

        return () => clearTimeout(timeoutId);
    }, [containerWidth, renderedContainerWidth]);

    // Apply CSS transform for immediate feedback during zoom or resize
    useEffect(() => {
        if (!innerListRef.current) return;

        const scaleRatio = scale / renderedScale;
        const widthRatio = renderedContainerWidth > 0 ? containerWidth / renderedContainerWidth : 1;

        // Combine both ratios
        // If we are resizing, we want to scale the width.
        // If we are zooming, we want to scale the content.

        // When resizing, the container width changes, but renderedContainerWidth lags behind.
        // We want the content (which is rendered at renderedContainerWidth) to fill the new containerWidth.
        // So we scale by containerWidth / renderedContainerWidth.

        const totalScale = scaleRatio * widthRatio;

        if (Math.abs(totalScale - 1) > 0.001) {
            innerListRef.current.style.transform = `scale(${totalScale})`;
            innerListRef.current.style.transformOrigin = 'top left';
            // We also need to adjust width to prevent overflow/clipping during the transition
            innerListRef.current.style.width = `${100 / totalScale}%`;
        } else {
            innerListRef.current.style.transform = '';
            innerListRef.current.style.transformOrigin = '';
            innerListRef.current.style.width = '100%';
        }
    }, [scale, renderedScale, containerWidth, renderedContainerWidth]);

    const handleHorizontalScroll = useCallback(() => {
        if (scrollViewportRef.current) {
            horizontalScrollRef.current = scrollViewportRef.current.scrollLeft;
        }
    }, []);

    const setScrollViewportRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (scrollViewportRef.current) {
                scrollViewportRef.current.removeEventListener('scroll', handleHorizontalScroll);
            }
            if (node) {
                node.addEventListener('scroll', handleHorizontalScroll, { passive: true });
            }
            scrollViewportRef.current = node;
        },
        [handleHorizontalScroll],
    );

    useEffect(() => {
        return () => {
            if (scrollViewportRef.current) {
                scrollViewportRef.current.removeEventListener('scroll', handleHorizontalScroll);
            }
        };
    }, [handleHorizontalScroll]);

    // Disable text layer rendering when collapsed
    useEffect(() => {
        if (isCollapsed) {
            setShouldRenderTextLayer(false);
        } else {
            setShouldRenderTextLayer(true);
        }
    }, [isCollapsed]);

    // Update container dimensions on resize
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                // Removed !isResizing check to allow updates during resize
                setContainerWidth(containerRef.current.offsetWidth);
                setContainerHeight(containerRef.current.offsetHeight);
            }
        };

        updateDimensions();
        const resizeObserver = new ResizeObserver(updateDimensions);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => resizeObserver.disconnect();
    }, []); // Removed isResizing dependency

    // Pinch to zoom handler
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let initialDistance = 0;
        let initialScale = 1;

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                initialDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY,
                );
                initialScale = scale;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const currentDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY,
                );

                if (initialDistance > 0) {
                    const delta = currentDistance / initialDistance;
                    const newScale = Math.min(Math.max(initialScale * delta, 0.5), 3);
                    setScale(newScale);
                }
            }
        };

        container.addEventListener('touchstart', handleTouchStart, { passive: false });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
        };
    }, [scale]);

    // Maintain scroll position and reset layout on renderedScale/width change
    useEffect(() => {
        const widthRatio =
            renderedContainerWidth && previousContainerWidthRef.current
                ? renderedContainerWidth / previousContainerWidthRef.current
                : 1;
        const scaleRatio = renderedScale / previousRenderedScaleRef.current;
        const totalRatio = widthRatio * scaleRatio;

        if (listRef.current) {
            listRef.current.resetAfterIndex(0);

            if (totalRatio !== 1 && scrollOffsetRef.current > 0) {
                // Use requestAnimationFrame to scroll after layout update
                requestAnimationFrame(() => {
                    if (listRef.current) {
                        listRef.current.scrollTo(scrollOffsetRef.current * totalRatio);
                    }
                });
            }
        }

        if (scrollViewportRef.current) {
            const viewport = scrollViewportRef.current;
            const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;

            if (maxScrollLeft > 0) {
                let targetScrollLeft = horizontalScrollRef.current * totalRatio;

                if (!horizontalScrollRef.current && renderedScale > previousRenderedScaleRef.current) {
                    targetScrollLeft = maxScrollLeft / 2;
                }

                targetScrollLeft = Math.max(0, Math.min(maxScrollLeft, targetScrollLeft));

                requestAnimationFrame(() => {
                    if (scrollViewportRef.current) {
                        scrollViewportRef.current.scrollLeft = targetScrollLeft;
                        horizontalScrollRef.current = targetScrollLeft;
                    }
                });
            }
        }

        previousRenderedScaleRef.current = renderedScale;
        previousContainerWidthRef.current = renderedContainerWidth;
    }, [renderedScale, renderedContainerWidth]);

    const onListScroll = useCallback(({ scrollOffset }: { scrollOffset: number }) => {
        scrollOffsetRef.current = scrollOffset;
    }, []);

    const onDocumentLoadError = useCallback((error: Error) => {
        console.error('PDF loading error:', error);
        setError('Failed to load PDF. Please try again.');
        setIsLoading(false);
    }, []);

    // Debounced resetAfterIndex to prevent layout thrashing
    const resetListLayoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pendingResetIndexRef = useRef<number | null>(null);

    const debouncedResetAfterIndex = useCallback((index: number) => {
        // Update the pending index to be the minimum of the current pending and new index
        // This ensures we reset from the earliest changed item
        if (pendingResetIndexRef.current === null || index < pendingResetIndexRef.current) {
            pendingResetIndexRef.current = index;
        }

        if (resetListLayoutTimeoutRef.current) {
            clearTimeout(resetListLayoutTimeoutRef.current);
        }

        resetListLayoutTimeoutRef.current = setTimeout(() => {
            if (listRef.current && pendingResetIndexRef.current !== null) {
                listRef.current.resetAfterIndex(pendingResetIndexRef.current);
                pendingResetIndexRef.current = null;
            }
        }, 100); // 100ms debounce
    }, []);

    // Update item size when a page loads with its actual dimensions
    const onPageLoadSuccess = useCallback(
        (page: Parameters<NonNullable<React.ComponentProps<typeof Page>['onLoadSuccess']>>[0]) => {
            const pageNumber = page.pageNumber;

            // If we already have the aspect ratio (which we should from onDocumentLoadSuccess),
            // we don't need to update anything here. This prevents flickering.
            if (pageAspectRatios[pageNumber]) {
                return;
            }

            const viewport = page.getViewport({ scale: 1 });
            const aspectRatio = viewport.height / viewport.width;

            setPageHeights((prev) => {
                const currentHeight = prev[pageNumber];
                // Use renderedContainerWidth
                const width = renderedContainerWidth > 0 ? renderedContainerWidth : viewport.width;
                const newHeight = width * aspectRatio;

                // Only update if significantly different to avoid loops
                // Increased threshold to 10px to be more forgiving
                if (!currentHeight || Math.abs(currentHeight - newHeight) > 10) {
                    // Trigger debounced layout reset only when height actually changes
                    debouncedResetAfterIndex(pageNumber - 1);
                    return { ...prev, [pageNumber]: newHeight };
                }
                return prev;
            });
        },
        [renderedContainerWidth, debouncedResetAfterIndex, pageAspectRatios],
    );

    const onDocumentLoadSuccess = useCallback(
        async (pdf: Parameters<NonNullable<React.ComponentProps<typeof Document>['onLoadSuccess']>>[0]) => {
            setNumPages(pdf.numPages);
            setError(null);
            setCurrentPage(1);
            setPageInput('1');

            // Background fetch of all page dimensions
            try {
                const pagePromises = [];

                for (let i = 1; i <= pdf.numPages; i++) {
                    pagePromises.push(
                        pdf.getPage(i).then((page) => {
                            const viewport = page.getViewport({ scale: 1 });
                            const aspectRatio = viewport.height / viewport.width;
                            return { pageNumber: i, aspectRatio };
                        }),
                    );
                }

                const pages = await Promise.all(pagePromises);

                const ratios: Record<number, number> = {};
                pages.forEach((p) => {
                    ratios[p.pageNumber] = p.aspectRatio;
                });
                setPageAspectRatios(ratios);

                // Only set loading to false AFTER we have the dimensions
                setIsLoading(false);
            } catch (err) {
                console.error('Error fetching page dimensions:', err);
                // Even if fetching dimensions fails, we should let the user see the PDF
                setIsLoading(false);
            }
        },
        [],
    );

    // Page height calculation
    const getPageHeight = useCallback(
        (index: number) => {
            const pageNumber = index + 1;
            const width = renderedContainerWidth > 0 ? renderedContainerWidth : 800;

            // Prioritize pre-fetched aspect ratio
            if (pageAspectRatios[pageNumber]) {
                return pageAspectRatios[pageNumber] * width * renderedScale + 16;
            }

            // Debug log if we fall back (shouldn't happen with strict blocking)

            // Fallback to cached height or estimate
            return (pageHeights[pageNumber] || width * 1.414) * renderedScale + 16;
        },
        [pageHeights, pageAspectRatios, renderedContainerWidth, renderedScale],
    );

    // When aspect ratios are loaded, we need to reset the list
    useEffect(() => {
        if (numPages && Object.keys(pageAspectRatios).length === numPages && listRef.current) {
            console.log('All aspect ratios loaded, resetting list layout');
            listRef.current.resetAfterIndex(0);
        }
    }, [pageAspectRatios, numPages]);

    // Zoom controls
    const handleZoomIn = () => {
        const newScale = Math.min(scale + 0.25, 3);
        setScale(newScale);
        setRenderedScale(newScale); // Immediate update for buttons
    };

    const handleZoomOut = () => {
        const newScale = Math.max(scale - 0.25, 0.5);
        setScale(newScale);
        setRenderedScale(newScale); // Immediate update for buttons
    };

    const handleFitWidth = () => {
        // In this virtualized view, "Fit Width" basically means scale = 1
        // if we base our page width on containerWidth.
        // But if we want to support zooming *out* to see less than full width,
        // we treat scale=1 as "Fit Width".
        setScale(1.0);
        setRenderedScale(1.0);
    };

    const handleResetZoom = () => {
        setScale(1.0);
        setRenderedScale(1.0);
    };

    // Keyboard shortcuts handler - only works when viewer is focused
    // This prevents shortcuts from interfering with typing in the editor
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        // Check if user is typing in an input element within the viewer
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return;
        }

        // Zoom shortcuts with Cmd/Ctrl modifier
        if (e.metaKey || e.ctrlKey) {
            if (e.key === '=' || e.key === '+') {
                e.preventDefault();
                handleZoomIn();
            } else if (e.key === '-') {
                e.preventDefault();
                handleZoomOut();
            } else if (e.key === '0') {
                e.preventDefault();
                handleResetZoom();
            }
        }

        // Escape to blur/unfocus the viewer
        if (e.key === 'Escape') {
            setIsFocused(false);
            viewerRef.current?.blur();
        }
    }, []);

    // Reset list layout when scale or container width changes
    useEffect(() => {
        if (listRef.current) {
            listRef.current.resetAfterIndex(0);
        }
    }, [scale, renderedContainerWidth]);

    // Row component for react-window
    const Row = useCallback(
        ({ index, style }: { index: number; style: React.CSSProperties }) => {
            const pageNumber = index + 1;
            const gutter = 32;
            // Use renderedContainerWidth
            const availableWidth = Math.max(renderedContainerWidth - gutter, 0);
            const pageWidth = availableWidth > 0 ? availableWidth * renderedScale : undefined;
            const shouldCenter = pageWidth ? pageWidth <= availableWidth : true;
            const horizontalPadding = shouldCenter ? gutter / 2 : 0;

            const itemStyle = {
                ...style,
                width: '100%',
                padding: `0 ${horizontalPadding}px`,
                margin: 0,
            };

            return (
                <div style={itemStyle}>
                    <div
                        className={cn(
                            'dark:bg-surface-950 relative mb-2 overflow-hidden rounded-xl bg-white shadow-sm',
                            shouldCenter ? 'mx-auto' : '',
                        )}
                        style={{
                            width: pageWidth ? `${pageWidth}px` : availableWidth || undefined,
                        }}
                    >
                        <Page
                            loading={
                                <div
                                    className="bg-surface-1 flex animate-pulse items-center justify-center"
                                    style={{ height: '100%', width: '100%', minHeight: '800px' }}
                                >
                                    <span className="text-surface-600 dark:text-surface-400">
                                        Loading Page {pageNumber}...
                                    </span>
                                </div>
                            }
                            pageNumber={pageNumber}
                            renderAnnotationLayer={false}
                            renderTextLayer={shouldRenderTextLayer && isMountedRef.current}
                            width={pageWidth || availableWidth || undefined}
                            onLoadSuccess={onPageLoadSuccess}
                            onRenderError={(error) => {
                                if (error.name !== 'AbortException') {
                                    console.error(`Page ${pageNumber} Render Error:`, error);
                                }
                            }}
                        />

                        {/* Page number indicator - REMOVED as it's now in header */}
                    </div>
                </div>
            );
        },
        [renderedContainerWidth, scale, shouldRenderTextLayer, onPageLoadSuccess],
    );

    const _maxDigits = String(numPages || 0).length || 1;

    return (
        <div className="bg-surface-1 flex h-full w-full flex-col">
            {/* Toolbar */}
            <ScrollArea
                className="border-surface-3 dark:border-surface-800 dark:bg-surface-950 z-10 flex h-14 shrink-0 border-b bg-white"
                orientation="horizontal"
            >
                <div className="flex h-14 w-full items-center justify-between gap-2 px-2 sm:px-4">
                    {/* Page Navigation */}
                    <div className="flex min-w-0 shrink-0 items-center">
                        <form className="flex items-center" onSubmit={handlePageSubmit}>
                            <div className="bg-surface-2 dark:bg-surface-800 text-surface-700 dark:text-surface-300 inline-flex h-7 items-center rounded-xl px-2 font-mono text-xs leading-none font-medium tabular-nums">
                                <input
                                    className="flex h-full appearance-none items-center justify-center bg-transparent px-0 text-center leading-none font-bold outline-none focus:ring-0"
                                    style={{ width: `${Math.max(1, pageInput.length)}ch` }}
                                    type="text"
                                    value={pageInput}
                                    onBlur={handlePageInputBlur}
                                    onChange={handlePageInputChange}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handlePageSubmit(e);
                                        }
                                    }}
                                />

                                <span className="flex h-full flex-1 items-center justify-center px-1 leading-none select-none">
                                    /
                                </span>

                                <span className="flex h-full items-center justify-center leading-none select-none">
                                    {numPages || '--'}
                                </span>
                            </div>
                        </form>
                    </div>

                    {/* Zoom Controls */}
                    <div className="bg-surface-2 dark:bg-surface-800 flex shrink-0 items-center gap-1 rounded-xl p-0.5">
                        <Button
                            className="dark:hover:bg-surface-700 h-7 w-7 rounded-lg p-0 hover:bg-white"
                            disabled={scale <= 0.5}
                            size="sm"
                            title="Zoom Out (Cmd -)"
                            variant="plain"
                            onClick={handleZoomOut}
                        >
                            <MagnifyingGlassMinusIcon className="h-4 w-4" />
                        </Button>

                        <DropdownMenu size="xs">
                            <DropdownMenuTrigger asChild>
                                <Button
                                    className="text-surface-700 dark:text-surface-300 dark:hover:bg-surface-700 h-7 min-w-[48px] rounded-lg px-2 text-center text-xs font-medium select-none hover:bg-white"
                                    size="xs"
                                    variant="plain"
                                >
                                    {Math.round(scale * 100)}%
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem
                                    onClick={() => {
                                        setScale(0.5);
                                        setRenderedScale(0.5);
                                    }}
                                >
                                    50%
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => {
                                        setScale(0.75);
                                        setRenderedScale(0.75);
                                    }}
                                >
                                    75%
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => {
                                        setScale(1.0);
                                        setRenderedScale(1.0);
                                    }}
                                >
                                    100%
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => {
                                        setScale(1.25);
                                        setRenderedScale(1.25);
                                    }}
                                >
                                    125%
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => {
                                        setScale(1.5);
                                        setRenderedScale(1.5);
                                    }}
                                >
                                    150%
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => {
                                        setScale(2.0);
                                        setRenderedScale(2.0);
                                    }}
                                >
                                    200%
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleFitWidth}>Fit to Width</DropdownMenuItem>
                                <DropdownMenuItem onClick={handleResetZoom}>Reset Zoom</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            className="dark:hover:bg-surface-700 h-7 w-7 rounded-lg p-0 hover:bg-white"
                            disabled={scale >= 3}
                            size="sm"
                            title="Zoom In (Cmd +)"
                            variant="plain"
                            onClick={handleZoomIn}
                        >
                            <MagnifyingGlassPlusIcon className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* View Options */}
                    <div className="flex shrink-0 items-center gap-1">
                        <Button
                            className="text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 h-8 w-8 p-0"
                            size="sm"
                            title="Fit to Width"
                            variant="plain"
                            onClick={handleFitWidth}
                        >
                            <ArrowsOutIcon className="h-5 w-5" />
                        </Button>
                        <Button
                            className="text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 h-8 w-8 p-0"
                            size="sm"
                            title="Reset Zoom (Cmd 0)"
                            variant="plain"
                            onClick={handleResetZoom}
                        >
                            <ArrowsInIcon className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </ScrollArea>

            {/* PDF Content - focusable for keyboard shortcuts */}
            <div
                ref={(node) => {
                    containerRef.current = node;
                    viewerRef.current = node;
                }}
                className={cn(
                    'relative w-full flex-1 overflow-hidden transition-shadow duration-200 outline-none',
                    isFocused && 'ring-accent-500/30 ring-2 ring-inset',
                )}
                tabIndex={0}
                onBlur={(e) => {
                    // Only blur if focus is moving outside the viewer
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setIsFocused(false);
                    }
                }}
                onClick={() => {
                    // Focus the viewer when clicking on it (but not when clicking inputs)
                    const activeElement = document.activeElement;
                    if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
                        viewerRef.current?.focus();
                    }
                }}
                onFocus={() => setIsFocused(true)}
                onKeyDown={handleKeyDown}
            >
                {error ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                            <p className="text-error-500 mb-4">{error}</p>
                            <Button variant="soft" onClick={() => window.location.reload()}>
                                Retry
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Document
                        className="h-full"
                        file={fileUrl}
                        loading={<PdfSkeleton />}
                        onLoadError={onDocumentLoadError}
                        onLoadSuccess={onDocumentLoadSuccess}
                    >
                        {isLoading ? (
                            <PdfSkeleton />
                        ) : (
                            numPages &&
                            renderedContainerWidth > 0 &&
                            containerHeight > 0 &&
                            Object.keys(pageAspectRatios).length === numPages && (
                                <List
                                    ref={listRef}
                                    height={containerHeight}
                                    innerRef={innerListRef}
                                    itemCount={numPages}
                                    itemSize={getPageHeight}
                                    outerElementType={CustomScrollArea}
                                    outerRef={setScrollViewportRef}
                                    width={containerWidth}
                                    onItemsRendered={onItemsRendered}
                                    onScroll={onListScroll}
                                    overscanCount={5} // Increased overscan count to reduce flickering
                                >
                                    {Row}
                                </List>
                            )
                        )}
                    </Document>
                )}
            </div>
        </div>
    );
}
