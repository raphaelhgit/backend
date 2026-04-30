import { StrictMode, lazy } from "react";
import ReactDOM from "react-dom/client";
import { Route, Routes, BrowserRouter } from "react-router-dom";
const Register = lazy(() => import("./pages/register"));
const Login = lazy(() => import("./pages/login"));
const Ticket = lazy(() => import("./pages/ticket"));
const Profile = lazy(() => import("./pages/profile"));
const CreateEvent = lazy(() => import("./pages/organizer/createEvent.tsx"));
const Dashboard = lazy(() => import("./pages/organizer/dashboard"));
const EditEvent = lazy(() => import("./pages/organizer/editEvent"));
const Event = lazy(() => import("./pages/organizer/event"));
import Accueil from "./pages/accueil";
import Layout from "./components/Layout.tsx";

const root = document.getElementById("root");
if (!root) throw new Error("Élément root introuvable");


ReactDOM.createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Accueil />} />
          <Route path="/register" element={<Register />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/Ticket" element={<Ticket />} />
          <Route path="/Profile" element={<Profile />} />
          <Route path="/CreateEvent" element={<CreateEvent />} />
          <Route path="/Dashboard" element={<Dashboard />} />
          <Route path="/EditEvent" element={<EditEvent />} />
          <Route path="/Event" element={<Event />} />

        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
