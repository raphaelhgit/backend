import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
    const navigate = useNavigate();
    const handleLogoClick = () => {
    navigate("/");
  };
  return (
    <>
      <nav className="p-4 flex gap-5 text-amber-100 bg-blue-900 text-3xl">
          <img src="./favicon.svg" alt="icon" onClick={handleLogoClick} />
          <div className="flex gap-5 ml-auto">
          <Link to="/ticket">ticket</Link>
          <Link to="/login">login</Link>
          <Link to="/register">register</Link>
          <Link to="/profile">profile</Link>
          </div>
      </nav>
    </>
  );
}
