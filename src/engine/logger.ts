import { db } from '../lib/db';

export class ResearchLogger {
  private static instance: ResearchLogger;

  public static getInstance(): ResearchLogger {
    if (!ResearchLogger.instance) {
      ResearchLogger.instance = new ResearchLogger();
    }
    return ResearchLogger.instance;
  }

  public async log(
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG',
    source: 'WS' | 'ENGINE' | 'PAPER_TRADER' | 'SYSTEM' | string,
    message: string,
    metadata?: any
  ) {
    const formatted = `[${new Date().toISOString()}] [${level}] [${source}] ${message}`;
    if (level === 'ERROR') {
      console.error(formatted, metadata || '');
    } else {
      console.log(formatted);
    }

    try {
      await db.researchLog.create({
        data: {
          level,
          source,
          message,
          metadataJson: metadata ? JSON.stringify(metadata) : null,
        },
      });
    } catch (e) {
      // Ignore DB log error to prevent cascade
    }
  }
}

export const logger = ResearchLogger.getInstance();
