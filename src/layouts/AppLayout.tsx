import { Outlet, Link } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import Footer from "./Footer";
import logo from "../assets/crimevision_logo_10.png";

export default function AppLayout() {
  return (
    <div className="app-layout">
      <header className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
          <Link to="/" className="title">
            <img src={logo} alt="CrimeVision logo" className="topbar-logo" />
            CrimeVision
          </Link>


          <SignedOut>
            <Link to="/sign-in" style={{ color: "white" }}>Sign in</Link>
          </SignedOut>

          <SignedIn>
            {/*  lien dashboard */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link to="/dashboard" className="title-right">Dashboard</Link>
            </div>
            <UserButton />
          </SignedIn>
        </div>
      </header>

      <main className="page-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
