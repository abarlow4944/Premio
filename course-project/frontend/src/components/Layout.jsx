import NavBar from "./NavBar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <>
      <NavBar />
      <main className="mt-6">
        <Outlet/>
      </main>
    </>
  );
}