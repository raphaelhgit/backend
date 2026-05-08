import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CATEGORIES = ["Concert", "Conférence", "Festival", "Sport", "Théâtre", "Autre"];

interface EventForm {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  city: string;
  price: string;
  totalPlaces: string;
  category: string;
  image: string;
}

const emptyForm: EventForm = {
  title: "",
  description: "",
  date: "",
  time: "",
  location: "",
  city: "",
  price: "",
  totalPlaces: "",
  category: "",
  image: "",
};

export default function CreateEvent() {
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [errors, setErrors] = useState<Partial<EventForm>>({});
  const [apiError, setApiError] = useState("");
  const [preview, setPreview] = useState(false);
  const navigate = useNavigate();

  function set(field: keyof EventForm) {
    return (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function validate(): boolean {
    const e: Partial<EventForm> = {};
    if (!form.title.trim()) e.title = "Titre requis";
    if (!form.description.trim()) e.description = "Description requise";
    if (!form.date) e.date = "Date requise";
    if (!form.time) e.time = "Heure requise";
    if (!form.location.trim()) e.location = "Lieu requis";
    if (!form.city.trim()) e.city = "Ville requise";
    if (form.price === "" || isNaN(Number(form.price)) || Number(form.price) < 0)
      e.price = "Prix invalide (≥ 0)";
    if (!form.totalPlaces || isNaN(Number(form.totalPlaces)) || Number(form.totalPlaces) <= 0)
      e.totalPlaces = "Nombre de places invalide (> 0)";
    if (!form.category) e.category = "Catégorie requise";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setApiError("");
    const token = localStorage.getItem("token");
    const response = await fetch("/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        date: form.date,
        time: form.time,
        location: form.location,
        city: form.city,
        price: Number(form.price),
        totalPlaces: Number(form.totalPlaces),
        category: form.category,
        image: form.image || undefined,
      }),
    });
    if (response.ok) {
      navigate("/organizer/events");
    } else {
      const data = await response.json();
      setApiError(data.message ?? "Erreur lors de la création");
    }
  }

  const inputCls = "border-black border-2 p-2 w-full";
  const errCls = "text-red-500 text-sm";

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Créer un événement</h1>
        <button onClick={() => setPreview(!preview)} className="border-black border-2 px-4 py-2">
          {preview ? "Masquer l'aperçu" : "Prévisualiser"}
        </button>
      </div>

      <div className={`grid gap-8 ${preview ? "grid-cols-2" : "grid-cols-1"}`}>
        {/* FORMULAIRE */}
        <div className="flex flex-col gap-3">
          <div>
            <input type="text" placeholder="Titre *" value={form.title} onChange={set("title")} className={inputCls} />
            {errors.title && <p className={errCls}>{errors.title}</p>}
          </div>

          <div>
            <textarea placeholder="Description *" value={form.description} onChange={set("description")} rows={4} className={inputCls} />
            {errors.description && <p className={errCls}>{errors.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm">Date *</label>
              <input type="date" value={form.date} onChange={set("date")} className={inputCls} />
              {errors.date && <p className={errCls}>{errors.date}</p>}
            </div>
            <div>
              <label className="text-sm">Heure *</label>
              <input type="time" value={form.time} onChange={set("time")} className={inputCls} />
              {errors.time && <p className={errCls}>{errors.time}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <input type="text" placeholder="Lieu *" value={form.location} onChange={set("location")} className={inputCls} />
              {errors.location && <p className={errCls}>{errors.location}</p>}
            </div>
            <div>
              <input type="text" placeholder="Ville *" value={form.city} onChange={set("city")} className={inputCls} />
              {errors.city && <p className={errCls}>{errors.city}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <input type="number" placeholder="Prix (€) *" value={form.price} onChange={set("price")} min={0} step={0.01} className={inputCls} />
              {errors.price && <p className={errCls}>{errors.price}</p>}
            </div>
            <div>
              <input type="number" placeholder="Nombre de places *" value={form.totalPlaces} onChange={set("totalPlaces")} min={1} className={inputCls} />
              {errors.totalPlaces && <p className={errCls}>{errors.totalPlaces}</p>}
            </div>
          </div>

          <div>
            <select value={form.category} onChange={set("category")} className={inputCls}>
              <option value="">-- Catégorie * --</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <p className={errCls}>{errors.category}</p>}
          </div>

          <input type="url" placeholder="URL de l'image (optionnel)" value={form.image} onChange={set("image")} className={inputCls} />

          {apiError && <p className={errCls}>{apiError}</p>}

          <div className="flex gap-3">
            <button onClick={handleSubmit} className="border-black border-2 px-6 py-2 font-bold">Créer l'événement</button>
            <button onClick={() => navigate("/organizer/events")} className="border-black border-2 px-6 py-2">Annuler</button>
          </div>
        </div>

        {/* PRÉVISUALISATION */}
        {preview && (
          <div className="border-black border-2 p-4 flex flex-col gap-2 self-start">
            <h2 className="font-bold border-b pb-2">Aperçu</h2>
            {form.image && <img src={form.image} alt="couverture" className="w-full h-40 object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />}
            <h3 className="font-bold text-lg">{form.title || "Titre de l'événement"}</h3>
            <p className="text-sm">{form.category || "Catégorie"}{form.city ? ` · ${form.city}` : ""}</p>
            <p className="text-sm">{form.date || "Date"}{form.time ? ` à ${form.time}` : ""}{form.location ? ` · ${form.location}` : ""}</p>
            <p className="text-sm">{form.description || "Description..."}</p>
            <p className="font-bold">{form.price !== "" ? `${form.price} €` : "Prix"} · {form.totalPlaces ? `${form.totalPlaces} places` : "Places"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
