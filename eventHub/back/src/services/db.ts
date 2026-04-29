/**
 * Couche d'acces aux donnees — EventHub (SQLite)
 *
 * Ce fichier remplace le store en memoire par des operations SQLite.
 * Chaque fonction correspond a une requete SQL preparee.
 */

import sqliteDb from './database.js';
import { User, CreateUserDto, UserRole } from '../models/user.js';
import { Event, CreateEventDto, UpdateEventDto, EventCategory, EventFilters } from '../models/event.js';
import { Ticket, CreateTicketDto, TicketStatus, TicketStats } from '../models/ticket.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

function now(): string {
  return new Date().toISOString();
}

async function createUser(dto: CreateUserDto): Promise<User> {
  const existing = sqliteDb.prepare('SELECT id FROM users WHERE email = ?').get(dto.email);
  if (existing) throw new Error('EMAIL_ALREADY_EXISTS');

  const id = uuidv4();
  const passwordHash = await bcrypt.hash(dto.password, 10);
  const createdAt = now();

  sqliteDb.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, dto.email, passwordHash, dto.name, dto.role ?? UserRole.USER, createdAt, createdAt);

  return { id, email: dto.email, name: dto.name, role: dto.role ?? UserRole.USER, createdAt: new Date(createdAt), updatedAt: new Date(createdAt) } as User;
}

async function findUserByEmail(email: string): Promise<User | undefined> {
  const row = sqliteDb.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!row) return undefined;
  return { id: row.id, email: row.email, passwordHash: row.password_hash, name: row.name, role: row.role as UserRole, createdAt: new Date(row.created_at), updatedAt: new Date(row.updated_at) };
}

async function findUserById(id: string): Promise<User | undefined> {
  const row = sqliteDb.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  if (!row) return undefined;
  return { id: row.id, email: row.email, passwordHash: row.password_hash, name: row.name, role: row.role as UserRole, createdAt: new Date(row.created_at), updatedAt: new Date(row.updated_at) };
}

async function verifyPassword(user: User, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.passwordHash);
}

async function updateUser(id: string, dto: { name: string }): Promise<User> {
  const updatedAt = now();
  sqliteDb.prepare('UPDATE users SET name = ?, updated_at = ? WHERE id = ?').run(dto.name, updatedAt, id);
  const user = await findUserById(id);
  if (!user) throw new Error('USER_NOT_FOUND');
  return user;
}

function getAllUsers(): User[] {
  const rows = sqliteDb.prepare('SELECT * FROM users').all() as any[];
  return rows.map(row => ({ id: row.id, email: row.email, passwordHash: row.password_hash, name: row.name, role: row.role, createdAt: new Date(row.created_at), updatedAt: new Date(row.updated_at) }));
}

