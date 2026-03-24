import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { InstagramConnection } from '@/types';

interface InstagramState {
    connection: InstagramConnection | null;
    isConnected: boolean;
    setConnection: (connection: InstagramConnection | null) => void;
    disconnect: () => void;
}

export const useInstagramStore = create<InstagramState>()(
    persist(
        (set) => ({
            connection: null,
            isConnected: false,
            setConnection: (connection) => set({
                connection,
                isConnected: !!connection
            }),
            disconnect: () => set({ connection: null, isConnected: false }),
        }),
        {
            name: 'instagram-storage',
        }
    )
);
