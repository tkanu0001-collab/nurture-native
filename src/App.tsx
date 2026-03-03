import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import SoilData from "./pages/SoilData";
import SoilHistory from "./pages/SoilHistory";
import PestScan from "./pages/PestScan";
import Weather from "./pages/Weather";
import Voice from "./pages/Voice";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = localStorage.getItem("agriguide-user");
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/soil-data" element={<ProtectedRoute><SoilData /></ProtectedRoute>} />
            <Route path="/soil-history" element={<ProtectedRoute><SoilHistory /></ProtectedRoute>} />
            <Route path="/pest-scan" element={<ProtectedRoute><PestScan /></ProtectedRoute>} />
            <Route path="/weather" element={<ProtectedRoute><Weather /></ProtectedRoute>} />
            <Route path="/voice" element={<ProtectedRoute><Voice /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
