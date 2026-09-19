import { Routes, Route } from "react-router-dom";
import { SignIn, SignUp } from "@clerk/clerk-react";
import AppLayout from "../layouts/AppLayout";
import HomePage from "../pages/HomePage";
import MtlPage from "../pages/MtlPage";
import NycPage from "../pages/NycPage";
import DashboardPage from "../pages/DashboardPage";
import PrivacyPage from "../pages/PrivacyPage";
import PaymentResultPage from "../pages/PaymentResultPage";
import ProtectedRoute from "./ProtectedRoute";
export default function App() {
  return (
    <Routes>
      

       
      <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />

      
      <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />

      
      
      <Route element={<AppLayout />}>
        
        
        <Route path="/" element={<HomePage />} />
        <Route path="/mtl" element={<MtlPage />} />
        <Route path="/nyc" element={<NycPage />} />

        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route path="/support/success" element={<PaymentResultPage kind="support" status="success" />} />
        <Route path="/support/cancel" element={<PaymentResultPage kind="support" status="cancel" />} />
        <Route path="/billing/success" element={<PaymentResultPage kind="billing" status="success" />} />
        <Route path="/billing/cancel" element={<PaymentResultPage kind="billing" status="cancel" />} />

        
        <Route path="/privacy" element={<PrivacyPage />} />
      </Route>
    </Routes>
  );
}
