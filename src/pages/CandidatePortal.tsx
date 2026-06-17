import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, FileText, CheckCircle2, Clock, LogOut, ArrowRight, 
  HelpCircle, XCircle, FileSpreadsheet, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

export default function CandidatePortal() {
  const navigate = useNavigate();

  // Fetch candidate profile
  const { data: candidate, isLoading: loadingProfile, error: profileError } = useQuery({
    queryKey: ["candidateProfile"],
    queryFn: () => {
      const token = localStorage.getItem("candidate_token");
      if (!token) throw new Error("Não autenticado");
      return api.get<any>("/candidates/me");
    },
    retry: false,
  });

  // Fetch pipeline stages
  const { data: pipelineStages = [] } = useQuery({
    queryKey: ["pipelineStages"],
    queryFn: () => api.get<any[]>("/pipeline"),
  });

  const handleLogout = () => {
    localStorage.removeItem("candidate_token");
    localStorage.removeItem("candidate_email");
    localStorage.removeItem("candidate_nome");
    toast.success("Logout efetuado!");
    navigate("/candidato/login");
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Clock className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Carregando portal...</span>
        </div>
      </div>
    );
  }

  if (profileError || !candidate) {
    localStorage.removeItem("candidate_token");
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full glass-card border-destructive/20 text-center">
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mx-auto mb-2">
              <XCircle className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl text-accent">Erro de Autenticação</CardTitle>
            <CardDescription>Sua sessão expirou ou você não está logado.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full hero-gradient text-white border-0" onClick={() => navigate("/candidato/login")}>
              Ir para o Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStatus = candidate.tags[0] || "Separação";
  const isArchived = currentStatus === "Arquivo";

  // Determine stage indexes
  const activeStageIndex = pipelineStages.findIndex((s: any) => s.nome === currentStatus);

  return (
    <div className="min-h-screen bg-background text-foreground pb-12">
      {/* Navbar Header */}
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl hero-gradient flex items-center justify-center text-white font-bold font-display text-lg">TF</div>
            <span className="font-display font-bold text-accent text-lg">TalentFlow <span className="text-xs text-primary font-normal">Candidato</span></span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold text-accent">{candidate.nome}</span>
              <span className="text-[10px] text-muted-foreground">{candidate.email}</span>
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-9 w-9" onClick={handleLogout} title="Sair">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
        
        {/* Welcome Banner */}
        <div className="glass-card-lg p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border-primary/10">
          <div>
            <h1 className="font-display text-2xl font-bold text-accent">Olá, {candidate.nome.split(" ")[0]}!</h1>
            <p className="text-sm text-muted-foreground mt-1">Acompanhe aqui o andamento da sua candidatura em tempo real.</p>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2.5 rounded-2xl w-fit">
            <Briefcase className="w-5 h-5 text-primary" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-medium">Vaga Candidatada</span>
              <span className="text-sm font-bold text-accent">{candidate.cargo?.nome || "Cargo"} ({candidate.nivel})</span>
            </div>
          </div>
        </div>

        {/* Stepper Pipeline Status */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base text-accent">Status da Candidatura</CardTitle>
            <CardDescription>Estágios do seu processo de seleção</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {isArchived ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Candidatura Arquivada</p>
                  <p className="text-xs text-amber-700/95 mt-0.5">Obrigado pelo seu tempo e dedicação no processo. Seus dados estão salvos e entraremos em contato para futuras oportunidades.</p>
                </div>
              </div>
            ) : (
              <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-2 pt-2 pb-4">
                {/* Stepper Connecting Line */}
                <div className="hidden md:block absolute left-4 right-4 top-1/2 -translate-y-1/2 h-[2px] bg-muted z-0" />

                {pipelineStages.map((stage: any, index: number) => {
                  const isCompleted = index < activeStageIndex;
                  const isActive = index === activeStageIndex;

                  return (
                    <div key={stage.id} className="relative z-10 flex md:flex-col items-center gap-3 md:gap-2 w-full text-left md:text-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-colors ${
                        isActive 
                          ? "bg-primary border-primary text-white shadow-lg shadow-primary/30 animate-pulse" 
                          : isCompleted 
                            ? "bg-success border-success text-white" 
                            : "bg-background border-muted text-muted-foreground"
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                      </div>
                      <div className="flex flex-col md:items-center">
                        <span className={`text-xs font-semibold ${isActive ? "text-primary font-bold" : isCompleted ? "text-success" : "text-muted-foreground"}`}>
                          {stage.nome}
                        </span>
                        {isActive && <Badge variant="outline" className="text-[9px] py-0 px-1 border-primary/30 text-primary mt-0.5">Atual</Badge>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Cards: Test and Resume */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card: Teste Técnico */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between text-accent">
                <span>Avaliação Técnica</span>
                <HelpCircle className="w-4 h-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {candidate.nota !== null && candidate.nota > 0 ? (
                <div className="flex flex-col items-center py-4 text-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center text-success border border-success/20">
                    <span className="font-display font-bold text-lg">{candidate.nota}%</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-success">Avaliação Concluída!</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Sua nota final foi registrada no painel do recrutador.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col justify-between h-36">
                  <div>
                    <Badge variant="destructive" className="w-fit text-[10px]">Pendente</Badge>
                    <h3 className="font-semibold text-accent text-sm mt-2">Teste Geral Técnico</h3>
                    <p className="text-xs text-muted-foreground mt-1">Realize a avaliação técnica de 5 questões de múltipla escolha para prosseguir.</p>
                  </div>
                  <Button 
                    className="w-full hero-gradient text-white border-0 text-xs h-9 flex items-center justify-center gap-1.5"
                    onClick={() => navigate(`/teste/${candidate.id}`)}
                  >
                    Iniciar Teste <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card: Envio de Currículo */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between text-accent">
                <span>Currículo Anexo</span>
                <FileText className="w-4 h-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {candidate.resumes && candidate.resumes.length > 0 ? (
                <div className="flex flex-col items-center py-4 text-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary">Currículo Recebido</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Arquivo enviado com sucesso no cadastro.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col justify-between h-36">
                  <div>
                    <Badge variant="destructive" className="w-fit text-[10px]">Pendente</Badge>
                    <h3 className="font-semibold text-accent text-sm mt-2">Anexar Currículo</h3>
                    <p className="text-xs text-muted-foreground mt-1">Faça o upload do seu currículo em PDF/DOC para análise do recrutador.</p>
                  </div>
                  <Button 
                    className="w-full hero-gradient text-white border-0 text-xs h-9 flex items-center justify-center gap-1.5"
                    onClick={() => navigate(`/curriculo/${candidate.id}`)}
                  >
                    Enviar Currículo <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

      </main>
    </div>
  );
}
