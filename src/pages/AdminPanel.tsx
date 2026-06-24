import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, API_BASE_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, Search, Download, Eye, Briefcase, Loader2, Plus, 
  Trash, BookOpen, Settings, Users, Percent, Check, AlertCircle,
  Calendar, MessageSquare, ArrowRightLeft, Edit2, CheckCircle, HelpCircle,
  User, Shield, Copy, LogOut, Sparkles
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { toast } from "sonner";
import * as XLSX from "xlsx";

type Area = {
  id: string;
  nome: string;
  cargos?: Cargo[];
};

type Cargo = {
  id: string;
  nome: string;
  areaId: string;
  area?: Area;
};

type Question = {
  id: string;
  cargoId: string;
  cargo?: Cargo;
  pergunta: string;
  opcoes: string[];
  correta: number;
};

type Candidato = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cargo: Cargo;
  cargoId: string;
  areaId: string;
  nivel: string;
  descricao: string | null;
  motivacao: string | null;
  nota: number | null;
  dataCriacao: string;
  tags: string[];
  observacaoInterna: string | null;
};

type TesteRow = {
  pergunta: string;
  resposta: string;
  correta: boolean;
};

type TimelineEvent = {
  id: string;
  statusAnterior: string | null;
  statusNovo: string;
  dataCriacao: string;
};

type EmailLog = {
  id: string;
  para: string;
  assunto: string;
  conteudo: string;
  dataEnvio: string;
};

type CandidatoDetail = Candidato & {
  testAnswers: TesteRow[];
  resumes: { arquivoUrl: string }[];
  timelineEvents: TimelineEvent[];
  emailLogs?: EmailLog[];
};

const COLORS = ["#7c3aed", "#06b6d4", "#1e3a8a", "#f59e0b", "#10b981"]; // Violeta, Azul Claro, Azul Escuro, Amarelo, Verde

