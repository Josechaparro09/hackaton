import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { ProfilesPanel } from "@/components/admin/ProfilesPanel";
import { AppliancesPanel } from "@/components/admin/AppliancesPanel";
import { PredictionsPanel } from "@/components/admin/PredictionsPanel";
import { ClimatePredictionsPanel } from "@/components/admin/ClimatePredictionsPanel";
import NotFound from "./pages/NotFound";
import SolarProduction from "./pages/SolarProduction";
import EnergyPrediction from "./pages/EnergyPrediction";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/profiles"
              element={
                <ProtectedRoute>
                  <ProfilesPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/appliances"
              element={
                <ProtectedRoute>
                  <AppliancesPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/predictions"
              element={
                <ProtectedRoute>
                  <PredictionsPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/climate-predictions"
              element={
                <ProtectedRoute>
                  <ClimatePredictionsPanel />
                </ProtectedRoute>
              }
            />
            <Route path="/solar-production" element={<SolarProduction />} />
            <Route path="/energy-prediction" element={<EnergyPrediction />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
