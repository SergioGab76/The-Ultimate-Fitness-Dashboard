import { useState, useLayoutEffect, RefObject, CSSProperties } from 'react';
import { ChartPopoverData, PerformanceChartRef } from '../types';
import { debounce } from '../utils';

export const usePopoverPosition = (
    chartPopoverData: ChartPopoverData | null,
    popoverRef: RefObject<HTMLDivElement>,
    chartRef: RefObject<PerformanceChartRef>
) => {
    const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({
        opacity: 0,
        transform: 'scale(0.95)',
        pointerEvents: 'none',
    });

    useLayoutEffect(() => {
        const calculateAndSetPosition = () => {
            const popoverEl = popoverRef.current;
            const chartInstance = chartRef.current?.getChartInstance();

            if (!chartPopoverData || !popoverEl || !chartInstance?.chartArea) {
                // Hide popover if data/refs are not available
                 setPopoverStyle(prev => ({ ...prev, opacity: 0, pointerEvents: 'none' }));
                return;
            }

            const canvasRect = chartInstance.canvas.getBoundingClientRect();
            const chartArea = chartInstance.chartArea;
            
            const popoverWidth = popoverEl.offsetWidth;
            const popoverHeight = popoverEl.offsetHeight;
            
            // Calculate the desired center of the chart's drawable area
            const centerX = canvasRect.left + chartArea.left + chartArea.width / 2;
            const centerY = canvasRect.top + chartArea.top + chartArea.height / 2;

            // Calculate the desired top-left position to center the popover
            let x = centerX - (popoverWidth / 2);
            let y = centerY - (popoverHeight / 2);

            // Keep popover within viewport bounds
            const margin = 16;
            const viewportWidth = document.documentElement.clientWidth;
            const viewportHeight = document.documentElement.clientHeight;

            // Clamp X position (left/right edges)
            if (x + popoverWidth > viewportWidth - margin) {
                x = viewportWidth - popoverWidth - margin;
            }
            if (x < margin) {
                x = margin;
            }
            
            // Clamp Y position (top/bottom edges)
            if (y + popoverHeight > viewportHeight - margin) {
                y = viewportHeight - popoverHeight - margin;
            }
            if (y < margin) {
                y = margin;
            }

            setPopoverStyle({
                opacity: 1,
                top: `${y}px`,
                left: `${x}px`,
                transform: 'scale(1)',
                pointerEvents: 'auto',
            });
        };

        if (!chartPopoverData) {
            setPopoverStyle({
                opacity: 0,
                transform: 'scale(0.95)',
                pointerEvents: 'none',
            });
            return;
        }

        // Run calculation after the next browser paint to ensure dimensions are accurate
        const rafId = requestAnimationFrame(calculateAndSetPosition);
        
        // Add a debounced resize handler to avoid performance issues
        const debouncedHandler = debounce(calculateAndSetPosition, 100);
        window.addEventListener('resize', debouncedHandler);

        // Cleanup function to remove event listener
        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener('resize', debouncedHandler);
        };
    }, [chartPopoverData, popoverRef, chartRef]);

    return popoverStyle;
};
