import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [formData, setformData] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit() {
    if (formData.password !== formData.confirmPassword) {
      setError("mot de passe différent");
      return;
    } 
    const response = await fetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await response.json();
    console.log(data);
    if (response.ok) {
      localStorage.setItem("token", data.token);
      console.log("compte crée");
      navigate("/");
    } else {
      const message = "erreur lors de la création du compte";
      setError(message);
      console.log(message);
    }
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col w-80 gap-4 ">
          <p>register</p>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={(e) => setformData({ ...formData, name: e.target.value })}
            className="border-black border-2"
            placeholder="Indiquez votre nom d'utilisateur"
          />
          <input
            type="email"
            name="mail"
            value={formData.email}
            onChange={(e) =>
              setformData({ ...formData, email: e.target.value })
            }
            className="border-black border-2"
            placeholder="Indiquez votre email"
          />
          <input
            type="password"
            name="psswrd"
            value={formData.password}
            onChange={(e) =>
              setformData({ ...formData, password: e.target.value })
            }
            className="border-black border-2"
            placeholder="Indiquez votre mot de passe"
          />
          <input
            type="password"
            name="psswrdconfirm"
            value={formData.confirmPassword}
            onChange={(e) =>
              setformData({ ...formData, confirmPassword: e.target.value })
            }
            className="border-black border-2"
            placeholder="confirmer votre mot de passe"
          />
          <button onClick={handleSubmit} className="border-black border-2">
            crée un compte
          </button>
          {error && <p>{error}</p>}
        </div>
      </div>
    </>
  );
}
