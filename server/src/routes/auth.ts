import { Router } from 'express';
import { db, clinics } from '../db/index.js';
import { authenticateUser } from '../auth.js';

const router = Router();

// GET /api/clinics - list clinics for login dropdown
router.get('/clinics', async (_req, res) => {
  try {
    const list = await db.select({ id: clinics.id, name: clinics.name }).from(clinics).orderBy(clinics.name);
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch clinics' });
  }
});

// POST /api/auth/login - { username, password, clinicId? }
router.post('/login', async (req, res) => {
  const { username, password, clinicId } = req.body ?? {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const result = await authenticateUser(username, password, clinicId || null);
  if (!result) {
    return res.status(401).json({ error: 'Invalid credentials or clinic' });
  }

  res.json({ token: result.token, user: result.user });
});

// GET /api/auth/me - validate token, return current user
router.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }
  const { verifyToken } = require('../auth.js');
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  res.json(payload);
});

export default router;
