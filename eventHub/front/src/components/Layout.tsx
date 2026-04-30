import { Outlet } from "react-router-dom";
import Footer from "./footer.tsx";
import Navbar from "./navbar.tsx";

function Layout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}
export default Layout;
