import sqlite3 from 'sqlite3';
import { Database } from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

export interface DatabaseConfig {
  dbPath: string;
  mode?: number;
  enableWAL?: boolean;
}

export class DatabaseManager {
  private static instance: DatabaseManager | null = null;
  private db: Database | null = null;
  private config: DatabaseConfig;
  private isInitialized: boolean = false;

  private constructor(config?: Partial<DatabaseConfig>) {
    const defaultDbPath = path.join(process.cwd(), 'src', 'database', 'school_management.db');
    this.config = {
      dbPath: defaultDbPath,
      mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
      enableWAL: true,
      ...config
    };
  }

  public static getInstance(config?: Partial<DatabaseConfig>): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager(config);
    }
    return DatabaseManager.instance;
  }

  public async initializeDatabase(): Promise<void> {
    try {
      const dbDir = path.dirname(this.config.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      await this.connect();
      await this.createTables();
      this.isInitialized = true;
      logger.info('Database initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database:', error);
    }
  }

  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.config.dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  private async createTables(): Promise<void> {
    const schemaPath = path.join(process.cwd(), 'src', 'database', 'simple-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await this.runQuery(statement + ';');
      }
    }
  }

  public async runQuery(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  public async getOne(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  public async getAll(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  public isConnected(): boolean {
    return this.db !== null && this.isInitialized;
  }

  public async getDatabaseStatus(): Promise<any> {
    try {
      if (!this.isConnected()) {
        return { status: 'disconnected', tables: 0 };
      }

      const result = await this.getOne("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'");
      return { 
        status: 'connected', 
        tables: result.count,
        path: this.config.dbPath 
      };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  public async beginTransaction(): Promise<void> {
    await this.runQuery('BEGIN TRANSACTION');
  }

  public async commit(): Promise<void> {
    await this.runQuery('COMMIT');
  }

  public async rollback(): Promise<void> {
    await this.runQuery('ROLLBACK');
  }

  public async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          this.db = null;
          this.isInitialized = false;
          resolve();
        }
      });
    });
  }
}