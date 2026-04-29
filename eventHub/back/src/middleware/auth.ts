/**
 * Middleware d'authentification JWT
 *
 * Ce middleware vérifie que la requête HTTP contient un token JWT valide.
 * Il protège les routes qui nécessitent une connexion.
 *
 * Fonctionnement :
 * 1. Extraction du token depuis le header Authorization: Bearer <token>
 * 2. Vérification de la validité du token (signature, expiration)
 * 3. Décodage du payload et attachement à req.user
 * 4. Si invalide → réponse 401 Unauthorized
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { JwtPayload } from '../models/user.js';

// =============================================================================
// TYPE AUGMENTATION
// =============================================================================

// On extend l'interface Request de Express pour ajouter `user`.
// Cela permet d'accéder à req.user dans les contrôleurs.
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// =============================================================================
// MIDDLEWARE
// =============================================================================

/**
 * Authenticate — Vérifie le token JWT
 *
 * À utiliser sur les routes qui nécessitent une authentification.
 * Si le token est absent ou invalide, la requête est rejetée avec 401.
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Étape 1 : Extraire le header Authorization
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Authorization header missing' });
    return;
  }

  // Étape 2 : Vérifier le format "Bearer <token>"
  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Invalid authorization format. Use: Bearer <token>' });
    return;
  }

  const token = authHeader.slice(7); // Enlève "Bearer "

  if (!token) {
    res.status(401).json({ error: 'Token missing' });
    return;
  }

  // Étape 3 : Vérifier et décoder le token
  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = payload; // Attache le payload à la requête
    next(); // Passe au middleware/contrôleur suivant
  } catch (error) {
    // jwt.verify lève une erreur si :
    // - Le token est expiré (TokenExpiredError)
    // - La signature est invalide (JsonWebTokenError)
    // - Le token est malformé (JsonWebTokenError)
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    res.status(500).json({ error: 'Token verification failed' });
  }
}

/**
 * RequireRole — Vérifie que l'utilisateur a un rôle spécifique
 *
 * À utiliser APRÈS authenticate, car elle dépend de req.user.
 * Permet de restreindre l'accès à certaines routes à certains rôles.
 *
 * @example
 * router.post('/events', authenticate, requireRole('organizer'), createEvent);
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Access denied',
        requiredRoles: allowedRoles,
        yourRole: req.user.role,
      });
      return;
    }

    next();
  };
}

/**
 * OptionalAuth — Authentification optionnelle
 *
 * Si un token est présent et valide, req.user est rempli.
 * Si absent ou invalide, la requête continue quand même (req.user = undefined).
 *
 * Utile pour les routes publiques qui varient selon l'utilisateur connecté.
 */
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = payload;
  } catch {
    // Token invalide ou expiré — on continue sans user
  }

  next();
}

export default { authenticate, requireRole, optionalAuth };