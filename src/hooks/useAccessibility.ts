import { useEffect } from 'react';

/**
 * Hook to manage focus trap within a modal or dialog
 */
export function useFocusTrap(isActive: boolean, containerRef: React.RefObject<HTMLElement>) {
    useEffect(() => {
        if (!isActive || !containerRef.current) return;

        const container = containerRef.current;
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        const handleTab = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement?.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement?.focus();
                    e.preventDefault();
                }
            }
        };

        container.addEventListener('keydown', handleTab);
        firstElement?.focus();

        return () => {
            container.removeEventListener('keydown', handleTab);
        };
    }, [isActive, containerRef]);
}

/**
 * Hook to announce messages to screen readers
 */
export function useAnnounce() {
    const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', priority);
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;

        document.body.appendChild(announcement);

        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    };

    return { announce };
}

/**
 * Hook to handle keyboard shortcuts
 */
export function useKeyboardShortcut(
    key: string,
    callback: () => void,
    options: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {}
) {
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            const matchesModifiers =
                (!options.ctrl || e.ctrlKey || e.metaKey) &&
                (!options.shift || e.shiftKey) &&
                (!options.alt || e.altKey);

            if (e.key.toLowerCase() === key.toLowerCase() && matchesModifiers) {
                e.preventDefault();
                callback();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [key, callback, options]);
}
