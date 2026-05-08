import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface Stats {
  totalEvents: number;
  totalTicketsSold: number;
  validTickets: number;
  usedTickets: number;
  cancelledTickets: number;
  totalRevenue: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const token = localStorage.getItem("token");
      const response = await fetch("/events/organizer/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setError("Impossible de charger les statistiques");
        setLoading(false);
        return;
      }
      const data = await response.json();
      setStats(data);
      setLoading(false);
    }
    loadStats();
  }, []);

  if (loading) return <p className="p-6">Chargement...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;
  if (!stats) return null;

  return (
    <div className="max-w-xl mx-auto p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Dashboard organisateur</h1>

      <div className="flex gap-2">
        <Link to="/organizer/events" className="border-black border-2 px-4 py-2">Mes événements</Link>
        <Link to="/organizer/events/new" className="border-black border-2 px-4 py-2">Créer un événement</Link>
      </div>

      <div className="border-black border-2 p-4 flex flex-col gap-2">
        <p>Événements créés : <span className="font-bold">{stats.totalEvents}</span></p>
        <p>Billets vendus : <span className="font-bold">{stats.totalTicketsSold}</span></p>
        <p>Billets valides : <span className="font-bold">{stats.validTickets}</span></p>
        <p>Billets utilisés : <span className="font-bold">{stats.usedTickets}</span></p>
        <p>Billets annulés : <span className="font-bold">{stats.cancelledTickets}</span></p>
        <p>Chiffre d'affaires : <span className="font-bold">{stats.totalRevenue} €</span></p>
      </div>
    </div>
  );
}