function createEvent(dto: CreateEventDto, organizerId: string): Event {
  const id = uuidv4();
  const createdAt = now();
  sqliteDb.prepare(`
    INSERT INTO events (id, title, description, date, time, location, city, price, total_places, available_places, category, image, organizer_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, dto.title, dto.description, dto.date, dto.time, dto.location, dto.city, dto.price, dto.totalPlaces, dto.totalPlaces, dto.category, dto.image ?? null, organizerId, createdAt, createdAt);
  return findEventById(id)!;
}

function findEventById(id: string): Event | undefined {
  const row = sqliteDb.prepare('SELECT * FROM events WHERE id = ?').get(id) as any;
  if (!row) return undefined;
  return mapRowToEvent(row);
}

function findEvents(filters?: EventFilters): Event[] {
  let sql = 'SELECT * FROM events WHERE 1=1';
  const params: (string | number)[] = [];
  if (filters?.category) { sql += ' AND category = ?'; params.push(filters.category); }
  if (filters?.city) { sql += ' AND LOWER(city) LIKE LOWER(?)'; params.push(`%${filters.city}%`); }
  if (filters?.maxPrice !== undefined) { sql += ' AND price <= ?'; params.push(filters.maxPrice); }
  if (filters?.minPrice !== undefined) { sql += ' AND price >= ?'; params.push(filters.minPrice); }
  if (filters?.upcomingOnly) { sql += " AND date >= ?"; params.push(new Date().toISOString().split('T')[0] ?? ''); }
  sql += ' ORDER BY date ASC';
  const rows = sqliteDb.prepare(sql).all(...params) as any[];
  return rows.map(mapRowToEvent);
}

function findEventsByOrganizer(organizerId: string): Event[] {
  const rows = sqliteDb.prepare('SELECT * FROM events WHERE organizer_id = ? ORDER BY date ASC').all(organizerId) as any[];
  return rows.map(mapRowToEvent);
}

function updateEvent(id: string, dto: UpdateEventDto): Event {
  const event = findEventById(id);
  if (!event) throw new Error('EVENT_NOT_FOUND');
  const updates: string[] = [];
  const params: (string | number | null)[] = [];
  if (dto.title !== undefined) { updates.push('title = ?'); params.push(dto.title); }
  if (dto.description !== undefined) { updates.push('description = ?'); params.push(dto.description); }
  if (dto.date !== undefined) { updates.push('date = ?'); params.push(dto.date); }
  if (dto.time !== undefined) { updates.push('time = ?'); params.push(dto.time); }
  if (dto.location !== undefined) { updates.push('location = ?'); params.push(dto.location); }
  if (dto.city !== undefined) { updates.push('city = ?'); params.push(dto.city); }
  if (dto.price !== undefined) { updates.push('price = ?'); params.push(dto.price); }
  if (dto.category !== undefined) { updates.push('category = ?'); params.push(dto.category); }
  if (dto.image !== undefined) { updates.push('image = ?'); params.push(dto.image ?? null); }
  if (dto.totalPlaces !== undefined) {
    const sold = event.totalPlaces - event.availablePlaces;
    updates.push('total_places = ?'); params.push(dto.totalPlaces);
    updates.push('available_places = ?'); params.push(Math.max(0, dto.totalPlaces - sold));
  }
  if (updates.length === 0) return event;
  updates.push('updated_at = ?'); params.push(now()); params.push(id);
  sqliteDb.prepare(`UPDATE events SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  return findEventById(id)!;
}

function deleteEvent(id: string): boolean {
  const event = findEventById(id);
  if (!event) return false;
  const sold = sqliteDb.prepare('SELECT COUNT(*) as count FROM tickets WHERE event_id = ? AND status != ?').get(id, TicketStatus.CANCELLED) as any;
  if (sold && sold.count > 0) throw new Error('EVENT_HAS_SOLD_TICKETS');
  sqliteDb.prepare('DELETE FROM tickets WHERE event_id = ?').run(id);
  const result = sqliteDb.prepare('DELETE FROM events WHERE id = ?').run(id);
  return result.changes > 0;
}

function createTicket(dto: CreateTicketDto): Ticket {
  const event = findEventById(dto.eventId);
  if (!event) throw new Error('EVENT_NOT_FOUND');
  if (event.availablePlaces <= 0) throw new Error('EVENT_SOLD_OUT');
  const today = new Date().toISOString().split('T')[0] ?? '';
  if (event.date < today) throw new Error('EVENT_PAST');
  const id = uuidv4();
  const qrCode = uuidv4();
  const purchaseDate = now();
  sqliteDb.prepare(`INSERT INTO tickets (id, qr_code, event_id, user_id, status, purchase_date) VALUES (?, ?, ?, ?, ?, ?)`).run(id, qrCode, dto.eventId, dto.userId, TicketStatus.VALID, purchaseDate);
  sqliteDb.prepare('UPDATE events SET available_places = available_places - 1 WHERE id = ?').run(dto.eventId);
  return { id, qrCode, eventId: dto.eventId, userId: dto.userId, status: TicketStatus.VALID, purchaseDate: new Date(purchaseDate) };
}

function findTicketById(id: string): Ticket | undefined {
  const row = sqliteDb.prepare('SELECT * FROM tickets WHERE id = ?').get(id) as any;
  if (!row) return undefined;
  return mapRowToTicket(row);
}

function findTicketsByUser(userId: string): Ticket[] {
  const rows = sqliteDb.prepare('SELECT * FROM tickets WHERE user_id = ? ORDER BY purchase_date DESC').all(userId) as any[];
  return rows.map(mapRowToTicket);
}

function findTicketsByEvent(eventId: string): Ticket[] {
  const rows = sqliteDb.prepare('SELECT * FROM tickets WHERE event_id = ?').all(eventId) as any[];
  return rows.map(mapRowToTicket);
}

function updateTicketStatus(id: string, status: TicketStatus): Ticket {
  const ticket = findTicketById(id);
  if (!ticket) throw new Error('TICKET_NOT_FOUND');
  const updates: string[] = ['status = ?'];
  const params: (string | null)[] = [status];
  if (status === TicketStatus.USED) { updates.push('used_at = ?'); params.push(now()); }
  else if (status === TicketStatus.CANCELLED) { updates.push('cancelled_at = ?'); params.push(now()); }
  params.push(id);
  sqliteDb.prepare(`UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  if (status === TicketStatus.CANCELLED) sqliteDb.prepare('UPDATE events SET available_places = available_places + 1 WHERE id = ?').run(ticket.eventId);
  return findTicketById(id)!;
}

function getTicketStatsByOrganizer(organizerId: string): TicketStats {
  const rows = sqliteDb.prepare(`SELECT t.* FROM tickets t JOIN events e ON t.event_id = e.id WHERE e.organizer_id = ?`).all(organizerId) as any[];
  let totalRevenue = 0;
  for (const row of rows) {
    const event = findEventById(row.event_id);
    if (event && row.status !== TicketStatus.CANCELLED) totalRevenue += event.price;
  }
  return { totalTickets: rows.length, validTickets: rows.filter(r => r.status === TicketStatus.VALID).length, usedTickets: rows.filter(r => r.status === TicketStatus.USED).length, cancelledTickets: rows.filter(r => r.status === TicketStatus.CANCELLED).length, totalRevenue };
}

function mapRowToEvent(row: any): Event {
  return { id: row.id, title: row.title, description: row.description, date: row.date, time: row.time, location: row.location, city: row.city, price: row.price, totalPlaces: row.total_places, availablePlaces: row.available_places, category: row.category as EventCategory, image: row.image ?? undefined, organizerId: row.organizer_id, createdAt: new Date(row.created_at), updatedAt: new Date(row.updated_at) };
}

function mapRowToTicket(row: any): Ticket {
  return { id: row.id, qrCode: row.qr_code, eventId: row.event_id, userId: row.user_id, status: row.status as TicketStatus, purchaseDate: new Date(row.purchase_date), usedAt: row.used_at ? new Date(row.used_at) : undefined, cancelledAt: row.cancelled_at ? new Date(row.cancelled_at) : undefined };
}

export const db = {
  users: { create: createUser, findByEmail: findUserByEmail, findById: findUserById, verifyPassword, update: updateUser, getAll: getAllUsers },
  events: { create: createEvent, findById: findEventById, findAll: findEvents, findByOrganizer: findEventsByOrganizer, update: updateEvent, delete: deleteEvent },
  tickets: { create: createTicket, findById: findTicketById, findByUser: findTicketsByUser, findByEvent: findTicketsByEvent, updateStatus: updateTicketStatus, getStatsByOrganizer: getTicketStatsByOrganizer },
};

export default db;