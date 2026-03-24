type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    context?: Record<string, any>;
    error?: Error;
}

class Logger {
    private isDevelopment = import.meta.env.DEV;

    private formatLog(entry: LogEntry): string {
        const { timestamp, level, message, context } = entry;
        const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
    }

    private createEntry(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): LogEntry {
        return {
            level,
            message,
            timestamp: new Date().toISOString(),
            context,
            error,
        };
    }

    private log(entry: LogEntry): void {
        const formattedLog = this.formatLog(entry);

        // Em desenvolvimento, usa console
        if (this.isDevelopment) {
            switch (entry.level) {
                case 'error':
                    console.error(formattedLog, entry.error || '');
                    break;
                case 'warn':
                    console.warn(formattedLog);
                    break;
                case 'debug':
                    console.debug(formattedLog);
                    break;
                default:
                    console.log(formattedLog);
            }
        }

        // Em produção, pode enviar para serviço externo (Sentry, LogRocket, etc)
        if (!this.isDevelopment && entry.level === 'error') {
            this.sendToMonitoring(entry);
        }
    }

    private sendToMonitoring(entry: LogEntry): void {
        // Placeholder para integração futura com Sentry ou similar
        // window.Sentry?.captureException(entry.error, {
        //   extra: entry.context,
        //   level: entry.level,
        // });

        // Por enquanto, apenas armazena localmente
        try {
            const errors = JSON.parse(localStorage.getItem('error_logs') || '[]');
            errors.push(entry);
            // Mantém apenas os últimos 50 erros
            if (errors.length > 50) errors.shift();
            localStorage.setItem('error_logs', JSON.stringify(errors));
        } catch (e) {
            console.error('Failed to store error log', e);
        }
    }

    info(message: string, context?: Record<string, any>): void {
        this.log(this.createEntry('info', message, context));
    }

    warn(message: string, context?: Record<string, any>): void {
        this.log(this.createEntry('warn', message, context));
    }

    error(message: string, error?: Error, context?: Record<string, any>): void {
        this.log(this.createEntry('error', message, context, error));
    }

    debug(message: string, context?: Record<string, any>): void {
        this.log(this.createEntry('debug', message, context));
    }

    // Método para recuperar logs armazenados
    getStoredErrors(): LogEntry[] {
        try {
            return JSON.parse(localStorage.getItem('error_logs') || '[]');
        } catch {
            return [];
        }
    }

    // Método para limpar logs armazenados
    clearStoredErrors(): void {
        localStorage.removeItem('error_logs');
    }
}

// Instância singleton
export const logger = new Logger();

// Hook para capturar erros não tratados
export function setupErrorTracking(): void {
    // Captura erros não tratados
    window.addEventListener('error', (event) => {
        logger.error('Uncaught error', event.error, {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
        });
    });

    // Captura promises rejeitadas não tratadas
    window.addEventListener('unhandledrejection', (event) => {
        logger.error('Unhandled promise rejection', event.reason, {
            promise: event.promise,
        });
    });

    logger.info('Error tracking initialized');
}
