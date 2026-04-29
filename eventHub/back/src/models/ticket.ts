/**
 * Modèle Ticket — Billet de la billetterie EventHub
 */

export enum TicketStatus {
  VALID = 'valid',
  USED = 'used',
  CANCELLED = 'cancelled',
}

export interface Ticket {
  id: string;
  qrCode: string;           // Code unique pour le QR code
  eventId: string;          // Référence à l'Event
  userId: string;           // Acheteur
  status: TicketStatus;
  purchaseDate: Date;
  usedAt?: Date;            // Date d'utilisation (si applicable)
  cancelledAt?: Date;       // Date d'annulation (si applicable)
}

export interface CreateTicketDto {
  eventId: string;
  userId: string;
}

export interface TicketWithEvent extends Ticket {
  eventTitle: string;
  eventDate: string;
  eventCity: string;
  eventPrice: number;
}

export interface TicketStats {
  totalTickets: number;
  validTickets: number;
  usedTickets: number;
  cancelledTickets: number;
  totalRevenue: number; // Chiffre d'affaires total (somme des prix des billets vendus)
}