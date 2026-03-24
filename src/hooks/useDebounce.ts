import { useEffect, useState } from 'react';

/**
 * Hook para debounce de valores
 * Útil para evitar updates excessivos em tempo real
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Set timeout para atualizar o valor após o delay
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Cleanup: cancela o timeout se o valor mudar antes do delay
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}
