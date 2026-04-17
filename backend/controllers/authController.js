
import bcrypt from 'bcryptjs';
import User from "../models/Users.js";

export const login = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password)
      return res.status(400).json({ message: 'Username and password are required' });

    if (!role || !['admin', 'branch'].includes(role))
      return res.status(400).json({ message: 'Role must be "admin" or "branch"' });

    const user = await User.findByUsername(username);
    if (!user)
      return res.status(401).json({ message: 'Invalid username or password' });

    if (user.role !== role)
      return res.status(401).json({ message: `This account is not a ${role} account` });

    if (user.status === 'inactive')
      return res.status(403).json({ message: 'Your account has been deactivated. Contact admin.' });

    // ✅ Verify password using bcryptjs
    const isPasswordValid = user.password_hash
      ? await bcrypt.compare(password, user.password_hash)
      : false;

    if (!isPasswordValid) {
      // Fallback to demo password for testing (remove in production)
      const DEMO_PASSWORDS = { admin: 'admin123', branch: 'branch123' };
      if (DEMO_PASSWORDS[username] !== password)
        return res.status(401).json({ message: 'Invalid username or password' });
    }

    // const token = jwt.sign(...);

    const branch = user.branch_id
      ? { id: user.branch_id, name: user.branch_name, location: user.branch_location }
      : null;

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch,
      },
      message: 'Login successful',
    });

  } catch (err) {
    console.error('[authController.login]', err);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

export const logout = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { password_hash, ...safe } = user;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch current user', error: err.message });
  }
};