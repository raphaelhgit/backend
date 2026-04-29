/**
 * Modèle User — Utilisateur de la plateforme EventHub
 *
 * Ce fichier définit les TypeScript interfaces (types) pour les données
 * manipulées par l'application. TypeScript permet de typer les données
 * et de détecter les erreurs à la compilation (avant l'exécution).
 *
 * Avantage du typage :
 * - Autocomplétion dans l'IDE
 * - Erreurs détectées au build, pas à l'exécution
 * - Documentation auto du code
 */

/**
 * Énumération des rôles utilisateurs.
 * Utiliser un typeunion plutôt qu'une string brute permet
 * à TypeScript de détecter les erreurs si on tape mal un rôle.
 */
export enum UserRole {
  USER = 'user',
  ORGANIZER = 'organizer',
  ADMIN = 'admin',
}

/**
 * Interface représentant un utilisateur dans le système.
 * Utilisée pour typer les objects user dans tout le code.
 */
export interface User {
  id: string;
  email: string;
  /** Le mot de passe est stocké en hash (bcrypt), jamais en clair */
  passwordHash: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO (Data Transfer Object) pour la création d'un utilisateur.
 * On évite deTyper le passwordHash ici car le mot de passe
 * arrive en clair et sera hashé avant stockage.
 */
export interface CreateUserDto {
  email: string;
  password: string; // mot de passe en clair (hashé avant storage)
  name: string;
  role?: UserRole; // optionnel, défaut = USER
}

/**
 * DTO pour la mise à jour du profil utilisateur.
 * Seul le nom peut être modifié (règles métier).
 */
export interface UpdateUserDto {
  name: string;
}

/**
 * DTO pour la connexion.
 */
export interface LoginDto {
  email: string;
  password: string;
}

/**
 * Payload JWT — données encodées dans le token.
 * Contient les infos nécessaires pour identifier l'utilisateur
 * sans avoir à interroger la base de données à chaque requête.
 */
export interface JwtPayload {
  sub: string;      // user id
  email: string;
  role: UserRole;
  iat?: number;     // issued at (ajouté automatiquement par JWT)
  exp?: number;     // expiration (ajouté automatiquement par JWT)
}

/**
 * Réponse d'authentification — ce qu'on retourne au client après login.
 */
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}