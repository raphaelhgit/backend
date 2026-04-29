/**
 * Contrôleur de billetterie
 */

import { Request, Response } from 'express';
import db from '../services/db.js';
import { TicketStatus } from '../models/ticket.js';

/**
 * POST /tickets
 * Acheter un billet pour un événement
 */
export async function buyTicket(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { eventId } = req.body;

    if (!eventId) {
      res.status(400).json({ error: 'eventId is required' });
      return;
    }

    const event = db.events.findById(eventId!);

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    if (event.availablePlaces <= 0) {
      res.status(409).json({ error: 'No available places for this event' });
      return;
    }

    const ticket = db.tickets.create({ eventId, userId: req.user.sub });

    res.status(201).json({
      message: 'Ticket purchased successfully',
      ticket: {
        id: ticket.id,
        qrCode: ticket.qrCode,
        eventId: ticket.eventId,
        status: ticket.status,
        purchaseDate: ticket.purchaseDate,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'EVENT_SOLD_OUT') {
      res.status(409).json({ error: 'No available places for this event' });
      return;
    }
    if (error instanceof Error && error.message === 'EVENT_PAST') {
      res.status(409).json({ error: 'Cannot buy a ticket for a past event' });
      return;
    }
    if (error instanceof Error && error.message === 'EVENT_NOT_FOUND') {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    console.error('BuyTicket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /tickets
 * Liste des billets de l'utilisateur connecté
 */
export async function getMyTickets(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const tickets = db.tickets.findByUser(req.user.sub);

    // Enrichir les billets avec les infos de l'événement
    const enrichedTickets = tickets.map(ticket => {
      const event = db.events.findById(ticket.eventId);
      return {
        id: ticket.id,
        qrCode: ticket.qrCode,
        status: ticket.status,
        purchaseDate: ticket.purchaseDate,
        usedAt: ticket.usedAt,
        cancelledAt: ticket.cancelledAt,
        event: event ? {
          id: event.id,
          title: event.title,
          date: event.date,
          time: event.time,
          city: event.city,
          price: event.price,
          location: event.location,
        } : null,
      };
    });

    res.json({ tickets: enrichedTickets });
  } catch (error) {
    console.error('GetMyTickets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /tickets/:id
 * Détail d'un billet spécifique
 */
export async function getTicketById(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const ticket = db.tickets.findById(id!);

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    // Un utilisateur ne peut voir que ses propres billets (sauf admin)
    if (ticket.userId !== req.user.sub && req.user.role !== 'admin') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const event = db.events.findById(ticket.eventId);

    res.json({
      id: ticket.id,
      qrCode: ticket.qrCode,
      status: ticket.status,
      purchaseDate: ticket.purchaseDate,
      usedAt: ticket.usedAt,
      cancelledAt: ticket.cancelledAt,
      event: event ? {
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
        city: event.city,
        price: event.price,
        location: event.location,
        category: event.category,
      } : null,
    });
  } catch (error) {
    console.error('GetTicketById error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PATCH /tickets/:id/status
 * Modifier le statut d'un billet (admin uniquement)
 * Use case : marquer un billet comme "used" lors du scan QR
 */
export async function updateTicketStatus(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Seul l'admin peut modifier le statut d'un billet
    if (req.user.role !== 'admin') {
      res.status(403).json({ error: 'Only an administrator can update ticket status' });
      return;
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['valid', 'used', 'cancelled'].includes(status)) {
      res.status(400).json({ error: 'status must be one of: valid, used, cancelled' });
      return;
    }

    const ticket = db.tickets.findById(id!);

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    const updated = db.tickets.updateStatus(id!, status as TicketStatus);

    res.json({
      message: 'Ticket status updated',
      ticket: {
        id: updated.id,
        status: updated.status,
        usedAt: updated.usedAt,
        cancelledAt: updated.cancelledAt,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'TICKET_NOT_FOUND') {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }
    console.error('UpdateTicketStatus error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default {
  buyTicket,
  getMyTickets,
  getTicketById,
  updateTicketStatus,
};