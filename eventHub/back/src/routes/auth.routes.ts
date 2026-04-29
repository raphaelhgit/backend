/**
 * Routes d'authentification
 *
 * Les routes définissent quels contrôleur appelle pour quelle URL.
 * On utilise Express Router pour regrouper les routes liées.
 */

import { Router } from 'express';
import { register, login, getMe, updateMe } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// POST /auth/register — Création de compte
router.post('/register', register);

// POST /auth/login — Connexion
router.post('/login', login);

// GET /auth/me — Profil de l'utilisateur connecté (protégé)
router.get('/me', authenticate, getMe);

// PUT /auth/me — Modifier le profil (protégé)
router.put('/me', authenticate, updateMe);

export default router;