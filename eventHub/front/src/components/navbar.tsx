import { Link, useNavigate } from "react-router-dom";
import getRole from "../utils/auth";
import { useState, useEffect } from "react";

export default function Navbar() {
    const [role, setRole] = useState(null)

useEffect(() => {
  getRole().then(r => setRole(r))
}, [])
    const navigate = useNavigate();
    const handleLogoClick = () => {
    navigate("/");
  };
  return (
    <>
      <nav className="p-4 flex gap-5 text-amber-100 bg-blue-900 text-3xl">
          <img src="./favicon.svg" alt="icon" onClick={handleLogoClick} />
          <div className="flex gap-5 ml-auto">
          {role && <Link to="/ticket">ticket</Link>}
          {role && <Link to="/profile ">profile</Link>}

          {!role && <Link to="/login">login</Link>}
          {!role && <Link to="/register">register</Link>}
          
          </div>
      </nav>
    </>
  );
}
