export interface PostTemplate {
    id: string;
    name: string;
    category: 'promocao' | 'educativo' | 'engajamento' | 'lancamento' | 'inspiracional';
    objective: string;
    theme: string;
    tone: string;
    style: string;
    cta?: string;
    description: string;
    emoji: string;
}

export const postTemplates: PostTemplate[] = [
    // Promoção
    {
        id: 'promo-desconto',
        name: 'Promoção Relâmpago',
        category: 'promocao',
        objective: 'conversion',
        theme: 'Promoção especial com desconto limitado. Destaque a urgência e o benefício exclusivo para os seguidores.',
        tone: 'casual',
        style: 'vibrant',
        cta: 'Aproveite agora! Link na bio',
        description: 'Promoção com senso de urgência',
        emoji: '⚡'
    },
    {
        id: 'promo-lancamento',
        name: 'Lançamento de Produto',
        category: 'lancamento',
        objective: 'awareness',
        theme: 'Lançamento exclusivo de novo produto/serviço. Gere expectativa e mostre os diferenciais.',
        tone: 'professional',
        style: '3d',
        cta: 'Saiba mais no link da bio',
        description: 'Anúncio de novidade',
        emoji: '🚀'
    },

    // Educativo
    {
        id: 'edu-dica',
        name: 'Dica Rápida',
        category: 'educativo',
        objective: 'engagement',
        theme: 'Compartilhe uma dica valiosa relacionada ao seu nicho. Seja prático e direto.',
        tone: 'educational',
        style: 'flat',
        description: 'Conteúdo educativo curto',
        emoji: '💡'
    },
    {
        id: 'edu-tutorial',
        name: 'Tutorial Passo a Passo',
        category: 'educativo',
        objective: 'engagement',
        theme: 'Tutorial detalhado ensinando como fazer algo. Use numeração e seja claro.',
        tone: 'educational',
        style: 'illustration',
        description: 'Guia prático',
        emoji: '📚'
    },
    {
        id: 'edu-mito-verdade',
        name: 'Mito ou Verdade',
        category: 'educativo',
        objective: 'engagement',
        theme: 'Desmistifique um conceito comum da sua área. Esclareça dúvidas frequentes.',
        tone: 'casual',
        style: 'flat',
        description: 'Esclarecimento de conceitos',
        emoji: '🤔'
    },

    // Engajamento
    {
        id: 'eng-pergunta',
        name: 'Pergunta Interativa',
        category: 'engajamento',
        objective: 'engagement',
        theme: 'Faça uma pergunta interessante para seus seguidores. Incentive comentários e interação.',
        tone: 'casual',
        style: 'vibrant',
        cta: 'Conta nos comentários!',
        description: 'Estimula conversação',
        emoji: '💬'
    },
    {
        id: 'eng-enquete',
        name: 'Enquete de Opinião',
        category: 'engajamento',
        objective: 'engagement',
        theme: 'Crie uma enquete sobre preferências do seu público. Use opções claras.',
        tone: 'casual',
        style: 'flat',
        cta: 'Vote nos comentários!',
        description: 'Coleta opinião do público',
        emoji: '📊'
    },
    {
        id: 'eng-bastidores',
        name: 'Bastidores',
        category: 'engajamento',
        objective: 'awareness',
        theme: 'Mostre os bastidores do seu trabalho/empresa. Humanize sua marca.',
        tone: 'casual',
        style: 'photography',
        description: 'Conteúdo autêntico',
        emoji: '🎬'
    },

    // Inspiracional
    {
        id: 'insp-motivacao',
        name: 'Mensagem Motivacional',
        category: 'inspiracional',
        objective: 'engagement',
        theme: 'Compartilhe uma mensagem inspiradora relacionada ao seu nicho. Seja autêntico.',
        tone: 'emotional',
        style: 'abstract',
        description: 'Inspira e motiva',
        emoji: '✨'
    },
    {
        id: 'insp-historia',
        name: 'História de Sucesso',
        category: 'inspiracional',
        objective: 'awareness',
        theme: 'Conte uma história de superação ou conquista. Use storytelling envolvente.',
        tone: 'emotional',
        style: 'photography',
        description: 'Narrativa inspiradora',
        emoji: '🌟'
    },

    // Lançamento
    {
        id: 'lanc-preview',
        name: 'Teaser de Novidade',
        category: 'lancamento',
        objective: 'awareness',
        theme: 'Crie expectativa para algo novo que está por vir. Seja misterioso e intrigante.',
        tone: 'professional',
        style: 'abstract',
        cta: 'Fique ligado!',
        description: 'Gera antecipação',
        emoji: '🔮'
    },
    {
        id: 'lanc-contagem',
        name: 'Contagem Regressiva',
        category: 'lancamento',
        objective: 'awareness',
        theme: 'Contagem regressiva para lançamento. Destaque a data e gere urgência.',
        tone: 'casual',
        style: 'vibrant',
        cta: 'Marque na agenda!',
        description: 'Countdown para evento',
        emoji: '⏰'
    },
];

export const getTemplatesByCategory = (category: PostTemplate['category']) => {
    return postTemplates.filter(t => t.category === category);
};

export const getTemplateById = (id: string) => {
    return postTemplates.find(t => t.id === id);
};

export const categories = [
    { value: 'promocao', label: 'Promoção', emoji: '🎁' },
    { value: 'educativo', label: 'Educativo', emoji: '📚' },
    { value: 'engajamento', label: 'Engajamento', emoji: '💬' },
    { value: 'lancamento', label: 'Lançamento', emoji: '🚀' },
    { value: 'inspiracional', label: 'Inspiracional', emoji: '✨' },
] as const;
