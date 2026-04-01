import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/candidatar" element={<ApplicationForm />} />
          <Route path="/teste/:candidatoId" element={<TestPage />} />
          <Route path="/curriculo/:candidatoId" element={<ResumeUpload />} />
          <Route path="/confirmacao" element={<Confirmation />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
