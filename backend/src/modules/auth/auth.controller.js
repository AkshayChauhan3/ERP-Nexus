const { z } = require('zod');
const authService = require('./auth.service');

const loginSchema = z.object({
  login_id: z.string().min(3, 'login_id is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

const registerSchema = z.object({
  login_id: z.string().min(3, 'login_id is required').max(50),
  email: z.string().email('Invalid email format'),
  password: z.string().regex(passwordRegex, 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'),
  full_name: z.string().min(2, 'Full name is required'),
  position: z.string().min(2, 'Position is required'),
  address: z.string().optional(),
  mobile_no: z.string().optional(),
  requested_modules: z.array(z.number()).min(1, 'At least one module must be requested'),
});

async function login(req, res) {
  const data = loginSchema.parse(req.body);
  const result = await authService.login(data.login_id, data.password);
  res.json({
    success: true,
    message: 'Login successful',
    ...result,
  });
}

async function refresh(req, res) {
  const data = refreshSchema.parse(req.body);
  const result = await authService.refreshAccessToken(data.refreshToken);
  
  res.json({
    success: true,
    accessToken: result.accessToken,
  });
}

async function register(req, res) {
  const data = registerSchema.parse(req.body);
  const user = await authService.registerUser(data);
  
  res.status(201).json({
    success: true,
    message: 'User created successfully',
    user,
  });
}

async function logout(req, res) {
  const { refreshToken } = req.body;
  if (req.user && refreshToken) {
    await authService.logout(req.user.id, refreshToken);
  }
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}
async function forgotPassword(req, res) {
  res.json({ success: true, message: 'Forgot password stub' });
}
async function resetPassword(req, res) {
  res.json({ success: true, message: 'Reset password stub' });
}
async function verifyResetToken(req, res) {
  res.json({ success: true, valid: true });
}

module.exports = {
  login,
  refresh,
  register,
  logout,
  forgotPassword,
  resetPassword,
  verifyResetToken
};
