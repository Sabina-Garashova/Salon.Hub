import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { ConfirmProvider } from "./context/ConfirmContext.jsx";
import AuthPage from "./pages/Auth/AuthPage.jsx";
import ForgotPasswordPage from "./pages/Auth/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/Auth/ResetPasswordPage.jsx";
import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import AdminPanel from "./pages/Admin/AdminPanel.jsx";
import EmployeeDashboard from "./components/EmployeeDashboard.jsx";
import SalonDetail from "./pages/SalonDetail.jsx";
import LoyaltyPage from "./pages/LoyaltyPage.jsx";

function App() {
  return (
    <LanguageProvider>
    <ToastProvider>
    <ConfirmProvider>
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={(localStorage.getItem("token") || sessionStorage.getItem("token")) ? <Navigate to="/dashboard" replace /> : <Home />}
        />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
        <Route path="/salon/:id" element={<SalonDetail />} />
        <Route path="/loyalty" element={<LoyaltyPage />} />
              </Routes>
    </BrowserRouter>
    </ConfirmProvider>
    </ToastProvider>
    </LanguageProvider>
  );
}

export default App;






