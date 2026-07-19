import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/Auth/AuthPage.jsx";
import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import AdminPanel from "./pages/Admin/AdminPanel.jsx";
import EmployeeDashboard from "./components/EmployeeDashboard.jsx";
import SalonDetail from "./pages/SalonDetail.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={localStorage.getItem("token") ? <Navigate to="/dashboard" replace /> : <Home />}
        />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
        <Route path="/salon/:id" element={<SalonDetail />} />
              </Routes>
    </BrowserRouter>
  );
}

export default App;



