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
    const defaultDbPath = process.env.NODE_ENV === 'production' 
      ? path.join(process.env.LOCALAPPDATA || process.env.APPDATA || '', 'EduManage Pro', 'database', 'edumanage.db')
      : path.join(process.cwd(), 'data', 'edumanage.db');

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

  public static resetInstance(): void {
    DatabaseManager.instance = null;
  }

  public isConnected(): boolean {
    return this.db !== null && this.isInitialized;
  }

  public async initializeDatabase(): Promise<void> {
    try {
      // Ensure directory exists
      const dbDir = path.dirname(this.config.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        logger.info(`Created database directory: ${dbDir}`);
      }

      // Open database connection
      await this.connect();

      // Enable WAL mode for better concurrency
      if (this.config.enableWAL) {
        await this.executeInitQuery('PRAGMA journal_mode=WAL;');
      }

      // Set other pragmas for optimization
      await this.executeInitQuery('PRAGMA synchronous=NORMAL;');
      await this.executeInitQuery('PRAGMA cache_size=10000;');
      await this.executeInitQuery('PRAGMA foreign_keys=ON;');

      // Create tables manually to avoid SQL parsing issues
      await this.createTables();

      this.isInitialized = true;
      logger.info('Database initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      // Don't throw error - let server start without database
      logger.warn('Server starting without database functionality');
    }
  }

  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.config.dbPath, this.config.mode, (err) => {
        if (err) {
          logger.error('Failed to connect to database:', err);
          reject(err);
        } else {
          logger.info(`Connected to SQLite database: ${this.config.dbPath}`);
          resolve();
        }
      });
    });
  }

  private async createTables(): Promise<void> {
    try {
      // Create tables manually for testing
      logger.info('Creating database tables...');
      
      // Schools table
      await this.executeInitQuery(`
        CREATE TABLE IF NOT EXISTS schools (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          code TEXT UNIQUE NOT NULL,
          address TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      logger.info('Schools table created');

      // Students table
      await this.executeInitQuery(`
        CREATE TABLE IF NOT EXISTS students (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          admission_number TEXT UNIQUE NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          date_of_birth DATE NOT NULL,
          gender TEXT CHECK(gender IN ('Male', 'Female', 'Other')),
          address TEXT NOT NULL,
          admission_date DATE NOT NULL,
          status TEXT DEFAULT 'Active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      logger.info('Students table created');

      logger.info('Database tables created successfully');
    } catch (error: any) {
      logger.error('Failed to create tables:', {
        message: error.message,
        code: error.code
      });
      throw error;
    }
  }

  // Special method for initialization queries that doesn't check isInitialized flag
  private async executeInitQuery(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      this.db.run(sql, params, function(err) {
        if (err) {
          logger.error('Init query execution failed:', { sql, params, error: err });
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  public async runQuery(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db || !this.isInitialized) {
        reject(new Error('Database not connected or not initialized'));
        return;
      }

      this.db.run(sql, params, function(err) {
        if (err) {
          logger.error('Query execution failed:', { sql, params, error: err });
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  public async getOne(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db || !this.isInitialized) {
        reject(new Error('Database not connected or not initialized'));
        return;
      }

      this.db.get(sql, params, (err, row) => {
        if (err) {
          logger.error('Query execution failed:', { sql, params, error: err });
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  public async getAll(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db || !this.isInitialized) {
        reject(new Error('Database not connected or not initialized'));
        return;
      }

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          logger.error('Query execution failed:', { sql, params, error: err });
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  public async beginTransaction(): Promise<void> {
    await this.runQuery('BEGIN TRANSACTION;');
  }

  public async commit(): Promise<void> {
    await this.runQuery('COMMIT;');
  }

  public async rollback(): Promise<void> {
    await this.runQuery('ROLLBACK;');
  }

  public async getDatabaseStatus(): Promise<any> {
    try {
      const stats = fs.statSync(this.config.dbPath);
      const tableCount = await this.getOne(
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );
      
      return {
        connected: !!this.db,
        dbPath: this.config.dbPath,
        size: stats.size,
        lastModified: stats.mtime,
        tableCount: tableCount?.count || 0
      };
    } catch (error) {
      return {
        connected: !!this.db,
        dbPath: this.config.dbPath,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  public async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            logger.error('Failed to close database:', err);
            reject(err);
          } else {
            logger.info('Database connection closed');
            this.db = null;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  public getDatabase(): Database | null {
    return this.db;
  }
}
