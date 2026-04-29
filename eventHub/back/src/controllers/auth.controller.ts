/**
 * Contrôleur d'authentification
 *
 * Les contrôleurs contiennent la logique métier liée aux requêtes HTTP.
 * Chaque fonction correspond à un endpoint (GET, POST, etc.)
 *
 * Responsabilités d'un contrôleur :
 * - Lire les données de la requête (body, params, query)
 * - Appeler les services (db) pour la logique métier
 * - Renvoyer la réponse HTTP appropriée (200, 201, 400, 401, 404, 500)
 */

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import db from '../services/db.js';
import config from '../config/index.js';
import { UserRole } from '../models/user.js';

/**
 * POST /auth/register
 * Créer un nouveau compte utilisateur
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name } = req.body;

    // Validation des champs obligatoires
    if (!email || !password || !name) {
      res.status(400).json({ error: 'email, password and name are required' });
      return;
    }

    // Validation du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    // Validation de la longueur du mot de passe
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const user = await db.users.create({
      email,
      password,
      name,
      role: UserRole.USER,
    });

    // Génération du token JWT pour connexion automatique
    const token = generateToken(user.id, user.email, user.role);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'EMAIL_ALREADY_EXISTS') {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /auth/login
 * Connecter un utilisateur existant
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required' });
      return;
    }

    // Recherche de l'utilisateur par email
    const user = await db.users.findByEmail(email);

    if (!user) {
      // On retourne un message générique pour ne pas révéler
      // si c'est l'email ou le mot de passe qui est incorrect
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Vérification du mot de passe
    const isValid = await db.users.verifyPassword(user, password);

    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Génération du token JWT
    const token = generateToken(user.id, user.email, user.role);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /auth/me
 * Récupérer le profil de l'utilisateur connecté
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await db.users.findById(req.user.sub);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PUT /auth/me
 * Modifier le profil de l'utilisateur connecté
 */
export async function updateMe(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { name } = req.body;

    if (!name || name.trim() === '') {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const updated = await db.users.update(req.user.sub, { name: name.trim() });

    res.json({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    console.error('UpdateMe error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Génère un token JWT pour un utilisateur.
 * Le payload contient l'ID, l'email et le rôle.
 * La signature est le secret JWT (config.jwtSecret).
 */
function generateToken(userId: string, email: string, role: string): string {
  return jwt.sign(
    { sub: userId, email, role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'] }
  );
}

export default { register, login, getMe, updateMe };