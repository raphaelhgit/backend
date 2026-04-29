/**
 * Routes de billetterie
 */

import { Router } from 'express';
import {
  buyTicket,
  getMyTickets,
  getTicketById,
  updateTicketStatus,
} from '../controllers/tickets.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { UserRole } from '../models/user.js';

const router = Router();

// POST /tickets — Acheter un billet (utilisateur connecté)
router.post('/', authenticate, buyTicket);

// GET /tickets — Mes billets (utilisateur connecté)
router.get('/', authenticate, getMyTickets);

// GET /tickets/:id — Détail d'un billet (propriétaire ou admin)
router.get('/:id', authenticate, getTicketById);

// PATCH /tickets/:id/status — Modifier le statut (admin uniquement)
router.patch('/:id/status', authenticate, requireRole('admin'), updateTicketStatus);

export default router;