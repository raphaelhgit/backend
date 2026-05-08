import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  useEffect(() => {
    async function loadProfile() {
      const token = localStorage.getItem("token");
      const response = await fetch("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setError("Impossible de charger le profil");
        setLoading(false);
        return;
      }
      const data = await response.json();
      setUser(data);
      setNewName(data.name);
      setLoading(false);
    }
    loadProfile();
  }, []);

  async function handleUpdateName() {
    if (!newName.trim()) {
      setError("Le nom ne peut pas être vide");
      return;
    }
    setError("");
    setSuccess("");
    const token = localStorage.getItem("token");
    const response = await fetch("/auth/me", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const data = await response.json();
    if (response.ok) {
      setUser((u) => (u ? { ...u, name: data.name } : u));
      setSuccess("Nom mis à jour avec succès");
    } else {
      setError(data.error ?? "Erreur lors de la mise à jour");
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    auth?.setRole(null);
    navigate("/");
  }

  if (loading) return <p className="p-6">Chargement...</p>;
  if (!user) return <p className="p-6 text-red-500">{error}</p>;

  return (
    <div className="max-w-xl mx-auto p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Mon profil</h1>

      <div className="border-black border-2 p-4 flex flex-col gap-2">
        <p><span className="font-bold">Nom :</span> {user.name}</p>
        <p><span className="font-bold">Email :</span> {user.email}</p>
        <p><span className="font-bold">Rôle :</span> {user.role}</p>
        <p><span className="font-bold">Membre depuis :</span> {new Date(user.createdAt).toLocaleDateString("fr-FR")}</p>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-bold">Modifier le nom</h2>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nouveau nom"
          className="border-black border-2 p-2"
        />
        <button onClick={handleUpdateName} className="border-black border-2 px-4 py-2">
          Enregistrer
        </button>
        {error && <p className="text-red-500">{error}</p>}
        {success && <p className="text-green-600">{success}</p>}
      </div>

      <button onClick={handleLogout} className="border-black border-2 px-4 py-2 self-start">
        Déconnexion
      </button>
    </div>
  );
}
