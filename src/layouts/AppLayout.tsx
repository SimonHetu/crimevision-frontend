import { Outlet, Link } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";

export default function AppLayout() {
  return (
    <div className="app-layout">
      <header className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
          <div style={{ flex: 1 }}>CrimeVision</div>

          <SignedOut>
            <Link to="/sign-in" style={{ color: "white" }}>Sign in</Link>
          </SignedOut>

          <SignedIn>
            {/*  lien dashboard */}
            <Link to="/dashboard" style={{ color: "white", opacity: 0.9 }}>
              Dashboard
            </Link>
            <UserButton />
          </SignedIn>
        </div>
      </header>

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
}
