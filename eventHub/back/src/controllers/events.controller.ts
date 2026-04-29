/**
 * Contrôleur d'événements
 */

import { Request, Response } from 'express';
import db from '../services/db.js';
import { EventCategory, EventFilters } from '../models/event.js';

/**
 * GET /events
 * Liste tous les événements (avec filtres optionnels)
 */
export async function getEvents(req: Request, res: Response): Promise<void> {
  try {
    const { category, city, maxPrice, minPrice, upcoming } = req.query;

    const filters: EventFilters = {};

    if (category && Object.values(EventCategory).includes(category as EventCategory)) {
      filters.category = category as EventCategory;
    }

    if (city) {
      filters.city = String(city);
    }

    if (maxPrice) {
      filters.maxPrice = parseFloat(String(maxPrice));
      if (isNaN(filters.maxPrice) || filters.maxPrice < 0) {
        res.status(400).json({ error: 'maxPrice must be a positive number' });
        return;
      }
    }

    if (minPrice) {
      filters.minPrice = parseFloat(String(minPrice));
      if (isNaN(filters.minPrice) || filters.minPrice < 0) {
        res.status(400).json({ error: 'minPrice must be a positive number' });
        return;
      }
    }

    if (upcoming === 'true') {
      filters.upcomingOnly = true;
    }

    const events = db.events.findAll(filters);

    res.json({
      events,
      total: events.length,
    });
  } catch (error) {
    console.error('GetEvents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /events/:id
 * Détail d'un événement
 */
export async function getEventById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const event = db.events.findById(id!);

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    res.json(event);
  } catch (error) {
    console.error('GetEventById error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /events
 * Créer un nouvel événement (organisateurs uniquement)
 */
export async function createEvent(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const {
      title,
      description,
      date,
      time,
      location,
      city,
      price,
      totalPlaces,
      category,
      image,
    } = req.body;

    // Validation des champs obligatoires
    if (!title || !description || !date || !time || !location || !city) {
      res.status(400).json({
        error: 'title, description, date, time, location and city are required'
      });
      return;
    }

    if (price === undefined || totalPlaces === undefined || !category) {
      res.status(400).json({
        error: 'price, totalPlaces and category are required'
      });
      return;
    }

    // Validation du prix et des places
    if (price < 0) {
      res.status(400).json({ error: 'price must be positive' });
      return;
    }

    if (totalPlaces <= 0) {
      res.status(400).json({ error: 'totalPlaces must be greater than 0' });
      return;
    }

    if (!Object.values(EventCategory).includes(category)) {
      res.status(400).json({
        error: `category must be one of: ${Object.values(EventCategory).join(', ')}`
      });
      return;
    }

    const event = db.events.create(
      { title, description, date, time, location, city, price, totalPlaces, category, image },
      req.user.sub
    );

    res.status(201).json(event);
  } catch (error) {
    console.error('CreateEvent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PUT /events/:id
 * Modifier un événement (organisateurs — proprietaire uniquement)
 */
export async function updateEvent(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const event = db.events.findById(id!);

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    // Vérification de propriété
    if (event.organizerId !== req.user.sub && req.user.role !== 'admin') {
      res.status(403).json({ error: 'You can only update your own events' });
      return;
    }

    // Validation de la catégorie si fournie
    if (req.body.category && !Object.values(EventCategory).includes(req.body.category)) {
      res.status(400).json({
        error: `category must be one of: ${Object.values(EventCategory).join(', ')}`
      });
      return;
    }

    // Validation du prix si fourni
    if (req.body.price !== undefined && req.body.price < 0) {
      res.status(400).json({ error: 'price must be positive' });
      return;
    }

    const updated = db.events.update(id!, req.body);

    res.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === 'EVENT_NOT_FOUND') {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    console.error('UpdateEvent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /events/:id
 * Supprimer un événement (propriétaire uniquement)
 * Un événement avec des billets vendus ne peut pas être supprimé
 */
export async function deleteEvent(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const event = db.events.findById(id!);

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    // Vérification de propriété
    if (event.organizerId !== req.user.sub && req.user.role !== 'admin') {
      res.status(403).json({ error: 'You can only delete your own events' });
      return;
    }

    db.events.delete(id!);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.message === 'EVENT_NOT_FOUND') {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    if (error instanceof Error && error.message === 'EVENT_HAS_SOLD_TICKETS') {
      res.status(409).json({
        error: 'Cannot delete an event with sold tickets. Cancel the event instead.'
      });
      return;
    }
    console.error('DeleteEvent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /organizer/events
 * Liste des événements de l'organisateur connecté
 */
export async function getMyEvents(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const events = db.events.findByOrganizer(req.user.sub);

    res.json({ events });
  } catch (error) {
    console.error('GetMyEvents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /organizer/stats
 * Statistiques de l'organisateur (billets vendus, CA)
 */
export async function getOrganizerStats(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const events = db.events.findByOrganizer(req.user.sub);
    const stats = db.tickets.getStatsByOrganizer(req.user.sub);

    res.json({
      totalEvents: events.length,
      totalTicketsSold: stats.totalTickets,
      validTickets: stats.validTickets,
      usedTickets: stats.usedTickets,
      cancelledTickets: stats.cancelledTickets,
      totalRevenue: stats.totalRevenue,
    });
  } catch (error) {
    console.error('GetOrganizerStats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getMyEvents,
  getOrganizerStats,
};