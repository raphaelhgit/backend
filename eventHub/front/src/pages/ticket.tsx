import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

type TicketStatus = "valid" | "used" | "cancelled";

interface Ticket {
  id: string;
  qrCode: string;
  status: TicketStatus;
  purchaseDate: string;
  usedAt: string | null;
  cancelledAt: string | null;
  event: {
    id: string;
    title: string;
    date: string;
    time: string;
    city: string;
    location: string;
    price: number;
  } | null;
}

const STATUS_LABEL: Record<TicketStatus, string> = {
  valid: "Valide",
  used: "Utilisé",
  cancelled: "Annulé",
};

const FILTERS: { value: "all" | TicketStatus; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "valid", label: "Valides" },
  { value: "used", label: "Utilisés" },
  { value: "cancelled", label: "Annulés" },
];

export default function MyTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState<"all" | TicketStatus>("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [openQr, setOpenQr] = useState<string | null>(null);

  useEffect(() => {
    async function loadTickets() {
      const token = localStorage.getItem("token");
      const response = await fetch("/tickets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setError("Impossible de charger les billets");
        setLoading(false);
        return;
      }
      const data = await response.json();
      setTickets(data.tickets);
      setLoading(false);
    }
    loadTickets();
  }, []);

  const filtered = filter === "all" ? tickets : tickets.filter((t) => t.status === filter);

  if (loading) return <p className="p-6">Chargement...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Mes billets</h1>

      <div className="flex gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            disabled={filter === f.value}
            className="border-black border-2 px-3 py-1 disabled:opacity-50"
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <p>Aucun billet trouvé.</p>}

      <div className="flex flex-col gap-4">
        {filtered.map((ticket) => (
          <div key={ticket.id} className="border-black border-2 p-4 flex flex-col gap-2">
            <p className="font-bold">Statut : {STATUS_LABEL[ticket.status]}</p>

            {ticket.event ? (
              <>
                <p className="text-lg font-bold">{ticket.event.title}</p>
                <p className="text-sm">{ticket.event.date} à {ticket.event.time} · {ticket.event.location} · {ticket.event.city}</p>
                <p>{ticket.event.price} €</p>
              </>
            ) : (
              <p className="text-sm">Événement supprimé</p>
            )}

            <p className="text-sm">Acheté le : {new Date(ticket.purchaseDate).toLocaleDateString("fr-FR")}</p>
            {ticket.usedAt && <p className="text-sm">Utilisé le : {new Date(ticket.usedAt).toLocaleDateString("fr-FR")}</p>}
            {ticket.cancelledAt && <p className="text-sm">Annulé le : {new Date(ticket.cancelledAt).toLocaleDateString("fr-FR")}</p>}

            <button
              onClick={() => setOpenQr(openQr === ticket.id ? null : ticket.id)}
              className="border-black border-2 px-3 py-1 self-start"
            >
              {openQr === ticket.id ? "Masquer le QR code" : "Afficher le QR code"}
            </button>

            {openQr === ticket.id && (
              <div className="flex flex-col gap-1">
                <QRCodeSVG value={ticket.qrCode} size={180} />
                <p className="text-xs">{ticket.qrCode}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
