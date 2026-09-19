import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app/App";
import "leaflet/dist/leaflet.css";
import "./styles/globals.css";

import { ClerkProvider } from "@clerk/clerk-react";
const pk = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>

    
    <ClerkProvider publishableKey={pk}>

      
      <BrowserRouter>

        
        <App />

      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);