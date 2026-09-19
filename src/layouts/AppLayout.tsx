import { Outlet, Link, NavLink } from "react-router-dom";
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

          <nav className="city-nav" aria-label="City maps">
            <NavLink to="/mtl" className={({ isActive }) => `topbar-action ${isActive ? "is-active" : ""}`}>MTL</NavLink>
            <NavLink to="/nyc" className={({ isActive }) => `topbar-action ${isActive ? "is-active" : ""}`}>NYC</NavLink>
          </nav>

          
          <SignedOut>

            
            <Link to="/sign-in" className="topbar-action">Sign in</Link>
          </SignedOut>
          
          
          <SignedIn>
            
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link to="/dashboard" className="topbar-action">Dashboard</Link>
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
