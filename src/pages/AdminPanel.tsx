import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Search, Download, Eye, Briefcase, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

type Candidato = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  cargo: string;
  area: string;
  nivel: string;
  descricao: string | null;
  motivacao: string | null;
  nota: number | null;
  data_criacao: string;
};

type TesteRow = {
  pergunta: string;
  resposta: string;
  correta: boolean;
};

const AdminPanel = () => {
  const [search, setSearch] = useState("");
  const [filterArea, setFilterArea] = useState("all");
  const [filterCargo, setFilterCargo] = useState("all");
  const [selected, setSelected] = useState<Candidato | null>(null);
  const [testes, setTestes] = useState<TesteRow[]>([]);
  const [curriculo, setCurriculo] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const { data: candidatos = [], isLoading } = useQuery({
    queryKey: ["candidatos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("candidatos")
        .select("*")
        .order("data_criacao", { ascending: false });
      if (error) throw error;
      return data as Candidato[];
    },
  });

  const filtered = candidatos.filter((c) => {
    const matchSearch = c.nome.toLowerCase().includes(search.toLowerCase());
    const matchArea = filterArea === "all" || c.area === filterArea;
    const matchCargo = filterCargo === "all" || c.cargo === filterCargo;
    return matchSearch && matchArea && matchCargo;
  });

  const areas = [...new Set(candidatos.map((c) => c.area))];
  const cargos = [...new Set(candidatos.map((c) => c.cargo))];

  const openDetails = async (c: Candidato) => {
    setSelected(c);
    setLoadingDetail(true);
    try {
      const [testRes, currRes] = await Promise.all([
        supabase.from("testes").select("pergunta, resposta, correta").eq("candidato_id", c.id),
        supabase.from("curriculos").select("arquivo_url").eq("candidato_id", c.id).maybeSingle(),
      ]);
      setTestes((testRes.data as TesteRow[]) || []);
      setCurriculo(currRes.data?.arquivo_url || null);
    } catch {
      setTestes([]);
      setCurriculo(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const getNotaColor = (nota: number | null) => {
    if (nota === null) return "secondary";
    if (nota >= 80) return "default";
    if (nota >= 60) return "outline";
    return "destructive";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg hero-gradient flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">Painel Admin</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="glass-card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterArea} onValueChange={setFilterArea}>
              <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Área" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as áreas</SelectItem>
                {areas.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterCargo} onValueChange={setFilterCargo}>
              <SelectTrigger className="w-full md:w-56"><SelectValue placeholder="Cargo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os cargos</SelectItem>
                {cargos.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total", value: candidatos.length },
            { label: "Nota ≥ 80%", value: candidatos.filter((c) => (c.nota ?? 0) >= 80).length },
            { label: "Áreas", value: areas.length },
            { label: "Cargos", value: cargos.length },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4 text-center">
              <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="glass-card-lg overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              Nenhum candidato encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Nota</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetails(c)}>
                      <TableCell className="font-medium">{c.nome}</TableCell>
                      <TableCell>{c.cargo}</TableCell>
                      <TableCell><Badge variant="outline">{c.area}</Badge></TableCell>
                      <TableCell>{c.nivel}</TableCell>
                      <TableCell>
                        <Badge variant={getNotaColor(c.nota)}>
                          {c.nota !== null ? `${c.nota}%` : "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(c.data_criacao).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">{selected.nome}</DialogTitle>
              </DialogHeader>
              {loadingDetail ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : (
                <div className="space-y-6 pt-2">
                  {/* Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {[
                      ["Email", selected.email],
                      ["Telefone", selected.telefone || "—"],
                      ["Cargo", selected.cargo],
                      ["Área", selected.area],
                      ["Nível", selected.nivel],
                      ["Nota", selected.nota !== null ? `${selected.nota}%` : "—"],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p className="text-muted-foreground text-xs uppercase tracking-wide">{label}</p>
                        <p className="font-medium text-foreground">{value}</p>
                      </div>
                    ))}
                  </div>

                  {selected.descricao && (
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Sobre</p>
                      <p className="text-foreground text-sm">{selected.descricao}</p>
                    </div>
                  )}
                  {selected.motivacao && (
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Motivação</p>
                      <p className="text-foreground text-sm">{selected.motivacao}</p>
                    </div>
                  )}

                  {/* Test results */}
                  {testes.length > 0 && (
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide mb-3">Respostas do teste</p>
                      <div className="space-y-2">
                        {testes.map((t, i) => (
                          <div key={i} className={`p-3 rounded-lg border text-sm ${t.correta ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"}`}>
                            <p className="font-medium text-foreground">{t.pergunta}</p>
                            <p className={t.correta ? "text-success" : "text-destructive"}>
                              {t.resposta} {t.correta ? "✓" : "✗"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resume */}
                  {curriculo && (
                    <a href={curriculo} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="gap-2 w-full">
                        <Download className="w-4 h-4" /> Baixar currículo
                      </Button>
                    </a>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
