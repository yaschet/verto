/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import {
    ArrowClockwiseIcon,
    ArrowCounterClockwiseIcon,
    ArrowsHorizontalIcon,
    ArrowsOutIcon,
    ArrowsVerticalIcon,
    CheckIcon,
    FrameCornersIcon,
    InfoIcon,
    MagnifyingGlassMinusIcon,
    MagnifyingGlassPlusIcon,
    SpinnerGapIcon,
} from '@phosphor-icons/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/library/utils';
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';

type ImageViewerProps = {
    fileUrl: string;
    className?: string;
    isCollapsed?: boolean;
    isResizing?: boolean;
};

// Preset zoom levels following Figma/Photoshop standards
const ZOOM_PRESETS = [
    { label: '25%', value: 0.25 },
    { label: '50%', value: 0.5 },
    { label: '75%', value: 0.75 },
    { label: '100%', value: 1 },
    { label: '150%', value: 1.5 },
    { label: '200%', value: 2 },
] as const;

export function ImageViewer({
    className,
    fileUrl,
    isCollapsed = false,
    isResizing = false,
}: ImageViewerProps) {
    const [scale, setScale] = useState(1.0);
    const [rotation, setRotation] = useState(0);
    const [flipHorizontal, setFlipHorizontal] = useState(false);
    const [flipVertical, setFlipVertical] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
    const [fitScale, setFitScale] = useState(1); // Scale needed to fit entire image
    const [fitMode, setFitMode] = useState<'fit' | 'width' | 'height' | '100' | ''>('fit'); // Default to fit view
    const [lastDoubleClickState, setLastDoubleClickState] = useState<'fit' | '100'>('fit'); // For toggle behavior
    const containerRef = useRef<HTMLDivElement>(null);
    const transformRef = useRef<ReactZoomPanPinchRef | null>(null);
    const isProgrammaticZoom = useRef(false); // Track if zoom is from button click vs user gesture
    const imageRef = useRef<HTMLImageElement>(null);

    // Calculate dynamic minimum scale to prevent zooming out past container bounds
    const minScale = useMemo(() => {
        if (!imageDimensions || !containerRef.current) return 0.05;
        const containerWidth = containerRef.current.offsetWidth || 800;
        const containerHeight = containerRef.current.offsetHeight || 600;
        const fitWidthScale = containerWidth / imageDimensions.width;
        const fitHeightScale = containerHeight / imageDimensions.height;
        // Allow zooming out to at most 50% of fit scale (some padding)
        return Math.max(Math.min(fitWidthScale, fitHeightScale) * 0.5, 0.05);
    }, [imageDimensions]);

    // Load image and get dimensions
    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            setImageDimensions({ width: img.width, height: img.height });
            setIsLoading(false);
            setError(null);
        };
        img.onerror = () => {
            setError('Failed to load image. Please try again.');
            setIsLoading(false);
        };
        img.src = fileUrl;

        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [fileUrl]);

    // Apply fit-to-view by default after image loads and container is ready
    useEffect(() => {
        if (!imageDimensions || !containerRef.current || !transformRef.current) return;

        // Small delay to ensure container dimensions are ready
        const timeoutId = setTimeout(() => {
            if (containerRef.current && transformRef.current && imageDimensions) {
                const containerWidth = containerRef.current.offsetWidth;
                const containerHeight = containerRef.current.offsetHeight;
                // Fit to view: scale so entire image fits within container (with some padding)
                const fitWidthScale = (containerWidth / imageDimensions.width) * 0.95;
                const fitHeightScale = (containerHeight / imageDimensions.height) * 0.95;
                const calculatedFitScale = Math.min(fitWidthScale, fitHeightScale);
                const clampedScale = Math.min(Math.max(calculatedFitScale, 0.05), 3);

                setFitScale(clampedScale);
                transformRef.current.centerView(clampedScale);
            }
        }, 150);

        return () => clearTimeout(timeoutId);
    }, [imageDimensions]);

    // Zoom controls - these clear fit mode since user is manually adjusting
    const handleZoomIn = useCallback(() => {
        if (transformRef.current) {
            setFitMode('');
            transformRef.current.zoomIn();
        }
    }, []);

    const handleZoomOut = useCallback(() => {
        if (transformRef.current) {
            setFitMode('');
            transformRef.current.zoomOut();
        }
    }, []);

    // Fit entire image within viewport (contain)
    const handleFitToView = useCallback(() => {
        if (transformRef.current && containerRef.current && imageDimensions) {
            isProgrammaticZoom.current = true;
            const containerWidth = containerRef.current.offsetWidth;
            const containerHeight = containerRef.current.offsetHeight;
            const fitWidthScale = (containerWidth / imageDimensions.width) * 0.9;
            const fitHeightScale = (containerHeight / imageDimensions.height) * 0.9;
            const newScale = Math.min(fitWidthScale, fitHeightScale);
            setFitMode('fit');
            setFitScale(newScale);
            transformRef.current.centerView(newScale);
            setTimeout(() => {
                isProgrammaticZoom.current = false;
            }, 300);
        }
    }, [imageDimensions]);

    const handleFitToWidth = useCallback(() => {
        if (transformRef.current && containerRef.current && imageDimensions) {
            isProgrammaticZoom.current = true;
            const containerWidth = containerRef.current.offsetWidth;
            const scale = (containerWidth / imageDimensions.width) * 0.9;
            setFitMode('width');
            transformRef.current.centerView(scale);
            setTimeout(() => {
                isProgrammaticZoom.current = false;
            }, 300);
        }
    }, [imageDimensions]);

    const handleFitToHeight = useCallback(() => {
        if (transformRef.current && containerRef.current && imageDimensions) {
            isProgrammaticZoom.current = true;
            const containerHeight = containerRef.current.offsetHeight;
            const scale = (containerHeight / imageDimensions.height) * 0.9;
            setFitMode('height');
            transformRef.current.centerView(scale);
            setTimeout(() => {
                isProgrammaticZoom.current = false;
            }, 300);
        }
    }, [imageDimensions]);

    // Set to 100% actual size
    const handleActualSize = useCallback(() => {
        if (transformRef.current) {
            isProgrammaticZoom.current = true;
            setFitMode('100');
            transformRef.current.centerView(1);
            setTimeout(() => {
                isProgrammaticZoom.current = false;
            }, 300);
        }
    }, []);

    // Set to specific zoom level from dropdown
    const handleZoomToLevel = useCallback((zoomLevel: number) => {
        if (transformRef.current) {
            isProgrammaticZoom.current = true;
            setFitMode(zoomLevel === 1 ? '100' : '');
            transformRef.current.centerView(zoomLevel);
            setTimeout(() => {
                isProgrammaticZoom.current = false;
            }, 300);
        }
    }, []);

    const handleFitModeChange = useCallback(
        (value: string) => {
            if (value === 'fit') {
                handleFitToView();
            } else if (value === 'width') {
                handleFitToWidth();
            } else if (value === 'height') {
                handleFitToHeight();
            } else if (value === '100') {
                handleActualSize();
            }
        },
        [handleFitToView, handleFitToWidth, handleFitToHeight, handleActualSize],
    );

    // Smart double-click handler: toggle between Fit and 100%
    const handleDoubleClick = useCallback(() => {
        if (lastDoubleClickState === 'fit') {
            handleActualSize();
            setLastDoubleClickState('100');
        } else {
            handleFitToView();
            setLastDoubleClickState('fit');
        }
    }, [lastDoubleClickState, handleActualSize, handleFitToView]);

    // Rotation controls
    const handleRotateLeft = () => {
        setRotation((prev) => prev - 90);
    };

    const handleRotateRight = () => {
        setRotation((prev) => prev + 90);
    };

    // Flip controls
    const handleFlipHorizontal = () => {
        setFlipHorizontal((prev) => !prev);
    };

    const handleFlipVertical = () => {
        setFlipVertical((prev) => !prev);
    };

    // Handle scale changes from the transform component
    // Only clear fitMode on user gestures (wheel/pinch), not programmatic changes
    const handleTransformChange = useCallback((ref: ReactZoomPanPinchRef) => {
        setScale(ref.state.scale);
        // Don't clear fitMode during programmatic zoom animations
        if (!isProgrammaticZoom.current) {
            setFitMode('');
        }
    }, []);

    // Keyboard shortcuts using react-hotkeys-hook (works globally when component is mounted)
    // Zoom shortcuts
    useHotkeys(
        'mod+=, mod+plus',
        (e) => {
            e.preventDefault();
            handleZoomIn();
        },
        { enableOnFormTags: false },
    );
    useHotkeys(
        'mod+-',
        (e) => {
            e.preventDefault();
            handleZoomOut();
        },
        { enableOnFormTags: false },
    );
    useHotkeys(
        'mod+0',
        (e) => {
            e.preventDefault();
            handleFitToView();
        },
        { enableOnFormTags: false },
    );
    useHotkeys(
        'mod+1',
        (e) => {
            e.preventDefault();
            handleActualSize();
        },
        { enableOnFormTags: false },
    );

    // Transform shortcuts (Alt/Option modifier)
    useHotkeys('alt+r', () => handleRotateRight(), { enableOnFormTags: false });
    useHotkeys('alt+shift+r', () => handleRotateLeft(), { enableOnFormTags: false });
    useHotkeys('alt+h', () => handleFlipHorizontal(), { enableOnFormTags: false });
    useHotkeys('alt+v', () => handleFlipVertical(), { enableOnFormTags: false });

    return (
        <div className={cn('bg-surface-1 flex h-full w-full flex-col overflow-hidden', className)}>
            {/* Toolbar */}
            <div className="border-surface-3 dark:border-surface-800 dark:bg-surface-950 z-10 h-14 flex-shrink-0 border-b bg-white">
                <div className="flex h-14 w-full items-center justify-between gap-1 px-2 sm:gap-2 sm:px-4">
                    {/* Document Info Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="h-9 gap-1.5 px-2" size="sm" variant="plain">
                                <InfoIcon className="h-4 w-4" />
                                <span className="hidden text-xs font-medium sm:inline">Info</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                            <DropdownMenuLabel>Document Information</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {imageDimensions && (
                                <div className="px-3 py-2 text-sm">
                                    <span className="text-surface-600 dark:text-surface-400">
                                        Dimensions:
                                    </span>
                                    <span className="ml-2 font-medium">
                                        {imageDimensions.width} × {imageDimensions.height}px
                                    </span>
                                </div>
                            )}
                            {rotation !== 0 && (
                                <div className="px-3 py-2 text-sm">
                                    <span className="text-surface-600 dark:text-surface-400">Rotation:</span>
                                    <span className="ml-2 font-medium">{rotation}°</span>
                                </div>
                            )}
                            {(flipHorizontal || flipVertical) && (
                                <div className="px-3 py-2 text-sm">
                                    <span className="text-surface-600 dark:text-surface-400">Flipped:</span>
                                    <span className="ml-2 font-medium">
                                        {flipHorizontal && 'Horizontal'}
                                        {flipHorizontal && flipVertical && ' + '}
                                        {flipVertical && 'Vertical'}
                                    </span>
                                </div>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Zoom Controls with Preset Dropdown */}
                    <div className="bg-surface-2 dark:bg-surface-800 flex shrink-0 items-center gap-0.5 rounded-xl p-0.5">
                        <Button
                            className="dark:hover:bg-surface-700 h-8 w-8 rounded-lg p-0 hover:bg-white"
                            disabled={scale <= minScale}
                            size="sm"
                            tooltipContent="Zoom Out (⌘ -)"
                            variant="plain"
                            onClick={handleZoomOut}
                        >
                            <MagnifyingGlassMinusIcon className="h-4 w-4" />
                        </Button>

                        {/* Clickable Zoom Percentage with Preset Dropdown */}
                        <DropdownMenu>
                            <TooltipProvider delayDuration={400}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuTrigger asChild>
                                            <button className="text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 min-w-[52px] cursor-pointer rounded-md px-1.5 py-1 text-center text-xs font-medium transition-colors select-none">
                                                {Math.round(scale * 100)}%
                                            </button>
                                        </DropdownMenuTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>Click for zoom presets</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <DropdownMenuContent align="center" className="w-36">
                                <DropdownMenuLabel className="text-xs">Zoom Level</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {/* Fit to View option */}
                                <DropdownMenuItem onClick={handleFitToView}>
                                    <FrameCornersIcon className="mr-2 h-4 w-4" />
                                    Fit
                                    {fitMode === 'fit' && <CheckIcon className="ml-auto h-4 w-4" />}
                                    <DropdownMenuShortcut>⌘0</DropdownMenuShortcut>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {/* Preset zoom levels */}
                                {ZOOM_PRESETS.map((preset) => (
                                    <DropdownMenuItem
                                        key={preset.value}
                                        onClick={() => handleZoomToLevel(preset.value)}
                                    >
                                        {preset.label}
                                        {Math.abs(scale - preset.value) < 0.05 && (
                                            <CheckIcon className="ml-auto h-4 w-4" />
                                        )}
                                        {preset.value === 1 && (
                                            <DropdownMenuShortcut>⌘1</DropdownMenuShortcut>
                                        )}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            className="dark:hover:bg-surface-700 h-8 w-8 rounded-lg p-0 hover:bg-white"
                            disabled={scale >= 5}
                            size="sm"
                            tooltipContent="Zoom In (⌘ +)"
                            variant="plain"
                            onClick={handleZoomIn}
                        >
                            <MagnifyingGlassPlusIcon className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* View Options */}
                    <div className="flex shrink-0 items-center gap-1">
                        <TooltipProvider delayDuration={400}>
                            <ToggleGroup
                                className="bg-surface-2 dark:bg-surface-800"
                                size="sm"
                                type="single"
                                value={fitMode}
                                onValueChange={handleFitModeChange}
                            >
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <ToggleGroupItem className="h-8 w-8 p-0" value="fit">
                                            <FrameCornersIcon className="h-4 w-4" />
                                        </ToggleGroupItem>
                                    </TooltipTrigger>
                                    <TooltipContent>Fit to View (⌘ 0)</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <ToggleGroupItem className="h-8 w-8 p-0" value="width">
                                            <ArrowsOutIcon className="h-4 w-4" />
                                        </ToggleGroupItem>
                                    </TooltipTrigger>
                                    <TooltipContent>Fit to Width</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <ToggleGroupItem className="h-8 w-8 p-0" value="100">
                                            <span className="text-[10px] font-bold">1:1</span>
                                        </ToggleGroupItem>
                                    </TooltipTrigger>
                                    <TooltipContent>100% Actual Size (⌘ 1)</TooltipContent>
                                </Tooltip>
                            </ToggleGroup>
                        </TooltipProvider>

                        <div className="bg-surface-200 dark:bg-surface-800 mx-1 h-4 w-px" />

                        {/* Transform Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    className={cn(
                                        'h-9 w-9 p-0',
                                        'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100',
                                        (rotation !== 0 || flipHorizontal || flipVertical) &&
                                            'text-accent-600 dark:text-accent-400',
                                    )}
                                    size="sm"
                                    variant="plain"
                                >
                                    <ArrowClockwiseIcon className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuLabel>Transform</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleRotateLeft}>
                                    <ArrowCounterClockwiseIcon className="mr-2 h-4 w-4" />
                                    Rotate Left
                                    <DropdownMenuShortcut>⌥⇧R</DropdownMenuShortcut>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleRotateRight}>
                                    <ArrowClockwiseIcon className="mr-2 h-4 w-4" />
                                    Rotate Right
                                    <DropdownMenuShortcut>⌥R</DropdownMenuShortcut>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleFlipHorizontal}>
                                    <ArrowsHorizontalIcon className="mr-2 h-4 w-4" />
                                    Flip Horizontal
                                    <DropdownMenuShortcut>⌥H</DropdownMenuShortcut>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleFlipVertical}>
                                    <ArrowsVerticalIcon className="mr-2 h-4 w-4" />
                                    Flip Vertical
                                    <DropdownMenuShortcut>⌥V</DropdownMenuShortcut>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Image Content */}
            <div
                ref={containerRef}
                className="relative min-h-0 w-full flex-1 outline-none"
                onDoubleClick={handleDoubleClick}
            >
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <SpinnerGapIcon className="border-accent-500 h-8 w-8 animate-spin" />
                            <span className="text-surface-600 dark:text-surface-400 text-sm">
                                Loading image...
                            </span>
                        </div>
                    </div>
                ) : error ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-error-500 mb-4">{error}</p>
                            <Button variant="soft" onClick={() => window.location.reload()}>
                                Retry
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="absolute inset-0 overflow-hidden">
                        <TransformWrapper
                            ref={transformRef}
                            alignmentAnimation={{
                                disabled: false,
                                animationTime: 200,
                                animationType: 'easeOut',
                            }}
                            centerOnInit={true}
                            disabled={isCollapsed || isResizing}
                            doubleClick={{
                                disabled: true, // Disable built-in double-click, we handle it manually
                            }}
                            initialScale={fitScale}
                            limitToBounds={false}
                            maxScale={5}
                            minScale={minScale}
                            panning={{
                                disabled: false,
                                velocityDisabled: false,
                                excluded: ['input', 'textarea', 'button'],
                            }}
                            pinch={{ step: 5 }}
                            wheel={{
                                step: 0.05, // 5% per scroll
                                wheelDisabled: false,
                                touchPadDisabled: false,
                                smoothStep: 0.01, // Smoother for trackpad gestures
                                activationKeys: [], // Allow zooming without holding keys
                            }}
                            onTransformed={handleTransformChange}
                        >
                            <TransformComponent
                                wrapperStyle={{
                                    width: '100%',
                                    height: '100%',
                                }}
                            >
                                <img
                                    ref={imageRef}
                                    alt="Document"
                                    className="transition-transform duration-300 ease-in-out select-none"
                                    draggable={false}
                                    src={fileUrl}
                                    style={{
                                        maxWidth: 'none',
                                        maxHeight: 'none',
                                        objectFit: 'contain',
                                        imageOrientation: 'from-image', // Respect EXIF orientation
                                        transform: `
                                            rotate(${rotation}deg)
                                            scaleX(${flipHorizontal ? -1 : 1})
                                            scaleY(${flipVertical ? -1 : 1})
                                        `,
                                    }}
                                />
                            </TransformComponent>
                        </TransformWrapper>
                    </div>
                )}
            </div>
        </div>
    );
}