const AdminPanel = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const adminNome = localStorage.getItem("admin_nome") || "Administrador";
  const [activeTab, setActiveTab] = useState("dashboard");
  const [viewMode, setViewMode] = useState<"table" | "kanban">("kanban");
  
  // Filters
  const [search, setSearch] = useState("");
  const [filterArea, setFilterArea] = useState("all");
  const [filterCargo, setFilterCargo] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  
  // Details Modal
  const [selected, setSelected] = useState<Candidato | null>(null);
  const [candidateDetail, setCandidateDetail] = useState<CandidatoDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [internalNote, setInternalNote] = useState("");
  const [updatingNote, setUpdatingNote] = useState(false);

  // CRUD Modals Toggle
  const [areaModalOpen, setAreaModalOpen] = useState(false);
  const [cargoModalOpen, setCargoModalOpen] = useState(false);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [pipelineModalOpen, setPipelineModalOpen] = useState(false);
  const [adminsModalOpen, setAdminsModalOpen] = useState(false);
  
  // Local CRUD searches
  const [cargoSearch, setCargoSearch] = useState("");
  const [questionSearch, setQuestionSearch] = useState("");

  // Edit states
  const [editingArea, setEditingArea] = useState<{ id: string; nome: string } | null>(null);
  const [editingCargo, setEditingCargo] = useState<{ id: string; nome: string; areaId: string } | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<{ id: string; cargoId: string; pergunta: string; opcoes: string[]; correta: number } | null>(null);
  const [editingPipelineStage, setEditingPipelineStage] = useState<{ id: string; nome: string; ordem: number } | null>(null);
  const [editingAdmin, setEditingAdmin] = useState<{ id: string; email: string; nome: string; password?: string } | null>(null);

  // Add inputs
  const [newArea, setNewArea] = useState("");
  const [newCargo, setNewCargo] = useState("");
  const [newCargoAreaId, setNewCargoAreaId] = useState("");
  
  const [newQuestionCargoId, setNewQuestionCargoId] = useState("");
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionOptions, setNewQuestionOptions] = useState<string[]>(["", "", "", ""]);
  const [newQuestionCorrect, setNewQuestionCorrect] = useState("0");

  const [newStageNome, setNewStageNome] = useState("");
  const [newStageOrdem, setNewStageOrdem] = useState(0);

  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminNome, setNewAdminNome] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");

  // AI Generation states
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiCargoId, setAiCargoId] = useState("");
  const [aiNivel, setAiNivel] = useState("Pleno");
  const [aiQuantidade, setAiQuantidade] = useState("5");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  // Fetch Lists
  const { data: areas = [], refetch: refetchAreas } = useQuery({
    queryKey: ["areas"],
    queryFn: () => api.get<Area[]>("/areas"),
  });

  const { data: cargos = [], refetch: refetchCargos } = useQuery({
    queryKey: ["cargos"],
    queryFn: () => api.get<Cargo[]>("/cargos"),
  });

  const { data: questions = [], refetch: refetchQuestions } = useQuery({
    queryKey: ["questions"],
    queryFn: () => api.get<Question[]>("/questions"),
  });

  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    setPage(1);
  }, [search, filterArea, filterCargo, filterTag, viewMode]);

  const { data: pipelineStages = [], refetch: refetchPipeline } = useQuery({
    queryKey: ["pipelineStages"],
    queryFn: () => api.get<any[]>("/pipeline"),
  });

  const { data: admins = [], refetch: refetchAdmins } = useQuery({
    queryKey: ["admins"],
    queryFn: () => api.get<any[]>("/admins"),
  });

  const PIPELINE_STAGES = pipelineStages.length > 0
    ? pipelineStages.map((s: any) => s.nome)
    : ["Separação", "Entrevistando", "Aprovado", "Contratado", "Arquivo"];

  const { data: candidatosData, isLoading: loadingCandidatos } = useQuery({
    queryKey: ["candidatos", page, search, filterArea, filterCargo, filterTag, viewMode],
    queryFn: () => {
      const queryPage = viewMode === "kanban" ? 1 : page;
      const queryLimit = viewMode === "kanban" ? 100 : limit;
      return api.get<any>(`/candidates?page=${queryPage}&limit=${queryLimit}&search=${search}&areaId=${filterArea}&cargoId=${filterCargo}&tag=${filterTag}`);
    },
  });

  const candidatos = candidatosData?.candidates || (Array.isArray(candidatosData) ? candidatosData : []);
  const totalCount = candidatosData?.total || 0;
  const totalPages = candidatosData?.pages || 1;

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: () => api.get<any>("/dashboard/stats"),
  });


  // Computed Dashboard Metrics (from backend stats)
  const totalCandidatos = stats?.totalCandidates || 0;
  const mediaNota = stats?.mediaNota || 0;
  const aprovadosTeste = stats?.aprovadosTeste || 0;
  const aprovadosPercent = stats?.aprovadosPercent || 0;
  const contratados = stats?.contratados || 0;
  const taxaContratacao = stats?.taxaContratacao || 0;
  const recentesCount = stats?.newCandidatesLast7Days || 0;

  // Distributions and Lists from backend stats
  const seniorityData = stats?.seniorityDistribution || [];
  const areaData = stats?.areaDistribution || [];
  const pipelineCounts = stats?.pipelineCounts || PIPELINE_STAGES.map((stage) => ({ name: stage, value: 0 }));
  const topTalents = stats?.topTalents || [];

  // Candidates are already filtered on server side
  const filteredCandidatos = candidatos;

  const openDetails = async (c: Candidato) => {
    setSelected(c);
    setLoadingDetail(true);
    setInternalNote(c.observacaoInterna || "");
    try {
      const data = await api.get<CandidatoDetail>(`/candidates/${c.id}`);
      setCandidateDetail(data);
    } catch {
      toast.error("Erro ao carregar detalhes do candidato");
    } finally {
      setLoadingDetail(false);
    }
  };

  // Mutate Candidate Pipeline Status
  const updatePipelineMutation = useMutation({
    mutationFn: ({ id, tag }: { id: string; tag: string }) => 
      api.patch(`/candidates/${id}/pipeline`, { tag }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["candidatos"] });
      
      // Update local detailed view if open
      if (candidateDetail && candidateDetail.id === data.id) {
        setCandidateDetail(prev => prev ? {
          ...prev,
          tags: [data.tags[0]],
          timelineEvents: [
            ...prev.timelineEvents,
            {
              id: Math.random().toString(),
              statusAnterior: prev.tags[0] || null,
              statusNovo: data.tags[0],
              dataCriacao: new Date().toISOString()
            }
          ]
        } : null);
      }
      toast.success(`Candidato movido para "${data.tags[0]}"`);
    },
    onError: (err: any) => {
      toast.error("Erro ao atualizar status: " + err.message);
    }
  });

  // Mutate Internal Note
  const saveNote = async () => {
    if (!selected) return;
    setUpdatingNote(true);
    try {
      await api.post(`/candidates/${selected.id}/notes`, { note: internalNote });
      queryClient.invalidateQueries({ queryKey: ["candidatos"] });
      toast.success("Observação interna salva!");
    } catch (err: any) {
      toast.error("Erro ao salvar observação: " + err.message);
    } finally {
      setUpdatingNote(false);
    }
  };

  const [deletingCandidate, setDeletingCandidate] = useState(false);

  const handleDeleteCandidate = async (id: string) => {
    if (!confirm("Excluir esta candidatura permanentemente? Todos os dados, histórico de testes e currículos serão deletados.")) return;
    setDeletingCandidate(true);
    try {
      await api.delete(`/candidates/${id}`);
      queryClient.invalidateQueries({ queryKey: ["candidatos"] });
      setSelected(null);
      setCandidateDetail(null);
      toast.success("Candidatura excluída com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao excluir candidatura: " + err.message);
    } finally {
      setDeletingCandidate(false);
    }
  };

  // AREA CRUD Handlers
  const handleAddArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArea.trim()) return;
    try {
      await api.post("/areas", { nome: newArea.trim() });
      setNewArea("");
      refetchAreas();
      toast.success("Área cadastrada!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao cadastrar área");
    }
  };

  const handleUpdateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArea || !editingArea.nome.trim()) return;
    try {
      await api.put(`/areas/${editingArea.id}`, { nome: editingArea.nome.trim() });
      setEditingArea(null);
      refetchAreas();
      toast.success("Área atualizada!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar área");
    }
  };

  const handleDeleteArea = async (id: string) => {
    if (!confirm("Excluir esta área? Todos os cargos vinculados também serão excluídos.")) return;
    try {
      await api.delete(`/areas/${id}`);
      refetchAreas();
      refetchCargos();
      toast.success("Área removida!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao deletar área");
    }
  };

  // CARGO CRUD Handlers
  const handleAddCargo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCargo.trim() || !newCargoAreaId) {
      toast.error("Preencha o nome do cargo e a área");
      return;
    }
    try {
      await api.post("/cargos", { nome: newCargo.trim(), areaId: newCargoAreaId });
      setNewCargo("");
      refetchCargos();
      toast.success("Cargo cadastrado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao cadastrar cargo");
    }
  };

  const handleUpdateCargo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCargo || !editingCargo.nome.trim() || !editingCargo.areaId) return;
    try {
      await api.put(`/cargos/${editingCargo.id}`, { nome: editingCargo.nome.trim(), areaId: editingCargo.areaId });
      setEditingCargo(null);
      refetchCargos();
      toast.success("Cargo atualizado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar cargo");
    }
  };

  const handleDeleteCargo = async (id: string) => {
    if (!confirm("Excluir este cargo?")) return;
    try {
      await api.delete(`/cargos/${id}`);
      refetchCargos();
      toast.success("Cargo removido!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao deletar cargo");
    }
  };

  // QUESTION CRUD Handlers
  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionCargoId || !newQuestionText.trim()) {
      toast.error("Preencha a pergunta e selecione o cargo");
      return;
    }
    if (newQuestionOptions.some(o => !o.trim())) {
      toast.error("Preencha todas as 4 alternativas");
      return;
    }

    try {
      await api.post("/questions", {
        cargoId: newQuestionCargoId,
        pergunta: newQuestionText.trim(),
        opcoes: newQuestionOptions,
        correta: parseInt(newQuestionCorrect),
      });

      setNewQuestionText("");
      setNewQuestionOptions(["", "", "", ""]);
      setNewQuestionCorrect("0");
      refetchQuestions();
      toast.success("Pergunta criada com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar pergunta");
    }
  };

  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion || !editingQuestion.cargoId || !editingQuestion.pergunta.trim()) return;
    if (editingQuestion.opcoes.some(o => !o.trim())) {
      toast.error("Todas as alternativas devem ser preenchidas");
      return;
    }
    try {
      await api.put(`/questions/${editingQuestion.id}`, {
        cargoId: editingQuestion.cargoId,
        pergunta: editingQuestion.pergunta.trim(),
        opcoes: editingQuestion.opcoes,
        correta: editingQuestion.correta,
      });
      setEditingQuestion(null);
      refetchQuestions();
      toast.success("Pergunta atualizada!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar pergunta");
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Deletar esta pergunta?")) return;
    try {
      await api.delete(`/questions/${id}`);
      refetchQuestions();
      toast.success("Pergunta removida!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao deletar pergunta");
    }
  };

  // Export functions
  const exportCandidatesCSV = async () => {
    try {
      toast.loading("Buscando candidatos para exportação...");
      const response = await api.get<any>(
        `/candidates?page=1&limit=99999&search=${search}&areaId=${filterArea}&cargoId=${filterCargo}&tag=${filterTag}`
      );
      toast.dismiss();

      const candidatesToExport = response?.candidates || [];
      if (candidatesToExport.length === 0) {
        toast.info("Nenhum candidato para exportar.");
        return;
      }

      let csvContent = "\uFEFF";
      csvContent += "Nome,E-mail,Telefone,Cargo,Área,Senioridade,Nota do Teste,Status,Data de Cadastro\n";

      candidatesToExport.forEach((c: any) => {
        const row = [
          `"${c.nome.replace(/"/g, '""')}"`,
          `"${c.email.replace(/"/g, '""')}"`,
          `"${(c.telefone || "").replace(/"/g, '""')}"`,
          `"${(c.cargo?.nome || "Não associado").replace(/"/g, '""')}"`,
          `"${(c.cargo?.area?.nome || "Não associada").replace(/"/g, '""')}"`,
          `"${c.nivel}"`,
          c.nota !== null ? `${c.nota}%` : "—",
          `"${(c.tags[0] || "Separação").replace(/"/g, '""')}"`,
          `"${new Date(c.dataCriacao).toLocaleDateString("pt-BR")}"`
        ];
        csvContent += row.join(",") + "\n";
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Candidatos_TalentFlow_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`${candidatesToExport.length} candidatos exportados com sucesso!`);
    } catch (err: any) {
      toast.dismiss();
      toast.error("Erro ao exportar candidatos: " + err.message);
    }
  };

  const exportDashboardCSV = () => {
    if (!stats) {
      toast.error("Nenhuma estatística carregada para exportar.");
      return;
    }

    try {
      let csvContent = "\uFEFF";
      csvContent += "Métrica,Valor\n";
      csvContent += `Total de Candidatos,${totalCandidatos}\n`;
      csvContent += `Média Geral de Notas,${mediaNota}%\n`;
      csvContent += `Total Aprovados no Teste,${aprovadosTeste} (${aprovadosPercent}%)\n`;
      csvContent += `Contratações Realizadas,${contratados} (${taxaContratacao}%)\n`;
      csvContent += `Candidatos Criados nos Últimos 7 Dias,${recentesCount}\n`;
      csvContent += `Tempo Médio no Pipeline,${stats?.tempoMedioPipeline || 0} dias\n\n`;

      csvContent += "Distribuição por Etapa do Pipeline\n";
      pipelineCounts.forEach((p: any) => {
        csvContent += `${p.name},${p.value}\n`;
      });
      csvContent += "\n";

      csvContent += "Distribuição por Área de Interesse\n";
      areaData.forEach((a: any) => {
        csvContent += `${a.name},${a.value}\n`;
      });
      csvContent += "\n";

      csvContent += "Distribuição por Nível de Senioridade\n";
      seniorityData.forEach((s: any) => {
        csvContent += `${s.name},${s.value}\n`;
      });
      csvContent += "\n";

      csvContent += "Taxa de Conversão de Teste por Área\n";
      const conversionRates = stats?.conversionRateByArea || [];
      conversionRates.forEach((c: any) => {
        csvContent += `${c.area},${c.taxa}%\n`;
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Relatorio_Metricas_TalentFlow_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Métricas exportadas com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao exportar métricas: " + err.message);
    }
  };

  const exportCandidatesXLSX = async () => {
    try {
      toast.loading("Buscando candidatos para exportação...");
      const response = await api.get<any>(
        `/candidates?page=1&limit=99999&search=${search}&areaId=${filterArea}&cargoId=${filterCargo}&tag=${filterTag}`
      );
      toast.dismiss();

      const candidatesToExport = response?.candidates || [];
      if (candidatesToExport.length === 0) {
        toast.info("Nenhum candidato para exportar.");
        return;
      }

      const data = candidatesToExport.map((c: any) => ({
        "Nome": c.nome,
        "E-mail": c.email,
        "Telefone": c.telefone || "—",
        "Cargo": c.cargo?.nome || "Não associado",
        "Área": c.cargo?.area?.nome || "Não associada",
        "Senioridade": c.nivel,
        "Nota do Teste": c.nota !== null ? `${c.nota}%` : "—",
        "Status": c.tags[0] || "Separação",
        "Data de Cadastro": new Date(c.dataCriacao).toLocaleDateString("pt-BR")
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Candidatos");

      // Auto-fit columns
      const max_len = data.reduce((w: any, r: any) => {
        Object.keys(r).forEach((key, col_idx) => {
          const val = String(r[key]);
          w[col_idx] = Math.max(w[col_idx] || 0, val.length, key.length);
        });
        return w;
      }, []);
      worksheet["!cols"] = max_len.map((l: any) => ({ wch: l + 3 }));

      XLSX.writeFile(workbook, `Candidatos_TalentFlow_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success(`${candidatesToExport.length} candidatos exportados para Excel!`);
    } catch (err: any) {
      toast.dismiss();
      toast.error("Erro ao exportar candidatos: " + err.message);
    }
  };

  const exportDashboardXLSX = () => {
    if (!stats) {
      toast.error("Nenhuma estatística carregada para exportar.");
      return;
    }

    try {
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Geral
      const generalData = [
        { "Métrica": "Total de Candidatos", "Valor": totalCandidatos },
        { "Métrica": "Média Geral de Notas", "Valor": `${mediaNota}%` },
        { "Métrica": "Total Aprovados no Teste", "Valor": `${aprovadosTeste} (${aprovadosPercent}%)` },
        { "Métrica": "Contratações Realizadas", "Valor": `${contratados} (${taxaContratacao}%)` },
        { "Métrica": "Candidatos Criados nos Últimos 7 Dias", "Valor": recentesCount },
        { "Métrica": "Tempo Médio no Pipeline", "Valor": `${stats?.tempoMedioPipeline || 0} dias` }
      ];
      const generalSheet = XLSX.utils.json_to_sheet(generalData);
      XLSX.utils.book_append_sheet(workbook, generalSheet, "Geral");

      // Sheet 2: Pipeline
      const pipelineData = pipelineCounts.map((p: any) => ({ "Etapa": p.name, "Quantidade": p.value }));
      const pipelineSheet = XLSX.utils.json_to_sheet(pipelineData);
      XLSX.utils.book_append_sheet(workbook, pipelineSheet, "Pipeline");

      // Sheet 3: Áreas
      const areaDistributionData = areaData.map((a: any) => ({ "Área": a.name, "Quantidade": a.value }));
      const areaSheet = XLSX.utils.json_to_sheet(areaDistributionData);
      XLSX.utils.book_append_sheet(workbook, areaSheet, "Áreas");

      // Sheet 4: Senioridade
      const seniorityDistributionData = seniorityData.map((s: any) => ({ "Senioridade": s.name, "Quantidade": s.value }));
      const senioritySheet = XLSX.utils.json_to_sheet(seniorityDistributionData);
      XLSX.utils.book_append_sheet(workbook, senioritySheet, "Senioridade");

      // Sheet 5: Conversão de Testes
      const conversionRates = stats?.conversionRateByArea || [];
      const conversionData = conversionRates.map((c: any) => ({ "Área": c.area, "Taxa de Conversão": `${c.taxa}%` }));
      const conversionSheet = XLSX.utils.json_to_sheet(conversionData);
      XLSX.utils.book_append_sheet(workbook, conversionSheet, "Conversão de Testes");

      XLSX.writeFile(workbook, `Relatorio_Metricas_TalentFlow_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Métricas exportadas com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao exportar métricas: " + err.message);
    }
  };

  // PIPELINE CRUD Handlers
  const handleAddPipelineStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageNome.trim()) return;
    try {
      await api.post("/pipeline", { nome: newStageNome.trim(), ordem: Number(newStageOrdem) });
      setNewStageNome("");
      setNewStageOrdem(0);
      refetchPipeline();
      queryClient.invalidateQueries({ queryKey: ["candidatos"] });
      toast.success("Etapa cadastrada!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao cadastrar etapa");
    }
  };

  const handleUpdatePipelineStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPipelineStage || !editingPipelineStage.nome.trim()) return;
    try {
      await api.put(`/pipeline/${editingPipelineStage.id}`, {
        nome: editingPipelineStage.nome.trim(),
        ordem: Number(editingPipelineStage.ordem),
      });
      setEditingPipelineStage(null);
      refetchPipeline();
      queryClient.invalidateQueries({ queryKey: ["candidatos"] });
      toast.success("Etapa atualizada!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar etapa");
    }
  };

  const handleDeletePipelineStage = async (id: string) => {
    if (!confirm("Excluir esta etapa? Candidatos nesta etapa serão movidos para o primeiro estágio ativo.")) return;
    try {
      await api.delete(`/pipeline/${id}`);
      refetchPipeline();
      queryClient.invalidateQueries({ queryKey: ["candidatos"] });
      toast.success("Etapa removida!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao deletar etapa");
    }
  };

  // ADMINS CRUD Handlers
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminNome.trim() || !newAdminPassword.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    try {
      await api.post("/admins", {
        email: newAdminEmail.trim(),
        nome: newAdminNome.trim(),
        password: newAdminPassword.trim(),
      });
      setNewAdminEmail("");
      setNewAdminNome("");
      setNewAdminPassword("");
      refetchAdmins();
      toast.success("Administrador cadastrado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao cadastrar administrador");
    }
  };

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin || !editingAdmin.email.trim() || !editingAdmin.nome.trim()) return;
    try {
      await api.put(`/admins/${editingAdmin.id}`, {
        email: editingAdmin.email.trim(),
        nome: editingAdmin.nome.trim(),
        password: editingAdmin.password?.trim() || null,
      });
      setEditingAdmin(null);
      refetchAdmins();
      toast.success("Administrador atualizado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar administrador");
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm("Excluir esta conta de administrador?")) return;
    try {
      await api.delete(`/admins/${id}`);
      refetchAdmins();
      toast.success("Administrador removido!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao deletar administrador");
    }
  };

  // AI Question Generation
  const handleGenerateWithAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiCargoId) {
      toast.error("Selecione um cargo para gerar perguntas");
      return;
    }

    setAiLoading(true);
    setAiResult(null);
    try {
      const response = await api.post<any>("/questions/generate", {
        cargoId: aiCargoId,
        nivel: aiNivel,
        quantidade: parseInt(aiQuantidade),
      });
      setAiResult(`✅ ${response.message}`);
      refetchQuestions();
      toast.success(response.message);
    } catch (err: any) {
      const msg = err.message || "Erro ao gerar perguntas com IA";
      setAiResult(`❌ ${msg}`);
      toast.error(msg);
    } finally {
      setAiLoading(false);
    }
  };

  const getNotaColor = (nota: number | null) => {
    if (nota === null || nota === 0) return "secondary";
    if (nota >= 80) return "default";
    if (nota >= 60) return "outline";
    return "destructive";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg hero-gradient flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold text-accent">TalentFlow Suite</span>
              <span className="text-[10px] text-primary px-2 py-0.5 rounded-full border border-primary/20 bg-primary/5 font-bold uppercase tracking-wider">ADMIN</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-[280px] lg:w-[320px]">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="candidates">Processo</TabsTrigger>
                <TabsTrigger value="config">Ajustes</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setProfileModalOpen(true)}
              className="border-border hover:bg-muted text-muted-foreground flex items-center gap-1.5 h-9"
            >
              <User className="w-4 h-4 text-primary" />
              <span className="hidden lg:inline text-xs font-medium">Perfil</span>
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                localStorage.removeItem("admin_token");
                localStorage.removeItem("admin_email");
                localStorage.removeItem("admin_nome");
                toast.success("Logout efetuado!");
                navigate("/login");
              }}
              className="text-muted-foreground hover:text-destructive text-xs h-9 flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        
        {/* TAB 1: DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-6 animate-fade-in">
            {loadingCandidatos ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Dashboard Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card/40 border p-4 rounded-xl backdrop-blur-sm">
                  <div>
                    <h2 className="text-xl font-bold text-accent font-display">Dashboard de Métricas</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Visão geral do pipeline de contratação e desempenho dos testes</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={exportDashboardCSV}
                      className="flex items-center gap-1.5 border-dashed border-primary/40 hover:bg-primary/5 hover:border-primary/60 flex-1 sm:flex-initial"
                    >
                      <Download className="w-4 h-4 text-primary" /> Exportar CSV
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={exportDashboardXLSX}
                      className="flex items-center gap-1.5 border-dashed border-primary/40 hover:bg-primary/5 hover:border-primary/60 flex-1 sm:flex-initial"
                    >
                      <Download className="w-4 h-4 text-primary" /> Exportar Excel
                    </Button>
                  </div>
                </div>

                {/* Scorecards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {[
                    { 
                      label: "Banco de Talentos", 
                      value: totalCandidatos, 
                      icon: Users, 
                      desc: recentesCount > 0 ? `+${recentesCount} novos esta semana` : "Sem novas adesões recentes",
                      color: "text-blue-600 bg-blue-50"
                    },
                    { 
                      label: "Média Geral Técnica", 
                      value: mediaNota > 0 ? `${mediaNota}%` : "—", 
                      icon: Percent, 
                      desc: "Média das avaliações realizadas",
                      color: "text-violet-600 bg-violet-50"
                    },
                    { 
                      label: "Aprovados no Teste", 
                      value: aprovadosTeste, 
                      icon: CheckCircle, 
                      desc: `${aprovadosPercent}% dos candidatos totais`,
                      color: "text-green-600 bg-green-50"
                    },
                    { 
                      label: "Contratações Realizadas", 
                      value: contratados, 
                      icon: Briefcase, 
                      desc: `Taxa de conversão: ${taxaContratacao}%`,
                      color: "text-cyan-600 bg-cyan-50"
                    },
                    { 
                      label: "Tempo Médio no Pipeline", 
                      value: stats?.tempoMedioPipeline !== undefined ? `${stats.tempoMedioPipeline} dias` : "—", 
                      icon: Calendar, 
                      desc: "Tempo médio de contratação ou descarte",
                      color: "text-amber-600 bg-amber-50"
                    }
                  ].map((card, idx) => {
                    const Icon = card.icon;
                    return (
                      <Card key={idx} className="glass-card card-hover-effect">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                          <CardTitle className="text-sm font-semibold text-muted-foreground">{card.label}</CardTitle>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                            <Icon className="w-4.5 h-4.5" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold font-display text-accent">{card.value}</div>
                          <p className="text-[11px] text-muted-foreground mt-1 font-medium">{card.desc}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Funnel Visual Progress */}
                <Card className="glass-card">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base font-bold text-accent">Status do Processo de Recrutamento (Funil)</CardTitle>
                    <CardDescription>Quantidade de talentos em cada fase do pipeline de contratação</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-5">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {pipelineCounts.map((p, idx) => {
                        const colors = [
                          "bg-blue-500/10 border-blue-500/20 text-blue-700 hover:border-blue-500/40",
                          "bg-amber-500/10 border-amber-500/20 text-amber-700 hover:border-amber-500/40",
                          "bg-violet-500/10 border-violet-500/20 text-violet-700 hover:border-violet-500/40",
                          "bg-green-500/10 border-green-500/20 text-green-700 hover:border-green-500/40",
                          "bg-gray-500/10 border-gray-500/20 text-gray-700 hover:border-gray-500/40"
                        ];
                        const pct = totalCandidatos > 0 ? Math.round((p.value / totalCandidatos) * 100) : 0;
                        return (
                          <div 
                            key={p.name} 
                            onClick={() => {
                              setActiveTab("candidates");
                              setViewMode("kanban");
                              setFilterTag(p.name);
                            }}
                            className={`border p-4 rounded-2xl flex flex-col justify-between cursor-pointer transition-all ${colors[idx % colors.length]}`}
                          >
                            <span className="text-[10px] uppercase font-bold tracking-wider opacity-85">{p.name}</span>
                            <div className="flex items-baseline justify-between mt-3">
                              <span className="text-2xl font-bold font-display">{p.value}</span>
                              <span className="text-xs font-semibold">{pct}%</span>
                            </div>
                            <div className="w-full bg-black/5 rounded-full h-1.5 mt-2 overflow-hidden">
                              <div 
                                className="h-full bg-current rounded-full" 
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Analytical Rows */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Top Technical Talents list (Left Column: 5 Cols) */}
                  <Card className="glass-card lg:col-span-5 flex flex-col justify-between">
                    <div>
                      <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-base font-bold text-accent flex items-center gap-1.5">
                          <CheckCircle className="w-4.5 h-4.5 text-primary" /> Melhores Desempenhos
                        </CardTitle>
                        <CardDescription>Candidatos com as notas mais altas nos testes técnicos</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4 px-2 sm:px-6">
                        {topTalents.length > 0 ? (
                          <div className="divide-y">
                            {topTalents.map((talent, index) => (
                              <div 
                                key={talent.id} 
                                className="flex items-center justify-between py-3 hover:bg-muted/10 px-2 rounded-xl transition-colors cursor-pointer"
                                onClick={() => openDetails(talent)}
                              >
                                <div className="space-y-1 flex-1 min-w-0 pr-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-muted-foreground w-4">#{index + 1}</span>
                                    <h4 className="font-semibold text-xs text-accent truncate">{talent.nome}</h4>
                                  </div>
                                  <div className="flex items-center gap-1.5 pl-6 text-[10px] text-muted-foreground">
                                    <span className="truncate max-w-[120px]">{talent.cargo?.nome}</span>
                                    <span>•</span>
                                    <span>{talent.nivel}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Badge variant={getNotaColor(talent.nota)} className="text-[10px] font-bold">
                                    {talent.nota}%
                                  </Badge>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-7 text-[10px] px-2 font-medium hover:bg-primary/10 hover:text-primary"
                                    onClick={(e) => { e.stopPropagation(); openDetails(talent); }}
                                  >
                                    Ver
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-10 text-center text-xs text-muted-foreground">
                            Nenhum candidato concluiu avaliações técnicas.
                          </div>
                        )}
                      </CardContent>
                    </div>
                  </Card>

                  {/* Distribution Charts (Right Column: 7 Cols) */}
                  <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    
                    {/* Area Donut Chart */}
                    <Card className="glass-card flex flex-col justify-between">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-accent">Áreas de Interesse</CardTitle>
                        <CardDescription>Distribuição dos talentos por área profissional</CardDescription>
                      </CardHeader>
                      <CardContent className="h-[210px] flex flex-col items-center justify-center">
                        {areaData.length > 0 ? (
                          <>
                            <div className="w-full h-[120px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={areaData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={35}
                                    outerRadius={50}
                                    paddingAngle={3}
                                    dataKey="value"
                                  >
                                    {areaData.map((entry: any, idx: number) => (
                                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Tooltip formatter={(value) => [`${value} candidatos`, "Talentos"]} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="w-full space-y-1 text-[10px] max-h-[80px] overflow-y-auto pr-1">
                              {areaData.map((d: any, idx: number) => (
                                <div key={d.name} className="flex items-center justify-between border-b pb-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                    <span className="font-medium text-muted-foreground truncate max-w-[140px]">{d.name}</span>
                                  </div>
                                  <span className="font-bold text-accent">{d.value}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="text-muted-foreground text-xs">Sem dados disponíveis.</div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Seniority Donut Chart */}
                    <Card className="glass-card flex flex-col justify-between">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-accent">Nível de Senioridade</CardTitle>
                        <CardDescription>Proporção por nível profissional</CardDescription>
                      </CardHeader>
                      <CardContent className="h-[210px] flex flex-col items-center justify-center">
                        {seniorityData.length > 0 ? (
                          <>
                            <div className="w-full h-[120px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={seniorityData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={35}
                                    outerRadius={50}
                                    paddingAngle={3}
                                    dataKey="value"
                                  >
                                    {seniorityData.map((entry: any, idx: number) => (
                                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Tooltip formatter={(value) => [`${value} candidatos`, "Talentos"]} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="w-full space-y-1 text-[10px] max-h-[80px] overflow-y-auto pr-1">
                              {seniorityData.map((d: any, idx: number) => (
                                <div key={d.name} className="flex items-center justify-between border-b pb-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                    <span className="font-medium text-muted-foreground">{d.name}</span>
                                  </div>
                                  <span className="font-bold text-accent">{d.value}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="text-muted-foreground text-xs">Sem dados disponíveis.</div>
                        )}
                      </CardContent>
                    </Card>

                  </div>

                </div>

                {/* Taxa de Conversão por Área Horizontal Bar Chart */}
                <Card className="glass-card">
                  <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-accent font-display">Taxa de Conversão por Área</CardTitle>
                      <CardDescription>Percentual de candidatos com nota ≥ 60% nos testes técnicos por área de atuação</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 h-[320px]">
                    {stats?.conversionRateByArea && stats.conversionRateByArea.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={stats.conversionRateByArea}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.8} />
                              <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.8} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} opacity={0.15} />
                          <XAxis type="number" domain={[0, 100]} tickFormatter={(val) => `${val}%`} stroke="#888888" fontSize={11} />
                          <YAxis dataKey="area" type="category" width={150} stroke="#888888" fontSize={11} />
                          <Tooltip formatter={(value) => [`${value}%`, "Taxa de Conversão"]} />
                          <Bar dataKey="taxa" fill="url(#barGradient)" radius={[0, 4, 4, 0]} barSize={16} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                        Nenhum dado de conversão por área disponível.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* TAB 2: CANDIDATES PIPELINE & KANBAN */}
        {activeTab === "candidates" && (
          <div className="space-y-6">
            
            {/* Header controls & Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/40 border p-4 rounded-xl backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Button 
                  variant={viewMode === "kanban" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setViewMode("kanban")}
                  className={viewMode === "kanban" ? "hero-gradient border-0 text-white" : ""}
                >
                  Modo Quadro
                </Button>
                <Button 
                  variant={viewMode === "table" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className={viewMode === "table" ? "hero-gradient border-0 text-white" : ""}
                >
                  Modo Tabela
                </Button>
                {viewMode === "table" && (
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={exportCandidatesCSV}
                      className="flex items-center gap-1.5 border-dashed border-primary/40 hover:bg-primary/5 hover:border-primary/60"
                    >
                      <Download className="w-4 h-4 text-primary" /> Exportar CSV
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={exportCandidatesXLSX}
                      className="flex items-center gap-1.5 border-dashed border-primary/40 hover:bg-primary/5 hover:border-primary/60"
                    >
                      <Download className="w-4 h-4 text-primary" /> Exportar Excel
                    </Button>
                  </div>
                )}
              </div>

              {/* Advanced search controls */}
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
                </div>
                <Select value={filterArea} onValueChange={setFilterArea}>
                  <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Área" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Áreas</SelectItem>
                    {areas.map((a) => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterCargo} onValueChange={setFilterCargo}>
                  <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Cargo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Cargos</SelectItem>
                    {cargos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
                {viewMode === "table" && (
                  <Select value={filterTag} onValueChange={setFilterTag}>
                    <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Status</SelectItem>
                      {PIPELINE_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* TABLE VIEW */}
            {viewMode === "table" && (
              <div className="glass-card-lg overflow-hidden">
                {loadingCandidatos ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : filteredCandidatos.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground text-sm">Nenhum candidato encontrado.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Vaga</TableHead>
                          <TableHead>Área</TableHead>
                          <TableHead>Nível</TableHead>
                          <TableHead>Nota Teste</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Inscrição</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCandidatos.map((c) => (
                          <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetails(c)}>
                            <TableCell className="font-semibold text-accent">{c.nome}</TableCell>
                            <TableCell>{c.cargo?.nome || "Vaga desconhecida"}</TableCell>
                            <TableCell><Badge variant="outline">{c.cargo?.area?.nome || "—"}</Badge></TableCell>
                            <TableCell>{c.nivel}</TableCell>
                            <TableCell>
                              <Badge variant={getNotaColor(c.nota)}>
                                {c.nota !== null && c.nota > 0 ? `${c.nota}%` : "—"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-primary/20 text-primary border-0 font-semibold">
                                {c.tags[0] || "Separação"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {new Date(c.dataCriacao).toLocaleDateString("pt-BR")}
                            </TableCell>
                            <TableCell><Eye className="w-4 h-4 text-muted-foreground" /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                {/* PAGINATION CONTROLS */}
                {viewMode === "table" && totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-muted/50 bg-background/50">
                    <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                      Mostrando <span className="font-semibold text-foreground">{filteredCandidatos.length}</span> candidatos desta página (Página <span className="font-semibold text-foreground">{page}</span> de <span className="font-semibold text-foreground">{totalPages}</span>, total de <span className="font-semibold text-foreground">{totalCount}</span>)
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        className="h-8 text-xs px-2 sm:px-3"
                      >
                        Anterior
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                        if (
                          p === 1 ||
                          p === totalPages ||
                          Math.abs(p - page) <= 1
                        ) {
                          return (
                            <Button
                              key={p}
                              variant={p === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPage(p)}
                              className={`h-8 w-8 text-xs p-0 ${p === page ? "hero-gradient border-0 text-white font-bold" : ""}`}
                            >
                              {p}
                            </Button>
                          );
                        } else if (
                          (p === 2 && page > 3) ||
                          (p === totalPages - 1 && page < totalPages - 2)
                        ) {
                          return (
                            <span key={p} className="text-muted-foreground text-xs px-1">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={page === totalPages}
                        className="h-8 text-xs px-2 sm:px-3"
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* INTERACTIVE KANBAN BOARD */}
            {viewMode === "kanban" && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
                {PIPELINE_STAGES.map((stage) => {
                  const stageCandidates = filteredCandidatos.filter(c => (c.tags[0] || "Separação") === stage);
                  return (
                    <div key={stage} className="flex flex-col min-w-[240px] bg-muted/30 border rounded-2xl p-3 h-[70vh]">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b">
                        <span className="font-display font-bold text-accent text-sm">{stage}</span>
                        <Badge className="bg-primary/10 text-primary border-0 font-bold">{stageCandidates.length}</Badge>
                      </div>
                      
                      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                        {stageCandidates.map((c) => (
                          <Card 
                            key={c.id} 
                            className="bg-card hover:border-primary/50 transition-all cursor-pointer shadow-sm relative group"
                            onClick={() => openDetails(c)}
                          >
                            <CardHeader className="p-3.5 pb-2 space-y-1">
                              <div className="flex justify-between items-start gap-1">
                                <span className="font-semibold text-xs text-accent line-clamp-1 group-hover:text-primary transition-colors">{c.nome}</span>
                                <Badge variant={getNotaColor(c.nota)} className="text-[9px] px-1 h-4">
                                  {c.nota !== null && c.nota > 0 ? `${c.nota}%` : "—"}
                                </Badge>
                              </div>
                              <p className="text-[10px] text-muted-foreground line-clamp-1 font-medium">{c.cargo?.nome}</p>
                            </CardHeader>
                            <CardContent className="p-3.5 pt-0 pb-2.5 flex items-center justify-between text-[10px] text-muted-foreground">
                              <span className="bg-muted px-1.5 py-0.5 rounded font-medium">{c.nivel}</span>
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(c.dataCriacao).toLocaleDateString("pt-BR", {day: "numeric", month: "short"})}</span>
                            </CardContent>
                            
                            {/* Fast stage transition triggers */}
                            <div className="p-2 pt-0 border-t flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <Select
                                value={stage}
                                onValueChange={(newTag) => updatePipelineMutation.mutate({ id: c.id, tag: newTag })}
                              >
                                <SelectTrigger className="h-6 w-full text-[9px] font-semibold border-border/65">
                                  <ArrowRightLeft className="w-2.5 h-2.5 mr-1" /> Mover para...
                                </SelectTrigger>
                                <SelectContent>
                                  {PIPELINE_STAGES.map(s => <SelectItem key={s} value={s} disabled={s === stage}>{s}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          </Card>
                        ))}
                        {stageCandidates.length === 0 && (
                          <div className="h-32 border border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground text-[11px] bg-card/25 p-4 text-center">
                            Nenhum candidato
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CONFIGURATION SETUP MODALS */}
        {activeTab === "config" && (
          <div className="max-w-5xl mx-auto space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-xl text-accent">Gerenciador de Configurações</CardTitle>
                <CardDescription>Gerencie as vagas de emprego, áreas de atuação e banco de questões do processo seletivo</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-4">
                
                {/* Area Trigger Card */}
                <div className="border rounded-2xl p-4 flex flex-col items-center justify-between text-center space-y-3 bg-card hover:border-primary/40 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-accent text-xs">Áreas de Atuação</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Gerencie os departamentos da empresa</p>
                  </div>
                  <Button 
                    className="w-full hero-gradient text-white border-0 text-xs" 
                    size="sm"
                    onClick={() => setAreaModalOpen(true)}
                  >
                    Gerenciar Áreas ({areas.length})
                  </Button>
                </div>

                {/* Cargo Trigger Card */}
                <div className="border rounded-2xl p-4 flex flex-col items-center justify-between text-center space-y-3 bg-card hover:border-primary/40 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-accent text-xs">Cargos / Vagas</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Crie e edite vagas dentro das áreas</p>
                  </div>
                  <Button 
                    className="w-full hero-gradient text-white border-0 text-xs" 
                    size="sm"
                    onClick={() => setCargoModalOpen(true)}
                  >
                    Gerenciar Cargos ({cargos.length})
                  </Button>
                </div>

                {/* Questions Trigger Card */}
                <div className="border rounded-2xl p-4 flex flex-col items-center justify-between text-center space-y-3 bg-card hover:border-primary/40 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-accent text-xs">Questões de Teste</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Gerencie os questionários avaliativos</p>
                  </div>
                  <Button 
                    className="w-full hero-gradient text-white border-0 text-xs" 
                    size="sm"
                    onClick={() => setQuestionModalOpen(true)}
                  >
                    Gerenciar Questões ({questions.length})
                  </Button>
                </div>

                {/* Pipeline Stages Trigger Card */}
                <div className="border rounded-2xl p-4 flex flex-col items-center justify-between text-center space-y-3 bg-card hover:border-primary/40 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-accent text-xs">Pipeline Stages</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Gerencie as etapas do processo seletivo</p>
                  </div>
                  <Button 
                    className="w-full hero-gradient text-white border-0 text-xs" 
                    size="sm"
                    onClick={() => setPipelineModalOpen(true)}
                  >
                    Pipeline ({pipelineStages.length})
                  </Button>
                </div>

                {/* Admins Trigger Card */}
                <div className="border rounded-2xl p-4 flex flex-col items-center justify-between text-center space-y-3 bg-card hover:border-primary/40 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-accent text-xs">Administradores</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Gerencie contas de acesso ao painel</p>
                  </div>
                  <Button 
                    className="w-full hero-gradient text-white border-0 text-xs" 
                    size="sm"
                    onClick={() => setAdminsModalOpen(true)}
                  >
                    Admins ({admins.length})
                  </Button>
                </div>

              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* -------------------- CONFIGURATION CRUD MODALS -------------------- */}

      {/* Profile Modal */}
      <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent className="max-w-md bg-card border-border/80 shadow-2xl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="font-display text-xl text-accent flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Perfil do Administrador
            </DialogTitle>
            <DialogDescription>
              Dados da conta de acesso administrativo ativa.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl hero-gradient flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary/20">
                {adminNome.substring(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-base text-accent">{adminNome}</h3>
                <span className="text-[10px] text-primary px-2.5 py-0.5 rounded-full border border-primary/20 bg-primary/5 font-bold uppercase tracking-wider">
                  Super Admin
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1 bg-muted/30 p-3.5 rounded-xl border border-border/50 text-xs">
                <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-0.5">E-mail de Acesso</p>
                <p className="text-accent font-semibold text-sm">
                  {localStorage.getItem("admin_email") || "delciofarias04@gmail.com"}
                </p>
              </div>

              <div className="space-y-1 bg-muted/30 p-3.5 rounded-xl border border-border/50 text-xs">
                <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-0.5">Permissões de Sistema</p>
                <p className="text-accent font-medium leading-relaxed flex items-center gap-1.5 mt-0.5">
                  <Check className="w-4 h-4 text-green-600" /> Acesso total aos candidatos
                </p>
                <p className="text-accent font-medium leading-relaxed flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-green-600" /> Gerenciamento de Cargos e Questões
                </p>
                <p className="text-accent font-medium leading-relaxed flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-green-600" /> Configurações de Banco de Dados
                </p>
              </div>

              <div className="space-y-1 bg-muted/30 p-3.5 rounded-xl border border-border/50 text-xs">
                <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-0.5">Duração da Sessão</p>
                <p className="text-accent font-medium">
                  24 horas (Tokens renovados a cada login)
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setProfileModalOpen(false)}
              className="w-full sm:w-auto text-xs h-9 border-border"
            >
              Fechar Perfil
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setProfileModalOpen(false);
                localStorage.removeItem("admin_token");
                localStorage.removeItem("admin_email");
                localStorage.removeItem("admin_nome");
                toast.success("Logout efetuado!");
                navigate("/login");
              }}
              className="w-full sm:w-auto text-xs h-9 flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              Sair da Conta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 1: AREAS CRUD */}
      <Dialog open={areaModalOpen} onOpenChange={setAreaModalOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciador de Áreas de Atuação</DialogTitle>
            <DialogDescription>Cadastre, exclua ou renomeie as divisões organizacionais.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-2">
            {/* Create / Edit Form */}
            {editingArea ? (
              <form onSubmit={handleUpdateArea} className="flex gap-2 bg-muted/40 p-3 rounded-lg border">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs font-bold text-accent">Renomear Área</Label>
                  <Input 
                    value={editingArea.nome} 
                    onChange={(e) => setEditingArea({ ...editingArea, nome: e.target.value })} 
                    className="h-9"
                  />
                </div>
                <div className="flex items-end gap-1">
                  <Button type="submit" size="sm" className="h-9 bg-success hover:bg-success/90 text-white">Salvar</Button>
                  <Button type="button" size="sm" variant="outline" className="h-9" onClick={() => setEditingArea(null)}>Cancelar</Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddArea} className="flex gap-2 items-end">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="newAreaName" className="text-xs font-bold">Nova Área</Label>
                  <Input 
                    id="newAreaName"
                    placeholder="Nome da Área (ex: Marketing)" 
                    value={newArea} 
                    onChange={(e) => setNewArea(e.target.value)} 
                    className="h-9"
                  />
                </div>
                <Button type="submit" size="sm" className="h-9 hero-gradient border-0 text-white"><Plus className="w-4 h-4" /></Button>
              </form>
            )}

            {/* List Table */}
            <div className="border rounded-lg max-h-[300px] overflow-y-auto divide-y">
              {areas.length === 0 ? (
                <p className="text-xs text-muted-foreground p-6 text-center">Nenhuma área cadastrada.</p>
              ) : (
                areas.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 text-sm hover:bg-muted/10">
                    <span className="font-semibold text-accent">{a.nome}</span>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => setEditingArea({ id: a.id, nome: a.nome })}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteArea(a.id)}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: CARGOS CRUD */}
      <Dialog open={cargoModalOpen} onOpenChange={setCargoModalOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciador de Cargos e Vagas</DialogTitle>
            <DialogDescription>Gerencie as vagas em aberto associadas aos departamentos.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Create / Edit Form */}
            {editingCargo ? (
              <form onSubmit={handleUpdateCargo} className="space-y-3 bg-muted/40 p-4 rounded-lg border">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-accent">Área Vinculada</Label>
                    <Select value={editingCargo.areaId} onValueChange={(val) => setEditingCargo({ ...editingCargo, areaId: val })}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {areas.map((a) => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-accent">Nome do Cargo</Label>
                    <Input 
                      value={editingCargo.nome} 
                      onChange={(e) => setEditingCargo({ ...editingCargo, nome: e.target.value })} 
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-1.5">
                  <Button type="submit" size="sm" className="bg-success hover:bg-success/90 text-white">Atualizar</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setEditingCargo(null)}>Cancelar</Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddCargo} className="space-y-3 p-3 border rounded-xl bg-card">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Selecione a Área</Label>
                    <Select value={newCargoAreaId} onValueChange={setNewCargoAreaId}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {areas.map((a) => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Nome do Cargo</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Ex: Dev Frontend" 
                        value={newCargo} 
                        onChange={(e) => setNewCargo(e.target.value)} 
                        className="h-9"
                      />
                      <Button type="submit" size="sm" className="h-9 hero-gradient border-0 text-white"><Plus className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar cargo ou área..."
                value={cargoSearch}
                onChange={(e) => setCargoSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* List Table */}
            <div className="border rounded-lg max-h-[250px] overflow-y-auto divide-y">
              {cargos.filter(c => {
                const term = cargoSearch.toLowerCase();
                return c.nome.toLowerCase().includes(term) || (c.area?.nome || "").toLowerCase().includes(term);
              }).length === 0 ? (
                <p className="text-xs text-muted-foreground p-6 text-center">Nenhum cargo encontrado.</p>
              ) : (
                cargos.filter(c => {
                  const term = cargoSearch.toLowerCase();
                  return c.nome.toLowerCase().includes(term) || (c.area?.nome || "").toLowerCase().includes(term);
                }).map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 text-sm hover:bg-muted/10">
                    <div className="flex flex-col">
                      <span className="font-semibold text-accent">{c.nome}</span>
                      <span className="text-[10px] text-primary font-bold uppercase tracking-wider">{c.area?.nome}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => setEditingCargo({ id: c.id, nome: c.nome, areaId: c.areaId })}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteCargo(c.id)}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: QUESTIONS CRUD */}
      <Dialog open={questionModalOpen} onOpenChange={setQuestionModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciador de Questões de Avaliação</DialogTitle>
            <DialogDescription>Adicione, atualize ou remova as perguntas dos testes de múltipla escolha.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            
            {/* Create / Edit Form */}
            {editingQuestion ? (
              <form onSubmit={handleUpdateQuestion} className="space-y-3 bg-muted/40 p-4 rounded-xl border">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-accent">Vincular ao Cargo</Label>
                    <Select value={editingQuestion.cargoId} onValueChange={(val) => setEditingQuestion({ ...editingQuestion, cargoId: val })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {cargos.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.nome} ({c.area?.nome})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-accent">Enunciado da Pergunta</Label>
                    <Input 
                      value={editingQuestion.pergunta} 
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, pergunta: e.target.value })} 
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-accent">Editar Alternativas</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {editingQuestion.opcoes.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-muted-foreground">{String.fromCharCode(65 + idx)}:</span>
                        <Input 
                          value={opt} 
                          onChange={(e) => {
                            const updated = [...editingQuestion.opcoes];
                            updated[idx] = e.target.value;
                            setEditingQuestion({ ...editingQuestion, opcoes: updated });
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-accent">Gabarito (Alternativa Correta)</Label>
                    <Select value={editingQuestion.correta.toString()} onValueChange={(val) => setEditingQuestion({ ...editingQuestion, correta: parseInt(val) })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">A</SelectItem>
                        <SelectItem value="1">B</SelectItem>
                        <SelectItem value="2">C</SelectItem>
                        <SelectItem value="3">D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-1.5 justify-end">
                    <Button type="submit" size="sm" className="h-8 bg-success hover:bg-success/90 text-white">Salvar</Button>
                    <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => setEditingQuestion(null)}>Cancelar</Button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddQuestion} className="space-y-3 p-4 border rounded-xl bg-card/60">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Cargo da Vaga</Label>
                    <Select value={newQuestionCargoId} onValueChange={setNewQuestionCargoId}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Selecione o Cargo" /></SelectTrigger>
                      <SelectContent>
                        {cargos.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.nome} ({c.area?.nome})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Enunciado da Pergunta</Label>
                    <Input 
                      placeholder="Qual a pergunta?" 
                      className="h-9"
                      value={newQuestionText} 
                      onChange={(e) => setNewQuestionText(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Alternativas</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {newQuestionOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground">{String.fromCharCode(65 + idx)}:</span>
                        <Input 
                          placeholder={`Opção ${idx + 1}`} 
                          className="h-8 text-xs" 
                          value={opt}
                          onChange={(e) => {
                            const updated = [...newQuestionOptions];
                            updated[idx] = e.target.value;
                            setNewQuestionOptions(updated);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Alternativa Correta</Label>
                    <Select value={newQuestionCorrect} onValueChange={setNewQuestionCorrect}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">A</SelectItem>
                        <SelectItem value="1">B</SelectItem>
                        <SelectItem value="2">C</SelectItem>
                        <SelectItem value="3">D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="hero-gradient border-0 text-white h-9">
                    Adicionar Questão
                  </Button>
                </div>
              </form>
            )}

            {/* AI Generation Button */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAiModalOpen(true);
                  setAiResult(null);
                }}
                className="h-9 text-xs border-violet-300 text-violet-700 hover:bg-violet-50 flex-1"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Gerar com IA
              </Button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar pergunta ou cargo..."
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* List Table */}
            <div className="border rounded-lg max-h-[200px] overflow-y-auto divide-y">
              {questions.filter(q => {
                const term = questionSearch.toLowerCase();
                return q.pergunta.toLowerCase().includes(term) || (q.cargo?.nome || "").toLowerCase().includes(term);
              }).length === 0 ? (
                <p className="text-xs text-muted-foreground p-6 text-center">Nenhuma pergunta encontrada.</p>
              ) : (
                questions.filter(q => {
                  const term = questionSearch.toLowerCase();
                  return q.pergunta.toLowerCase().includes(term) || (q.cargo?.nome || "").toLowerCase().includes(term);
                }).map((q) => (
                  <div key={q.id} className="p-3 text-xs flex justify-between items-start gap-4 hover:bg-muted/10">
                    <div className="space-y-1 flex-1">
                      <p className="font-semibold text-accent leading-relaxed">{q.pergunta}</p>
                      <p className="text-[9px] text-primary uppercase font-bold tracking-wider">{q.cargo?.nome} ({q.cargo?.area?.nome})</p>
                      <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground pt-1">
                        {q.opcoes.map((o, idx) => (
                          <div key={idx} className={q.correta === idx ? "text-success font-semibold" : ""}>
                            {String.fromCharCode(65 + idx)}) {o} {q.correta === idx ? "✓" : ""}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() => setEditingQuestion({ id: q.id, cargoId: q.cargoId, pergunta: q.pergunta, opcoes: q.opcoes, correta: q.correta })}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteQuestion(q.id)}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* -------------------- AI GENERATION DIALOG -------------------- */}
      <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
        <DialogContent className="max-w-md bg-card border-border/80 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-accent flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-500" /> Gerar Perguntas com IA
            </DialogTitle>
            <DialogDescription>
              Crie perguntas técnicas contextualizadas automaticamente usando inteligência artificial.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGenerateWithAI} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-accent">Cargo *</Label>
              <Select value={aiCargoId} onValueChange={setAiCargoId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  {cargos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome} ({c.area?.nome})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-accent">Nível de Senioridade</Label>
              <Select value={aiNivel} onValueChange={setAiNivel}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Júnior">Júnior</SelectItem>
                  <SelectItem value="Pleno">Pleno</SelectItem>
                  <SelectItem value="Sênior">Sênior</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-accent">Quantidade de Perguntas</Label>
              <Select value={aiQuantidade} onValueChange={setAiQuantidade}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 perguntas</SelectItem>
                  <SelectItem value="10">10 perguntas</SelectItem>
                  <SelectItem value="15">15 perguntas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>
                As perguntas serão geradas por IA via Groq (modelo LLaMA 3 70B) e salvas automaticamente.
                Revise o conteúdo antes de aplicar aos candidatos.
              </span>
            </div>

            {aiResult && (
              <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                aiResult.startsWith("✅") 
                  ? "bg-green-50 border-green-200 text-green-700" 
                  : "bg-red-50 border-red-200 text-red-700"
              }`}>
                {aiResult.startsWith("✅") ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{aiResult}</span>
              </div>
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAiModalOpen(false)}
                className="text-xs h-10 border-border"
              >
                Fechar
              </Button>
              <Button
                type="submit"
                disabled={aiLoading || !aiCargoId}
                className="text-xs h-10 hero-gradient border-0 text-white"
              >
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
                {aiLoading ? "Gerando..." : "Gerar Perguntas"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: PIPELINE CRUD */}
      <Dialog open={pipelineModalOpen} onOpenChange={setPipelineModalOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciador do Pipeline de Recrutamento</DialogTitle>
            <DialogDescription>
              Crie, remova ou edite os estágios do processo de recrutamento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Create / Edit Form */}
            {editingPipelineStage ? (
              <form onSubmit={handleUpdatePipelineStage} className="space-y-3 bg-muted/40 p-3 rounded-lg border">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-accent">Nome da Etapa</Label>
                  <Input 
                    value={editingPipelineStage.nome} 
                    onChange={(e) => setEditingPipelineStage({ ...editingPipelineStage, nome: e.target.value })} 
                    className="h-9"
                    placeholder="Ex: Entrevista Técnica"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-accent">Ordem de Exibição</Label>
                  <Input 
                    type="number"
                    value={editingPipelineStage.ordem} 
                    onChange={(e) => setEditingPipelineStage({ ...editingPipelineStage, ordem: parseInt(e.target.value) || 0 })} 
                    className="h-9"
                    min="0"
                  />
                </div>
                <div className="flex justify-end gap-1 pt-1">
                  <Button type="button" size="sm" variant="outline" className="h-9 text-xs" onClick={() => setEditingPipelineStage(null)}>Cancelar</Button>
                  <Button type="submit" size="sm" className="h-9 text-xs bg-success hover:bg-success/90 text-white">Salvar Alterações</Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddPipelineStage} className="space-y-3 p-3 bg-muted/20 rounded-lg border">
                <div className="space-y-1">
                  <Label htmlFor="newStageName" className="text-xs font-bold">Nova Etapa</Label>
                  <Input 
                    id="newStageName"
                    placeholder="Nome da etapa (ex: Triagem)" 
                    value={newStageNome} 
                    onChange={(e) => setNewStageNome(e.target.value)} 
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="newStageOrder" className="text-xs font-bold">Ordem</Label>
                  <Input 
                    id="newStageOrder"
                    type="number"
                    value={newStageOrdem} 
                    onChange={(e) => setNewStageOrdem(parseInt(e.target.value) || 0)} 
                    className="h-9"
                    min="0"
                  />
                </div>
                <Button type="submit" size="sm" className="w-full h-9 hero-gradient border-0 text-white text-xs flex items-center justify-center gap-1">
                  <Plus className="w-4 h-4" /> Adicionar Estágio
                </Button>
              </form>
            )}

            {/* List Table */}
            <div className="border rounded-lg max-h-[300px] overflow-y-auto divide-y">
              {pipelineStages.length === 0 ? (
                <p className="text-xs text-muted-foreground p-6 text-center">Nenhuma etapa cadastrada no pipeline.</p>
              ) : (
                pipelineStages.map((stage: any) => (
                  <div key={stage.id} className="flex items-center justify-between p-3 text-sm hover:bg-muted/10">
                    <div className="flex flex-col">
                      <span className="font-semibold text-accent">{stage.nome}</span>
                      <span className="text-[10px] text-muted-foreground">Ordem: {stage.ordem}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => setEditingPipelineStage({ id: stage.id, nome: stage.nome, ordem: stage.ordem })}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeletePipelineStage(stage.id)}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: ADMINS CRUD */}
      <Dialog open={adminsModalOpen} onOpenChange={setAdminsModalOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciador de Administradores</DialogTitle>
            <DialogDescription>
              Gerencie as contas de acesso administrativo para o TalentFlow Suite.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Create / Edit Form */}
            {editingAdmin ? (
              <form onSubmit={handleUpdateAdmin} className="space-y-3 bg-muted/40 p-3 rounded-lg border">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-accent">Nome Completo</Label>
                  <Input 
                    value={editingAdmin.nome} 
                    onChange={(e) => setEditingAdmin({ ...editingAdmin, nome: e.target.value })} 
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-accent">E-mail de Acesso</Label>
                  <Input 
                    type="email"
                    value={editingAdmin.email} 
                    onChange={(e) => setEditingAdmin({ ...editingAdmin, email: e.target.value })} 
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-accent">Nova Senha (deixe em branco para manter)</Label>
                  <Input 
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={editingAdmin.password || ""} 
                    onChange={(e) => setEditingAdmin({ ...editingAdmin, password: e.target.value })} 
                    className="h-9"
                  />
                </div>
                <div className="flex justify-end gap-1 pt-1">
                  <Button type="button" size="sm" variant="outline" className="h-9 text-xs" onClick={() => setEditingAdmin(null)}>Cancelar</Button>
                  <Button type="submit" size="sm" className="h-9 text-xs bg-success hover:bg-success/90 text-white">Salvar Alterações</Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddAdmin} className="space-y-3 p-3 bg-muted/20 rounded-lg border">
                <div className="space-y-1">
                  <Label htmlFor="newAdminNome" className="text-xs font-bold">Nome Completo</Label>
                  <Input 
                    id="newAdminNome"
                    placeholder="Ex: João da Silva" 
                    value={newAdminNome} 
                    onChange={(e) => setNewAdminNome(e.target.value)} 
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="newAdminEmail" className="text-xs font-bold">E-mail de Acesso</Label>
                  <Input 
                    id="newAdminEmail"
                    type="email"
                    placeholder="Ex: joao@empresa.com" 
                    value={newAdminEmail} 
                    onChange={(e) => setNewAdminEmail(e.target.value)} 
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="newAdminPass" className="text-xs font-bold">Senha Inicial</Label>
                  <Input 
                    id="newAdminPass"
                    type="password"
                    placeholder="Mínimo 6 caracteres" 
                    value={newAdminPassword} 
                    onChange={(e) => setNewAdminPassword(e.target.value)} 
                    className="h-9"
                  />
                </div>
                <Button type="submit" size="sm" className="w-full h-9 hero-gradient border-0 text-white text-xs flex items-center justify-center gap-1">
                  <Plus className="w-4 h-4" /> Cadastrar Administrador
                </Button>
              </form>
            )}

            {/* List Table */}
            <div className="border rounded-lg max-h-[300px] overflow-y-auto divide-y">
              {admins.length === 0 ? (
                <p className="text-xs text-muted-foreground p-6 text-center">Nenhum administrador cadastrado.</p>
              ) : (
                admins.map((admin: any) => (
                  <div key={admin.id} className="flex items-center justify-between p-3 text-sm hover:bg-muted/10">
                    <div className="flex flex-col">
                      <span className="font-semibold text-accent">{admin.nome}</span>
                      <span className="text-[10px] text-muted-foreground">{admin.email}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => setEditingAdmin({ id: admin.id, nome: admin.nome, email: admin.email })}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteAdmin(admin.id)}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* -------------------- CANDIDATE DETAILS DIALOG -------------------- */}
      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setCandidateDetail(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                  <span className="text-accent">{selected.nome}</span>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Status do Processo:</Label>
                    <Select 
                      value={candidateDetail?.tags[0] || selected.tags[0]} 
                      onValueChange={(tag) => updatePipelineMutation.mutate({ id: selected.id, tag })}
                    >
                      <SelectTrigger className="w-36 h-8 text-xs font-bold bg-primary/10 text-primary border-primary/20">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {PIPELINE_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </DialogTitle>
              </DialogHeader>

              {loadingDetail ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : (
                candidateDetail && (
                  <div className="space-y-6 pt-2">
                    
                    {/* Information Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs bg-muted/30 p-4 rounded-xl border">
                      {[
                        ["Email de Contato", candidateDetail.email],
                        ["Telefone / WhatsApp", candidateDetail.telefone || "—"],
                        ["Nível Profissional", candidateDetail.nivel],
                        ["Vaga Pretendida", candidateDetail.cargo?.nome || "—"],
                        ["Área de Atuação", candidateDetail.cargo?.area?.nome || "—"],
                        ["Nota do Teste Técnico", candidateDetail.nota !== null && candidateDetail.nota > 0 ? `${candidateDetail.nota}%` : "Pendente / Não realizado"],
                      ].map(([label, value]) => (
                        <div key={label} className="space-y-0.5">
                          <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">{label}</p>
                          <p className="font-semibold text-accent">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Address details */}
                    <div className="space-y-1 border p-3.5 rounded-xl bg-card text-xs">
                      <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-0.5">Endereço de Residência</p>
                      <p className="text-accent font-medium leading-relaxed">
                        {candidateDetail.endereco ? `${candidateDetail.endereco}` : "Sem endereço cadastrado"}
                        {candidateDetail.bairro ? ` • Bairro: ${candidateDetail.bairro}` : ""}
                        {candidateDetail.cidade ? ` • Cidade: ${candidateDetail.cidade} - ${candidateDetail.estado || ""}` : ""}
                      </p>
                    </div>

                    {candidateDetail.descricao && (
                      <div className="space-y-1.5">
                        <p className="text-muted-foreground text-[10px] uppercase tracking-wide font-bold">Fale sobre você</p>
                        <p className="text-foreground text-xs bg-card p-3.5 rounded-xl border leading-relaxed">{candidateDetail.descricao}</p>
                      </div>
                    )}

                    {candidateDetail.motivacao && (
                      <div className="space-y-1.5">
                        <p className="text-muted-foreground text-[10px] uppercase tracking-wide font-bold">Por que deseja essa vaga?</p>
                        <p className="text-foreground text-xs bg-card p-3.5 rounded-xl border leading-relaxed">{candidateDetail.motivacao}</p>
                      </div>
                    )}

                    {/* Timeline */}
                    <div className="space-y-2.5">
                      <p className="text-muted-foreground text-[10px] uppercase tracking-wide font-bold">Histórico de Atividades (Timeline)</p>
                      <div className="relative border-l border-secondary/30 ml-3 pl-5 space-y-4">
                        {candidateDetail.timelineEvents.map((event) => (
                          <div key={event.id} className="relative text-xs">
                            <span className="absolute -left-[29px] top-1 bg-secondary w-2 h-2 rounded-full ring-4 ring-background" />
                            <p className="font-medium text-accent">
                              {event.statusAnterior 
                                ? `Candidato movido de "${event.statusAnterior}" para "${event.statusNovo}"` 
                                : `Inscrição recebida com status "${event.statusNovo}"`
                              }
                            </p>
                            <p className="text-[9px] text-muted-foreground mt-0.5">
                              {new Date(event.dataCriacao).toLocaleString("pt-BR")}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Test Answers */}
                    {candidateDetail.testAnswers && candidateDetail.testAnswers.length > 0 && (
                      <div className="space-y-2.5">
                        <p className="text-muted-foreground text-[10px] uppercase tracking-wide font-bold">Respostas do Teste Técnico</p>
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {candidateDetail.testAnswers.map((t, idx) => (
                            <div 
                              key={idx} 
                              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                                t.correta ? "border-green-500/20 bg-green-500/5 text-green-700" : "border-red-500/20 bg-red-500/5 text-red-700"
                              }`}
                            >
                              <div className="flex-1 space-y-1">
                                <p className="font-semibold text-foreground leading-relaxed">{t.pergunta}</p>
                                <p className="text-[10px]">
                                  Resposta enviada: <span className="font-semibold underline">{t.resposta}</span>
                                </p>
                              </div>
                              <span className="flex-shrink-0 mt-0.5">
                                {t.correta ? <CheckCircle className="w-4 h-4 text-green-600" /> : <HelpCircle className="w-4 h-4 text-red-600" />}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Histórico de E-mails */}
                    {candidateDetail.emailLogs && candidateDetail.emailLogs.length > 0 && (
                      <div className="space-y-2.5">
                        <p className="text-muted-foreground text-[10px] uppercase tracking-wide font-bold">Histórico de E-mails Disparados</p>
                        <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
                          {candidateDetail.emailLogs.map((log: any) => (
                            <div key={log.id} className="p-3 bg-card border rounded-xl space-y-1.5 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-accent">{log.assunto}</span>
                                <span className="text-[9px] text-muted-foreground">
                                  {new Date(log.dataEnvio).toLocaleString("pt-BR")}
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground whitespace-pre-line leading-relaxed bg-muted/30 p-2.5 rounded-lg border">
                                {log.conteudo}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Resume */}
                    {candidateDetail.resumes && candidateDetail.resumes.length > 0 ? (
                      <div className="space-y-1.5">
                        <p className="text-muted-foreground text-[10px] uppercase tracking-wide font-bold">Currículo Anexado</p>
                        <a 
                          href={`${API_BASE_URL}${candidateDetail.resumes[0].arquivoUrl}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" className="gap-2 w-full h-10 text-xs border-secondary/30 text-accent hover:bg-secondary/5">
                            <Download className="w-4 h-4 text-primary" /> Visualizar / Baixar Currículo do Candidato
                          </Button>
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-600 font-semibold flex items-center gap-2 bg-amber-50/50 p-3 rounded-xl border border-amber-200">
                        <AlertCircle className="w-4 h-4 text-amber-500" /> Nenhum currículo PDF/Word anexado a esta candidatura.
                      </p>
                    )}

                    {/* Links de Acesso */}
                    <div className="space-y-2 pt-3 border-t text-xs">
                      <p className="text-muted-foreground text-[10px] uppercase tracking-wide font-bold">Links de Acesso Rápidos</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            const url = `${window.location.origin}/teste/${candidateDetail.id}`;
                            navigator.clipboard.writeText(url);
                            toast.success("Link do teste técnico copiado!");
                          }}
                          className="h-9 text-xs border-border flex items-center justify-between px-3"
                        >
                          <span className="truncate mr-2">Link do Teste Técnico</span>
                          <Copy className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            const url = `${window.location.origin}/curriculo/${candidateDetail.id}`;
                            navigator.clipboard.writeText(url);
                            toast.success("Link de envio do currículo copiado!");
                          }}
                          className="h-9 text-xs border-border flex items-center justify-between px-3"
                        >
                          <span className="truncate mr-2">Link de Envio do Currículo</span>
                          <Copy className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        </Button>
                      </div>
                    </div>

                    {/* Internal Notes */}
                    <div className="space-y-2 pt-3 border-t">
                      <Label htmlFor="internal-note-modal" className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Observações Internas (Exclusivo para Recrutadores)
                      </Label>
                      <Textarea 
                        id="internal-note-modal" 
                        rows={3} 
                        placeholder="Adicione observações particulares da entrevista, perfil, feedbacks técnicos..." 
                        value={internalNote}
                        onChange={(e) => setInternalNote(e.target.value)}
                        className="text-xs"
                      />
                      <Button 
                        size="sm" 
                        className="w-full hero-gradient text-white border-0 text-xs h-9" 
                        onClick={saveNote}
                        disabled={updatingNote}
                      >
                        {updatingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                        Salvar Anotação Interna
                      </Button>
                    </div>

                    {/* Critical Actions */}
                    <div className="space-y-2 pt-4 border-t flex flex-col gap-2">
                      <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Zona de Perigo</p>
                      <Button 
                        variant="destructive"
                        size="sm" 
                        className="w-full text-xs h-9 flex items-center justify-center gap-1.5" 
                        onClick={() => handleDeleteCandidate(candidateDetail.id)}
                        disabled={deletingCandidate}
                      >
                        {deletingCandidate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash className="w-3.5 h-3.5" />}
                        Excluir Candidatura
                      </Button>
                    </div>

                  </div>
                )
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
