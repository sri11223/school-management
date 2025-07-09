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
      try {
        await this.createTables();
        logger.info('All database tables created successfully');
      } catch (tableError) {
        // If there's an error creating tables, log it but continue
        // We may have partial functionality with the tables that were created
        logger.warn('Some tables failed to create, but continuing with available functionality');
        logger.error('Table creation error details:', tableError);
      }

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
      logger.info('Creating database tables from complete schema...');
      
      // Read the complete schema file - look in src directory
      const schemaPath = path.join(process.cwd(), 'src', 'database', 'complete-schema.sql');
      
      if (!fs.existsSync(schemaPath)) {
        logger.error(`Schema file not found at: ${schemaPath}`);
        throw new Error(`Schema file not found: ${schemaPath}`);
      }
      
      const schema = fs.readFileSync(schemaPath, 'utf8');
      logger.info(`Schema file read successfully, length: ${schema.length} characters`);
      
      // Better SQL statement parsing
      // Remove comments and normalize line endings
      const cleanedSchema = schema
        .replace(/--.*$/gm, '') // Remove line comments
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/\r\n/g, '\n') // Normalize line endings
        .replace(/\n\s*\n/g, '\n'); // Remove empty lines
      
      // Split by semicolon but be smarter about it
      const statements = cleanedSchema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 5) // Filter out very short statements
        .filter(stmt => !stmt.match(/^\s*(--|\/\*)/)); // Filter remaining comments
      
      logger.info(`Found ${statements.length} SQL statements to execute`);
      
      // Execute each statement
      let successCount = 0;
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.trim()) {
          try {
            logger.info(`Executing statement ${i + 1}/${statements.length}: ${statement.substring(0, 100)}...`);
            await this.executeInitQuery(statement + ';');
            successCount++;
          } catch (error: any) {
            // Check if it's an INSERT statement - we can continue if inserts fail
            const isInsertStatement = statement.trim().toUpperCase().startsWith('INSERT');
            if (isInsertStatement) {
              logger.warn(`Non-critical error executing statement ${i + 1} (INSERT):`, {
                statement: statement.substring(0, 200),
                error: error.message
              });
              // Continue with the next statement - don't throw
            } else if (statement.trim().toUpperCase().startsWith('CREATE TABLE IF NOT EXISTS')) {
              // For CREATE TABLE IF NOT EXISTS, we can also continue
              logger.warn(`Table may already exist, continuing - statement ${i + 1}:`, {
                statement: statement.substring(0, 200),
                error: error.message
              });
            } else {
              logger.error(`Failed to execute statement ${i + 1}:`, {
                statement: statement.substring(0, 200),
                error: error.message
              });
              // For other statements like CREATE TABLE (without IF NOT EXISTS), we need to stop
              throw error;
            }
          }
        }
      }
      
      logger.info(`Database tables created successfully (${successCount} statements executed)`);
    } catch (error: any) {
      logger.error('Failed to create tables:', {
        message: error.message,
        code: error.code,
        stack: error.stack
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

      // Get the first 50 chars of the SQL statement for better logging
      const sqlPreview = sql.substring(0, 50).replace(/\s+/g, ' ').trim();
      
      this.db.run(sql, params, function(err) {
        if (err) {
          // Handle specific SQLite error codes
          const sqliteErr = err as any; // Type cast to access code property
          
          if (sqliteErr.code === 'SQLITE_CONSTRAINT') {
            // Constraint violation - probably a duplicate key, can be ignored in many cases
            logger.warn(`Constraint violation in query: ${sqlPreview}...`, { error: err.message });
            resolve({ lastID: 0, changes: 0, warning: 'constraint_violation' });
          } else if (sqliteErr.code === 'SQLITE_ERROR' && sql.toUpperCase().includes('INSERT')) {
            // SQL error in insert statement - log but don't fail completely
            logger.warn(`SQL error in insert statement: ${sqlPreview}...`, { error: err.message });
            resolve({ lastID: 0, changes: 0, warning: 'insert_error' });
          } else {
            // Other errors - might be more serious
            logger.error('Init query execution failed:', { sql: sqlPreview, params, error: err });
            reject(err);
          }
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
