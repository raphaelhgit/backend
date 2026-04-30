import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [formData, setformData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit() {
    const response = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await response.json();
    if (response.ok) {
      localStorage.setItem("token", data.token);
      console.log("connecté !");
      navigate("/");
    } else {
      const message = "Email ou mot de passe incorrect";
      setError(message);
      console.log(message);
    }
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col w-80 gap-4 ">
          <p>login</p>
          <input
            type="email"
            name="mail"
            value={formData.email}
            onChange={(e) =>
              setformData({ ...formData, email: e.target.value })
            }
            className="border-black border-2"
          />
          <input
            type="password"
            name="psswrd"
            value={formData.password}
            onChange={(e) =>
              setformData({ ...formData, password: e.target.value })
            }
            className="border-black border-2"
          />
          <button onClick={handleSubmit} className="border-black border-2">
            se connecter
          </button>
          {error && <p>{error}</p>}
        </div>
      </div>
    </>
  );
}
