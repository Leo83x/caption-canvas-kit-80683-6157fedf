/**
 * Serviço de validação client-side
 * Complementa a validação do backend
 */

import { sanitizePost, type SanitizedPost } from '@/utils/sanitize';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * Valida dados de post antes de enviar
 */
export function validatePostData(data: {
    objective?: string;
    theme?: string;
    caption?: string;
    hashtags?: string[];
    tone?: string;
    style?: string;
}): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validações obrigatórias
    if (!data.objective) {
        errors.push('Objetivo da campanha é obrigatório');
    }

    if (!data.theme || data.theme.trim().length === 0) {
        errors.push('Tema/Descrição é obrigatório');
    }

    if (data.theme && data.theme.length < 10) {
        warnings.push('Tema muito curto. Seja mais descritivo para melhores resultados');
    }

    if (data.theme && data.theme.length > 500) {
        errors.push('Tema muito longo (máximo 500 caracteres)');
    }

    // Validações de caption (se fornecida)
    if (data.caption) {
        const sanitized = sanitizePost({ caption: data.caption, hashtags: data.hashtags });
        if (!sanitized.isValid) {
            errors.push(...sanitized.errors);
        }
    }

    // Validações de hashtags
    if (data.hashtags && data.hashtags.length > 0) {
        const invalidHashtags = data.hashtags.filter(tag => {
            const cleaned = tag.replace(/^#/, '');
            return cleaned.length === 0 || cleaned.length > 50;
        });

        if (invalidHashtags.length > 0) {
            errors.push(`Hashtags inválidas: ${invalidHashtags.join(', ')}`);
        }

        if (data.hashtags.length > 30) {
            errors.push('Máximo de 30 hashtags permitidas');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Rate limiter client-side
 * Previne spam de requisições
 */
class RateLimiter {
    private requests: Map<string, number[]> = new Map();
    private maxRequests: number;
    private windowMs: number;

    constructor(maxRequests: number = 10, windowMs: number = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }

    canMakeRequest(key: string): boolean {
        const now = Date.now();
        const requests = this.requests.get(key) || [];

        // Remove requisições antigas
        const recentRequests = requests.filter(time => now - time < this.windowMs);

        if (recentRequests.length >= this.maxRequests) {
            return false;
        }

        // Adiciona nova requisição
        recentRequests.push(now);
        this.requests.set(key, recentRequests);

        return true;
    }

    getRemainingRequests(key: string): number {
        const now = Date.now();
        const requests = this.requests.get(key) || [];
        const recentRequests = requests.filter(time => now - time < this.windowMs);
        return Math.max(0, this.maxRequests - recentRequests.length);
    }

    getResetTime(key: string): number {
        const requests = this.requests.get(key) || [];
        if (requests.length === 0) return 0;

        const oldestRequest = Math.min(...requests);
        return oldestRequest + this.windowMs;
    }
}

// Instância global do rate limiter
export const rateLimiter = new RateLimiter(10, 60000); // 10 requisições por minuto

/**
 * Verifica se pode fazer requisição
 */
export function canMakeRequest(userId: string): {
    allowed: boolean;
    remaining: number;
    resetAt?: number;
} {
    const allowed = rateLimiter.canMakeRequest(userId);
    const remaining = rateLimiter.getRemainingRequests(userId);
    const resetAt = allowed ? undefined : rateLimiter.getResetTime(userId);

    return { allowed, remaining, resetAt };
}
