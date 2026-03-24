/**
 * Utilitários para sanitização de inputs
 * Previne XSS e outros ataques
 */

/**
 * Remove tags HTML e scripts maliciosos
 */
export function sanitizeHTML(input: string): string {
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
        .replace(/<embed\b[^<]*>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
}

/**
 * Sanitiza texto simples removendo caracteres perigosos
 */
export function sanitizeText(input: string): string {
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove < e >
        .replace(/javascript:/gi, '') // Remove javascript:
        .replace(/data:/gi, ''); // Remove data:
}

/**
 * Valida e sanitiza URL
 */
export function sanitizeURL(url: string): string | null {
    try {
        const sanitized = url.trim();

        // Verifica se é uma URL válida
        const urlObj = new URL(sanitized);

        // Permite apenas http e https
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            return null;
        }

        return sanitized;
    } catch {
        return null;
    }
}

/**
 * Sanitiza hashtags
 */
export function sanitizeHashtags(hashtags: string[]): string[] {
    return hashtags
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .map(tag => {
            // Remove caracteres especiais exceto letras, números e _
            const cleaned = tag.replace(/[^\w\u00C0-\u017F]/g, '');
            // Garante que começa com #
            return cleaned.startsWith('#') ? cleaned : `#${cleaned}`;
        })
        .filter(tag => tag.length > 1); // Remove tags vazias
}

/**
 * Valida tamanho de caption
 */
export function validateCaptionLength(caption: string, maxLength: number = 2200): {
    isValid: boolean;
    length: number;
    remaining: number;
} {
    const length = caption.length;
    return {
        isValid: length <= maxLength,
        length,
        remaining: maxLength - length,
    };
}

/**
 * Valida número de hashtags
 */
export function validateHashtagCount(hashtags: string[], maxCount: number = 30): {
    isValid: boolean;
    count: number;
    remaining: number;
} {
    const count = hashtags.length;
    return {
        isValid: count <= maxCount,
        count,
        remaining: maxCount - count,
    };
}

/**
 * Sanitização completa de post
 */
export interface SanitizedPost {
    caption: string;
    hashtags: string[];
    imageUrl: string | null;
    isValid: boolean;
    errors: string[];
}

export function sanitizePost(data: {
    caption: string;
    hashtags?: string[];
    imageUrl?: string;
}): SanitizedPost {
    const errors: string[] = [];

    // Sanitiza caption
    const caption = sanitizeText(data.caption);
    const captionValidation = validateCaptionLength(caption);
    if (!captionValidation.isValid) {
        errors.push(`Caption excede ${captionValidation.length - captionValidation.remaining} caracteres`);
    }

    // Sanitiza hashtags
    const hashtags = data.hashtags ? sanitizeHashtags(data.hashtags) : [];
    const hashtagValidation = validateHashtagCount(hashtags);
    if (!hashtagValidation.isValid) {
        errors.push(`Número de hashtags (${hashtagValidation.count}) excede o limite de 30`);
    }

    // Sanitiza URL da imagem
    let imageUrl: string | null = null;
    if (data.imageUrl) {
        imageUrl = sanitizeURL(data.imageUrl);
        if (!imageUrl) {
            errors.push('URL da imagem inválida');
        }
    }

    return {
        caption,
        hashtags,
        imageUrl,
        isValid: errors.length === 0,
        errors,
    };
}
