import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DatabaseManager } from '../database/DatabaseManager';
import { ValidationError, UnauthorizedError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: string;
  firstName: string;
  lastName: string;
  phone?: string;
  employeeId?: string;
  department?: string;
  subjectsTaught?: string[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  phone?: string;
  employeeId?: string;
  department?: string;
  subjectsTaught?: string[];
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'password'>;
  expiresIn: number;
}

export class AuthService {
  private dbManager: DatabaseManager;
  private jwtSecret: string;
  private jwtExpiresIn: string | number;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
  }

  public async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const { username, password } = credentials;

      if (!username || !password) {
        throw new ValidationError('Username and password are required');
      }

      // Get user from database
      const user = await this.getUserByUsername(username);
      if (!user) {
        throw new UnauthorizedError('Invalid credentials');
      }

      if (!user.isActive) {
        throw new UnauthorizedError('Account is disabled');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Generate JWT token
      const token = this.generateToken(user);

      // Update last login
      await this.updateLastLogin(user.id);

      // Create session record
      await this.createSession(user.id, token);

      // Remove password from user object
      const { password: _, ...userWithoutPassword } = user;

      logger.info(`User ${username} logged in successfully`);

      return {
        token,
        user: userWithoutPassword,
        expiresIn: this.getTokenExpirationTime()
      };
    } catch (error) {
      logger.error('Login failed:', error);
      throw error;
    }
  }

  public async register(userData: RegisterRequest, createdBy: number): Promise<User> {
    try {
      // Validate required fields
      if (!userData.username || !userData.email || !userData.password) {
        throw new ValidationError('Username, email, and password are required');
      }

      // Check if username already exists
      const existingUser = await this.getUserByUsername(userData.username);
      if (existingUser) {
        throw new ValidationError('Username already exists');
      }

      // Check if email already exists
      const existingEmail = await this.getUserByEmail(userData.email);
      if (existingEmail) {
        throw new ValidationError('Email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Insert user into database
      const query = `
        INSERT INTO users (
          username, email, password_hash, role, first_name, last_name, 
          phone, employee_id, department, subjects_taught
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await this.dbManager.runQuery(query, [
        userData.username,
        userData.email,
        hashedPassword,
        userData.role,
        userData.firstName,
        userData.lastName,
        userData.phone || null,
        userData.employeeId || null,
        userData.department || null,
        userData.subjectsTaught ? JSON.stringify(userData.subjectsTaught) : null
      ]);

      const newUser = await this.getUserById(result.lastID);
      logger.info(`New user ${userData.username} registered successfully`);

      return newUser;
    } catch (error) {
      logger.error('Registration failed:', error);
      throw error;
    }
  }

  public async logout(token: string): Promise<void> {
    try {
      // Invalidate session
      await this.invalidateSession(token);
      logger.info('User logged out successfully');
    } catch (error) {
      logger.error('Logout failed:', error);
      throw error;
    }
  }

  public async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        throw new ValidationError('User not found');
      }

      // Verify old password
      const isValidPassword = await bcrypt.compare(oldPassword, user.password);
      if (!isValidPassword) {
        throw new UnauthorizedError('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      const query = 'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      await this.dbManager.runQuery(query, [hashedPassword, userId]);

      logger.info(`Password changed for user ID: ${userId}`);
    } catch (error) {
      logger.error('Password change failed:', error);
      throw error;
    }
  }

  public async resetPassword(email: string): Promise<string> {
    try {
      const user = await this.getUserByEmail(email);
      if (!user) {
        throw new ValidationError('User not found');
      }

      // Generate temporary password
      const tempPassword = this.generateTempPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 12);

      // Update password
      const query = 'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      await this.dbManager.runQuery(query, [hashedPassword, user.id]);

      logger.info(`Password reset for user: ${email}`);
      return tempPassword;
    } catch (error) {
      logger.error('Password reset failed:', error);
      throw error;
    }
  }

  public async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      
      // Check if session is still valid
      const session = await this.getValidSession(token);
      if (!session) {
        return null;
      }

      const user = await this.getUserById(decoded.userId);
      return user && user.isActive ? user : null;
    } catch (error) {
      logger.error('Token verification failed:', error);
      return null;
    }
  }

  public async hasPermission(userId: number, permission: string): Promise<boolean> {
    try {
      const query = 'SELECT COUNT(*) as count FROM user_permissions WHERE user_id = ? AND permission = ?';
      const result = await this.dbManager.getOne(query, [userId, permission]);
      return result.count > 0;
    } catch (error) {
      logger.error('Permission check failed:', error);
      return false;
    }
  }

  public async grantPermission(userId: number, permission: string, grantedBy: number): Promise<void> {
    try {
      const query = `
        INSERT OR IGNORE INTO user_permissions (user_id, permission, granted_by)
        VALUES (?, ?, ?)
      `;
      await this.dbManager.runQuery(query, [userId, permission, grantedBy]);
      logger.info(`Permission ${permission} granted to user ${userId}`);
    } catch (error) {
      logger.error('Grant permission failed:', error);
      throw error;
    }
  }

  public async revokePermission(userId: number, permission: string): Promise<void> {
    try {
      const query = 'DELETE FROM user_permissions WHERE user_id = ? AND permission = ?';
      await this.dbManager.runQuery(query, [userId, permission]);
      logger.info(`Permission ${permission} revoked from user ${userId}`);
    } catch (error) {
      logger.error('Revoke permission failed:', error);
      throw error;
    }
  }

  // Private helper methods
  private async getUserByUsername(username: string): Promise<any> {
    const query = 'SELECT * FROM users WHERE username = ?';
    return await this.dbManager.getOne(query, [username]);
  }

  private async getUserByEmail(email: string): Promise<any> {
    const query = 'SELECT * FROM users WHERE email = ?';
    return await this.dbManager.getOne(query, [email]);
  }

  private async getUserById(id: number): Promise<any> {
    const query = 'SELECT * FROM users WHERE id = ?';
    return await this.dbManager.getOne(query, [id]);
  }

  private generateToken(user: any): string {
    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      email: user.email
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: '24h' });
  }

  private getTokenExpirationTime(): number {
    // Return expiration time in seconds
    const expiresIn = this.jwtExpiresIn as string;
    if (typeof expiresIn === 'string') {
      if (expiresIn.endsWith('h')) {
        return parseInt(expiresIn) * 3600;
      } else if (expiresIn.endsWith('d')) {
        return parseInt(expiresIn) * 24 * 3600;
      }
    }
    return 24 * 3600; // Default 24 hours
  }

  private async updateLastLogin(userId: number): Promise<void> {
    const query = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?';
    await this.dbManager.runQuery(query, [userId]);
  }

  private async createSession(userId: number, token: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + this.getTokenExpirationTime());

    const query = `
      INSERT INTO user_sessions (user_id, session_token, expires_at)
      VALUES (?, ?, ?)
    `;
    await this.dbManager.runQuery(query, [userId, token, expiresAt.toISOString()]);
  }

  private async invalidateSession(token: string): Promise<void> {
    const query = 'DELETE FROM user_sessions WHERE session_token = ?';
    await this.dbManager.runQuery(query, [token]);
  }

  private async getValidSession(token: string): Promise<any> {
    const query = `
      SELECT * FROM user_sessions 
      WHERE session_token = ? AND expires_at > CURRENT_TIMESTAMP
    `;
    return await this.dbManager.getOne(query, [token]);
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
