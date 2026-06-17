import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import ApplicationForm from "./pages/ApplicationForm.tsx";
import TestPage from "./pages/TestPage.tsx";
import ResumeUpload from "./pages/ResumeUpload.tsx";
import Confirmation from "./pages/Confirmation.tsx";
import AdminPanel from "./pages/AdminPanel.tsx";
import Login from "./pages/Login.tsx";
import CandidateLogin from "./pages/CandidateLogin.tsx";
import CandidatePortal from "./pages/CandidatePortal.tsx";

const queryClient = new QueryClient();

// Protected Route HOC wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("admin_token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Candidate Protected Route HOC wrapper
const CandidateProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("candidate_token");
  if (!token) {
    return <Navigate to="/candidato/login" replace />;
  }
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/candidatar" element={<ApplicationForm />} />
          <Route path="/teste/:candidatoId" element={<TestPage />} />
          <Route path="/curriculo/:candidatoId" element={<ResumeUpload />} />
          <Route path="/confirmacao" element={<Confirmation />} />
          <Route path="/login" element={<Login />} />
          <Route path="/candidato/login" element={<CandidateLogin />} />
          <Route 
            path="/candidato/painel" 
            element={
              <CandidateProtectedRoute>
                <CandidatePortal />
              </CandidateProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
