// Domain Types
export interface User {
    id: string;
    email: string;
    created_at: string;
    updated_at: string;
}

export interface CompanyProfile {
    id: string;
    user_id: string;
    company_name: string;
    industry: string;
    target_audience: string;
    brand_voice: string;
    created_at: string;
    updated_at: string;
}

export interface InstagramConnection {
    id: string;
    user_id: string;
    instagram_user_id: string;
    username: string;
    access_token: string;
    token_expires_at: string;
    facebook_page_id: string;
    created_at: string;
    updated_at: string;
}

export interface Post {
    id: string;
    user_id: string;
    caption: string;
    image_url?: string;
    hashtags: string[];
    scheduled_for?: string;
    published_at?: string;
    status: PostStatus;
    engagement_metrics?: EngagementMetrics;
    created_at: string;
    updated_at: string;
}

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';

export interface EngagementMetrics {
    likes: number;
    comments: number;
    shares: number;
    reach: number;
    impressions: number;
}

export interface PostSlide {
    image_url: string;
    headlineText?: string;
    imagePrompt?: string;
    altText?: string;
}

export interface VideoScene {
    scene: string;
    description: string;
    duration: string;
    text?: string;
    videoKeywords?: string;
}

export interface PostVariation {
    id?: string;
    variant: string;
    caption: string;
    tone: string;
    hashtags: string[];
    imageUrl?: string;
    supabaseUrl?: string;
    storagePath?: string;
    imagePrompt: {
        description: string;
        colors: string[];
        style: string;
        aspectRatio: string;
        elements: string[];
        mood: string;
    };
    altText: string;
    rationale: string;
    headlineText?: string;
    textOverlay?: {
        text: string;
        position: 'top' | 'center' | 'bottom';
    };
    slides?: PostSlide[];
    videoScript?: VideoScene[];
    sourceUrl?: string;
    successScore?: number;
    successAnalysis?: string;
    imageError?: string | null;
}

export interface GeneratedPost {
    variations: PostVariation[];
    metadata: {
        objective: string;
        tone: string;
        postType: string;
        requiresReview: boolean;
        reviewReason: string | null;
    };
}

// Component Props Types
export interface PostCreatorProps {
    onPostGenerated?: (variations: GeneratedPost) => void;
}

export interface PostPreviewProps {
    variations: GeneratedPost;
}

export interface ScheduleCalendarProps {
    posts?: Post[];
    onDateSelect?: (date: Date) => void;
}

// Form Types
export interface PostFormData {
    topic: string;
    tone: string;
    includeHashtags: boolean;
    includeEmojis: boolean;
    targetAudience?: string;
}

export interface CompanyProfileFormData {
    company_name: string;
    industry: string;
    target_audience: string;
    brand_voice: string;
}

// API Response Types
export interface ApiResponse<T> {
    data?: T;
    error?: ApiError;
}

export interface ApiError {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
}

export interface TrendAlert {
    id: string;
    title: string;
    description?: string;
    category?: string;
    source_url?: string;
    relevance_score: number;
    created_at: string;
}

// Session Types
export interface Session {
    user: User;
    access_token: string;
    refresh_token: string;
    expires_at: number;
}
