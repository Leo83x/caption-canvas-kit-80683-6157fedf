import { create } from 'zustand';
import type { GeneratedPost, Post } from '@/types';

interface PostsState {
    generatedPosts: GeneratedPost | null;
    savedPosts: Post[];
    currentPost: Post | null;
    setGeneratedPosts: (posts: GeneratedPost | null) => void;
    setSavedPosts: (posts: Post[]) => void;
    setCurrentPost: (post: Post | null) => void;
    addSavedPost: (post: Post) => void;
    removeSavedPost: (postId: string) => void;
    clearGeneratedPosts: () => void;
}

export const usePostsStore = create<PostsState>((set) => ({
    generatedPosts: null,
    savedPosts: [],
    currentPost: null,
    setGeneratedPosts: (posts) => set({ generatedPosts: posts }),
    setSavedPosts: (posts) => set({ savedPosts: posts }),
    setCurrentPost: (post) => set({ currentPost: post }),
    addSavedPost: (post) => set((state) => ({
        savedPosts: [...state.savedPosts, post]
    })),
    removeSavedPost: (postId) => set((state) => ({
        savedPosts: state.savedPosts.filter(p => p.id !== postId)
    })),
    clearGeneratedPosts: () => set({ generatedPosts: null }),
}));
