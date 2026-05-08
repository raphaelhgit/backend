import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  city: string;
  category: string;
  price: number;
  totalPlaces: number;
  availablePlaces: number;
  image?: string;
}

export default function MyEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function loadEvents() {
    const token = localStorage.getItem("token");
    const response = await fetch("/events/organizer/my-events", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      setError("Impossible de charger les événements");
      setLoading(false);
      return;
    }
    const data = await response.json();
    setEvents(data.events);
    setLoading(false);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cet événement ?")) return;
    const token = localStorage.getItem("token");
    const response = await fetch(`/events/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } else if (response.status === 409) {
      alert("Impossible de supprimer : des billets ont été vendus pour cet événement.");
    } else {
      alert("Erreur lors de la suppression.");
    }
  }

  if (loading) return <p className="p-6">Chargement...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mes événements</h1>
        <button onClick={() => navigate("/organizer/events/new")} className="border-black border-2 px-4 py-2">
          Créer un événement
        </button>
      </div>

      {events.length === 0 && <p>Aucun événement créé.</p>}

      <div className="flex flex-col gap-4">
        {events.map((event) => {
          const ticketsSold = event.totalPlaces - event.availablePlaces;
          return (
            <div key={event.id} className="border-black border-2 p-4 flex gap-4">
              {event.image && <img src={event.image} alt={event.title} className="w-28 h-20 object-cover" />}
              <div className="flex flex-col gap-1 flex-1">
                <h2 className="font-bold text-lg">{event.title}</h2>
                <p className="text-sm">{event.description}</p>
                <p className="text-sm">{event.date} à {event.time} · {event.location} · {event.city} · {event.category}</p>
                <p className="text-sm">Prix : {event.price} €</p>
                <p className="text-sm">Billets vendus : {ticketsSold} / {event.totalPlaces}</p>
                <div className="flex gap-2 mt-1">
                  <Link to={`/organizer/events/${event.id}/edit`} className="border-black border-2 px-3 py-1 text-sm">
                    Modifier
                  </Link>
                  <button onClick={() => handleDelete(event.id)} className="border-black border-2 px-3 py-1 text-sm">
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
