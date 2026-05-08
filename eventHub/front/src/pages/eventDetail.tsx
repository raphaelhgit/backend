import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  city: string;
  price: number;
  totalPlaces: number;
  availablePlaces: number;
  category: string;
  image?: string;
  organizerId: string;
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [buyLoading, setBuyLoading] = useState(false);
  const [buySuccess, setBuySuccess] = useState(false);
  const [buyError, setBuyError] = useState("");
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  useEffect(() => {
    async function loadEvent() {
      const response = await fetch(`/events/${id}`);
      if (!response.ok) {
        setError("Événement introuvable");
        setLoading(false);
        return;
      }
      const data = await response.json();
      setEvent(data);
      setLoading(false);
    }
    loadEvent();
  }, [id]);

  async function handleBuy() {
    if (!auth?.role) {
      navigate("/login");
      return;
    }
    setBuyLoading(true);
    setBuyError("");
    const token = localStorage.getItem("token");
    const response = await fetch("/tickets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ eventId: id }),
    });
    setBuyLoading(false);
    if (response.ok) {
      setBuySuccess(true);
      setEvent((e) => e ? { ...e, availablePlaces: e.availablePlaces - 1 } : e);
    } else {
      const data = await response.json();
      if (response.status === 409) {
        setBuyError(
          data.error === "No available places for this event"
            ? "Plus de places disponibles"
            : "Impossible d'acheter un billet pour un événement passé"
        );
      } else {
        setBuyError(data.error ?? "Erreur lors de l'achat");
      }
    }
  }

  if (loading) return <p className="p-6">Chargement...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;
  if (!event) return null;

  const soldOut = event.availablePlaces <= 0;

  return (
    <div className="max-w-3xl mx-auto p-6 flex flex-col gap-4">
      {event.image && <img src={event.image} alt={event.title} className="w-full h-64 object-cover" />}

      <h1 className="text-2xl font-bold">{event.title}</h1>
      <p className="text-sm">{event.category} · {event.city}</p>
      <p className="text-sm">{event.date} à {event.time} · {event.location}</p>
      <p>{event.description}</p>

      <div className="border-black border-2 p-4 flex flex-col gap-2">
        <p className="font-bold text-lg">Prix : {event.price} €</p>
        <p>Places disponibles : {event.availablePlaces} / {event.totalPlaces}</p>

        {buySuccess ? (
          <p>✅ Billet acheté ! Retrouvez-le dans <a href="/tickets" className="underline">Mes billets</a>.</p>
        ) : (
          <>
            <button
              onClick={handleBuy}
              disabled={soldOut || buyLoading}
              className="border-black border-2 px-4 py-2 disabled:opacity-50"
            >
              {soldOut ? "Complet" : buyLoading ? "Achat en cours..." : "Acheter un billet"}
            </button>
            {!auth?.role && <p className="text-sm">Vous devez être connecté pour acheter un billet.</p>}
            {buyError && <p className="text-red-500">{buyError}</p>}
          </>
        )}
      </div>
    </div>
  );
}
