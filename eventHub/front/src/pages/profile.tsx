import { useNavigate } from "react-router-dom";

export default function Profile() {
    const navigate = useNavigate();
    async function deco() {
          localStorage.removeItem("token")
    navigate("/");
    }

  return (
    <>
    <button onClick={deco}>deconexion </button>
    </>
  );
}
