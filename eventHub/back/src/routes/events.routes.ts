/**
 * Routes d'événements
 */

import { Router } from 'express';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getMyEvents,
  getOrganizerStats,
} from '../controllers/events.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { UserRole } from '../models/user.js';

const router = Router();

// GET /events — Liste des événements (public)
router.get('/', getEvents);

// GET /events/:id — Détail d'un événement (public)
router.get('/:id', getEventById);

// POST /events — Créer un événement (organisateur uniquement)
router.post('/', authenticate, requireRole('organizer', 'admin'), createEvent);

// PUT /events/:id — Modifier un événement (propriétaire uniquement)
router.put('/:id', authenticate, requireRole('organizer', 'admin'), updateEvent);

// DELETE /events/:id — Supprimer un événement (propriétaire uniquement)
router.delete('/:id', authenticate, requireRole('organizer', 'admin'), deleteEvent);

// GET /organizer/events — Mes événements (organisateur)
router.get('/organizer/my-events', authenticate, requireRole('organizer', 'admin'), getMyEvents);

// GET /organizer/stats — Statistiques (organisateur)
router.get('/organizer/stats', authenticate, requireRole('organizer', 'admin'), getOrganizerStats);

export default router;