import { useEffect, RefObject } from 'react';

export const useFocusTrap = (ref: RefObject<HTMLElement>, isActive: boolean, onDeactivate?: () => void) => {
    useEffect(() => {
        if (!isActive || !ref.current) return;

        const focusableElements = ref.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const previouslyFocusedElement = document.activeElement as HTMLElement;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            const isFirstElementActive = document.activeElement === firstElement;
            const isLastElementActive = document.activeElement === lastElement;

            if (e.shiftKey) { // Shift + Tab
                if (isFirstElementActive) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else { // Tab
                if (isLastElementActive) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        };
        
        // Focus the first element when the trap becomes active
        firstElement.focus();
        
        const currentRef = ref.current;
        currentRef.addEventListener('keydown', handleKeyDown);

        return () => {
            currentRef.removeEventListener('keydown', handleKeyDown);
            // Restore focus to the element that was focused before the trap was activated
            previouslyFocusedElement?.focus();
            onDeactivate?.();
        };
    }, [isActive, ref, onDeactivate]);
};
