/**
 * Modèle Event — Événement de la billetterie EventHub
 */

export enum EventCategory {
  CONCERT = 'Concert',
  CONFERENCE = 'Conférence',
  FESTIVAL = 'Festival',
  SPORT = 'Sport',
  THEATER = 'Théâtre',
  OTHER = 'Autre',
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;       // ISO date string (YYYY-MM-DD)
  time: string;       // HH:mm
  location: string;   // Salle / adresse
  city: string;
  price: number;       // Prix en euros
  totalPlaces: number; // Nombre total de places
  availablePlaces: number; // Places encore disponibles
  category: EventCategory;
  image?: string;     // URL optionnelle
  organizerId: string; // ID de l'organisateur (User)
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEventDto {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  city: string;
  price: number;
  totalPlaces: number;
  category: EventCategory;
  image?: string;
}

export interface UpdateEventDto {
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  location?: string;
  city?: string;
  price?: number;
  totalPlaces?: number;
  category?: EventCategory;
  image?: string;
}

export interface EventFilters {
  category?: EventCategory;
  city?: string;
  maxPrice?: number;
  minPrice?: number;
  upcomingOnly?: boolean; // Ne montrer que les événements à venir
}

/**
 * Réponse paginée pour la liste des événements.
 */
export interface EventListResponse {
  events: Event[];
  total: number;
  page: number;
  limit: number;
}