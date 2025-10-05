import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { ChartPopoverData, HoveredPoint } from '../types';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { debounce } from '../utils';

export interface DisambiguationChoice {
    name: string;
    point: HoveredPoint;
    popoverData: ChartPopoverData;
}

interface DisambiguationPopoverProps {
    choices: DisambiguationChoice[];
    position: { x: number; y: number };
    onSelect: (choice: DisambiguationChoice) => void;
    onClose: () => void;
}

export const DisambiguationPopover: React.FC<DisambiguationPopoverProps> = ({ choices, position, onSelect, onClose }) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties>({ opacity: 0 });
    
    useFocusTrap(popoverRef, choices.length > 0, onClose);

    useLayoutEffect(() => {
        const calculateAndSetPosition = () => {
             if (popoverRef.current) {
                const popoverEl = popoverRef.current;
                const popoverWidth = popoverEl.offsetWidth;
                const popoverHeight = popoverEl.offsetHeight;

                const margin = 10;
                const viewportWidth = document.documentElement.clientWidth;

                let x = position.x - (popoverWidth / 2);
                let y = position.y - popoverHeight - margin;

                if (x < margin) x = margin;
                if (x + popoverWidth > viewportWidth - margin) {
                    x = viewportWidth - popoverWidth - margin;
                }
                if (y < margin) {
                    y = position.y + margin;
                }

                setStyle({
                    top: `${y}px`,
                    left: `${x}px`,
                    opacity: 1,
                    pointerEvents: 'auto',
                });
            }
        };

        const rafId = requestAnimationFrame(calculateAndSetPosition);
        const debouncedHandler = debounce(calculateAndSetPosition, 100);
        
        window.addEventListener('resize', debouncedHandler);

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener('resize', debouncedHandler);
        };
    }, [position]);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);


    return (
        <div
            ref={popoverRef}
            style={style}
            className="fixed z-50 bg-slate-800 border border-indigo-500/50 ring-1 ring-indigo-500/30 rounded-lg shadow-2xl p-3 animate-fade-in-popover space-y-2"
            role="dialog"
            aria-modal="true"
            aria-labelledby="disambiguation-title"
        >
            <h3 id="disambiguation-title" className="text-sm font-semibold text-slate-300 text-center mb-2">¿Cuál ejercicio?</h3>
            {choices.map((choice) => (
                <button
                    key={choice.name}
                    onClick={() => onSelect(choice)}
                    className="w-full text-left px-3 py-1.5 text-sm bg-slate-700 hover:bg-indigo-600 rounded-md transition-colors duration-150 text-white"
                >
                    {choice.name}
                </button>
            ))}
        </div>
    );
};
