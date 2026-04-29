/**
 * Point d'entrée du serveur EventHub API
 *
 * Ce fichier initialise Express, configure les middlewares,
 * enregistre les routes, et démarre le serveur.
 *
 * Ordre d'exécution :
 * 1. Import des modules
 * 2. Création de l'application Express
 * 3. Configuration des middlewares
 * 4. Enregistrement des routes
 * 5. Démarrage du serveur
 */

import express from 'express';
import cors from 'cors';
import config from './config/index.js';
import authRoutes from './routes/auth.routes.js';
import eventRoutes from './routes/events.routes.js';
import ticketRoutes from './routes/tickets.routes.js';
import { seedDemoData } from './services/seed.js';

// =============================================================================
// INITIALISATION EXPRESS
// =============================================================================

const app = express();

// =============================================================================
// MIDDLEWARES GLOBAUX
// =============================================================================

/**
 * cors() — Cross-Origin Resource Sharing
 * Permet au frontend (port 5173 en dev) de faire des requêtes vers le backend (port 3000).
 * Sans ça, le navigateur bloque les requêtes cross-origin.
 */
app.use(cors({
  origin: config.frontendUrl, // Origin autorisée
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // Méthodes HTTP autorisées
  allowedHeaders: ['Content-Type', 'Authorization'], // Headers autorisés
  credentials: true, // Autoriser les cookies / headers d'authentification
}));

/**
 * express.json() — Parse le body des requêtes JSON
 * Permet d'accéder à req.body dans les contrôleurs.
 * Sans ça, req.body serait undefined.
 */
app.use(express.json());

/**
 * express.urlencoded() — Parse les données de formulaire (optionnel ici)
 * Utile si le frontend envoie des formulaires classiques.
 */
app.use(express.urlencoded({ extended: true }));

// =============================================================================
// ROUTES
// =============================================================================

// Route de base — test de connexion à l'API
app.get('/', (req, res) => {
  res.json({
    name: 'EventHub API',
    version: '1.0.0',
    status: 'running',
    environment: config.nodeEnv,
  });
});

// Health check — utile pour les outils de monitoring / load balancers
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Montage des routes
app.use('/auth', authRoutes);
app.use('/events', eventRoutes);
app.use('/tickets', ticketRoutes);

// =============================================================================
// GESTION DES ERREURS 404
// =============================================================================

// Si aucune route n'a correspondu, on retourne 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`,
  });
});

// =============================================================================
// GESTION DES ERREURS GLOBALES
// =============================================================================

// Gestionnaire d'erreurs global (doit avoir 4 arguments : err, req, res, next)
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.isDevelopment ? err.message : 'An unexpected error occurred',
  });
});

// =============================================================================
// DEMARRAGE DU SERVEUR
// =============================================================================

/**
 * On démaring le serveur sur le port configuré.
 * On utilise une IIFE (Immediately Invoked Function Expression) async
 * pour pouvoir utiliser await pour le seed des données de démo.
 */
(async () => {
  try {
    // Seed des données de démo au premier démarrage
    // Ces données sont utilisées pour tester l'application
    // (cf. sección "Données de démonstration" de l'énoncé)
    await seedDemoData();

    // Démarrage du serveur
    app.listen(Number(config.port), '0.0.0.0', () => {
      console.log(`EventHub API running on http://localhost:${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
      console.log(`Frontend URL: ${config.frontendUrl}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();

export default app;