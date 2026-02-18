import { Routes, Route } from "react-router-dom";
import { SignIn, SignUp } from "@clerk/clerk-react";
import AppLayout from "../layouts/AppLayout";
import HomePage from "../pages/HomePage";
import DashboardPage from "../pages/DashboardPage";
import ProtectedRoute from "./ProtectedRoute";
import PrivacyPage from "../pages/PrivacyPage";


export default function App() {
  return (
    <Routes>
      <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
      <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />

      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />

        {/* Dashboard protégé */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/privacy" element={<PrivacyPage />} />
      </Route>
    </Routes>
  );
}
