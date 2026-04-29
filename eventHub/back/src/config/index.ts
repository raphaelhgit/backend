/**
 * Configuration de l'application EventHub
 *
 * Ce fichier centralise toutes les variables d'environnement.
 * En Node.js/Express, on utilise process.env pour accéder aux
 * variables d'environnement système.
 *
 * Avantages de ce centraliser les configs :
 * - Un seul endroit à modifier pour changer une config
 * - Validation des variables obligatoires au démarrage
 * - Documentation des variables attendu
 */

import dotenv from 'dotenv';

// Charge le fichier .env (variables locales) en priorité
// En production, ces variables sont injectées par l'environnement
dotenv.config();

/**
 * Port sur lequel le serveur Express écoute.
 * process.env.PORT est standardisé dans les hébergeurs (Railway, Render, etc.)
 * Si non défini, on utilise 3000 par défaut.
 */
const PORT = process.env.PORT ?? 3000;

/**
 * Chaîne de connexion à la base de données SQLite.
 * Stockée dans DATABASE_URL pour s'aligner avec les conventions Twelve-Factor App.
 */
const DATABASE_URL = process.env.DATABASE_URL ?? 'eventhub.db';

/**
 * Secret JWT utilisé pour signer les tokens d'authentification.
 * WARNING: En production, ce secret DOIT être un string aléatoire de 256+ bits.
 * Jamais commité dans le code source. Utilisez une variable d'environnement.
 */
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';

/**
 * Durée de validité d'un token JWT en secondes.
 * 24 heures = 86400 secondes
 */
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '24h';

/**
 * Durée d'expiration du JWT en millisecondes (pour le code).
 */
const JWT_EXPIRES_MS = 24 * 60 * 60 * 1000;

/**
 * Mode de l'application (development / production).
 * Utile pour activer/desactiver certaines fonctionnalités.
 */
const NODE_ENV = process.env.NODE_ENV ?? 'development';

/**
 * URL du frontend — utilisée pour les headers CORS.
 * En développement : http://localhost:5173 (Vite default)
 * En production : votre domaine frontend
 */
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

/**
 * Vérification au démarrage : le secret JWT ne doit pas être le défaut.
 * Cela évite d'avoir un token signable avec un secret dev en production.
 */
if (NODE_ENV === 'production' && JWT_SECRET === 'dev-secret-change-in-production') {
  throw new Error('JWT_SECRET must be set to a secure value in production. Check your environment variables.');
}

export const config = {
  port: PORT,
  databaseUrl: DATABASE_URL,
  jwtSecret: JWT_SECRET,
  jwtExpiresIn: JWT_EXPIRES_IN,
  jwtExpiresMs: JWT_EXPIRES_MS,
  nodeEnv: NODE_ENV,
  frontendUrl: FRONTEND_URL,
  isProduction: NODE_ENV === 'production',
  isDevelopment: NODE_ENV === 'development',
};

export default config;