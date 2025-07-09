import express, { Router } from 'express';
import { AuthService } from '../services/AuthService';
import { authenticateToken, AuthenticatedRequest, authorizeRoles } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import rateLimit from 'express-rate-limit';

const router: Router = express.Router();
const authService = new AuthService();

// Rate limiting for auth endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many login attempts, please try again later'
  },
  skipSuccessfulRequests: true
});

const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    error: 'Too many password reset attempts, please try again later'
  }
});

// POST /api/auth/login - User login
router.post('/login', loginLimiter, asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ 
      error: 'Username and password are required' 
    });
  }

  const result = await authService.login({ username, password });
  
  res.json({
    message: 'Login successful',
    token: result.token,
    user: result.user,
    expiresIn: result.expiresIn
  });
}));

// POST /api/auth/register - Register new user (Admin only)
router.post('/register', 
  authenticateToken, 
  authorizeRoles('Super Admin', 'Principal'), 
  asyncHandler(async (req, res) => {
    const userData = req.body;
    const authenticatedReq = req as AuthenticatedRequest;
    
    if (!userData.username || !userData.email || !userData.password || !userData.role) {
      return res.status(400).json({ 
        error: 'Username, email, password, and role are required' 
      });
    }

    const newUser = await authService.register(userData, authenticatedReq.user!.id);
    
    // Remove sensitive information
    const { password: _, ...userResponse } = newUser as any;
    
    res.status(201).json({
      message: 'User registered successfully',
      user: userResponse
    });
  })
);

// POST /api/auth/logout - User logout
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (token) {
    await authService.logout(token);
  }
  
  res.json({ message: 'Logout successful' });
}));

// POST /api/auth/change-password - Change password
router.post('/change-password', authenticateToken, asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const authenticatedReq = req as AuthenticatedRequest;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ 
      error: 'Old password and new password are required' 
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ 
      error: 'New password must be at least 6 characters long' 
    });
  }

  await authService.changePassword(authenticatedReq.user!.id, oldPassword, newPassword);
  
  res.json({ message: 'Password changed successfully' });
}));

// POST /api/auth/reset-password - Reset password (Admin only)
router.post('/reset-password', 
  resetPasswordLimiter,
  authenticateToken, 
  authorizeRoles('Super Admin', 'Principal'), 
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const tempPassword = await authService.resetPassword(email);
    
    res.json({ 
      message: 'Password reset successfully',
      tempPassword: tempPassword,
      note: 'Please provide this temporary password to the user and ask them to change it immediately'
    });
  })
);

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  res.json({ user: authenticatedReq.user });
}));

// POST /api/auth/verify-token - Verify token validity
router.post('/verify-token', asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  const user = await authService.verifyToken(token);
  
  if (user) {
    const { password: _, ...userWithoutPassword } = user as any;
    res.json({ 
      valid: true, 
      user: userWithoutPassword 
    });
  } else {
    res.json({ valid: false });
  }
}));

// Permission management routes

// POST /api/auth/permissions/grant - Grant permission to user
router.post('/permissions/grant', 
  authenticateToken, 
  authorizeRoles('Super Admin', 'Principal'), 
  asyncHandler(async (req, res) => {
    const { userId, permission } = req.body;
    const authenticatedReq = req as AuthenticatedRequest;

    if (!userId || !permission) {
      return res.status(400).json({ 
        error: 'User ID and permission are required' 
      });
    }

    await authService.grantPermission(userId, permission, authenticatedReq.user!.id);
    
    res.json({ message: 'Permission granted successfully' });
  })
);

// DELETE /api/auth/permissions/revoke - Revoke permission from user
router.delete('/permissions/revoke', 
  authenticateToken, 
  authorizeRoles('Super Admin', 'Principal'), 
  asyncHandler(async (req, res) => {
    const { userId, permission } = req.body;

    if (!userId || !permission) {
      return res.status(400).json({ 
        error: 'User ID and permission are required' 
      });
    }

    await authService.revokePermission(userId, permission);
    
    res.json({ message: 'Permission revoked successfully' });
  })
);

// GET /api/auth/permissions/check - Check if user has permission
router.get('/permissions/check', authenticateToken, asyncHandler(async (req, res) => {
  const { permission } = req.query;
  const authenticatedReq = req as AuthenticatedRequest;

  if (!permission) {
    return res.status(400).json({ error: 'Permission parameter is required' });
  }

  const hasPermission = await authService.hasPermission(
    authenticatedReq.user!.id, 
    permission as string
  );
  
  res.json({ hasPermission });
}));

export default router;
