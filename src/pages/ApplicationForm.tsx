import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const cargos = [
  "Desenvolvedor Frontend",
  "Desenvolvedor Backend",
  "Desenvolvedor Full Stack",
  "Analista de Dados",
  "Analista de RH",
  "Analista Financeiro",
  "Gerente de Marketing",
  "Designer UX/UI",
  "Gerente de Projetos",
  "Analista de Suporte",
];

const areas = ["TI", "RH", "Financeiro", "Marketing"];
const niveis = ["Júnior", "Pleno", "Sênior"];

const ApplicationForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    cargo: "",
    area: "",
    nivel: "",
    descricao: "",
    motivacao: "",
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.nome.trim()) newErrors.nome = "Nome é obrigatório";
    if (!form.email.trim()) newErrors.email = "Email é obrigatório";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Email inválido";
    if (!form.cargo) newErrors.cargo = "Selecione um cargo";
    if (!form.area) newErrors.area = "Selecione uma área";
    if (!form.nivel) newErrors.nivel = "Selecione um nível";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("candidatos")
        .insert({
          nome: form.nome.trim(),
          email: form.email.trim(),
          telefone: form.telefone.trim() || null,
          cargo: form.cargo,
          area: form.area,
          nivel: form.nivel,
          descricao: form.descricao.trim() || null,
          motivacao: form.motivacao.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success("Cadastro realizado com sucesso!");
      navigate(`/teste/${data.id}?area=${encodeURIComponent(form.area)}`);
    } catch (err: any) {
      toast.error("Erro ao cadastrar: " + (err.message || "Tente novamente."));
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>

        <div className="glass-card-lg p-8 md:p-10">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground">Candidatura</h1>
            <p className="text-muted-foreground mt-1">Preencha seus dados para iniciar o processo</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo *</Label>
                <Input id="nome" value={form.nome} onChange={(e) => updateField("nome", e.target.value)} placeholder="Seu nome completo" />
                {errors.nome && <p className="text-destructive text-sm">{errors.nome}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="seu@email.com" />
                {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" value={form.telefone} onChange={(e) => updateField("telefone", e.target.value)} placeholder="(11) 99999-9999" />
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label>Cargo pretendido *</Label>
                <Select value={form.cargo} onValueChange={(v) => updateField("cargo", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {cargos.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.cargo && <p className="text-destructive text-sm">{errors.cargo}</p>}
              </div>
              <div className="space-y-2">
                <Label>Área *</Label>
                <Select value={form.area} onValueChange={(v) => updateField("area", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {areas.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.area && <p className="text-destructive text-sm">{errors.area}</p>}
              </div>
              <div className="space-y-2">
                <Label>Nível *</Label>
                <Select value={form.nivel} onValueChange={(v) => updateField("nivel", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {niveis.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.nivel && <p className="text-destructive text-sm">{errors.nivel}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Fale sobre você</Label>
              <Textarea id="descricao" value={form.descricao} onChange={(e) => updateField("descricao", e.target.value)} placeholder="Conte um pouco sobre sua experiência..." rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivacao">Por que deseja essa vaga?</Label>
              <Textarea id="motivacao" value={form.motivacao} onChange={(e) => updateField("motivacao", e.target.value)} placeholder="O que te motiva a se candidatar..." rows={3} />
            </div>

            <Button type="submit" className="w-full hero-gradient border-0 text-primary-foreground hover:opacity-90" size="lg" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {loading ? "Enviando..." : "Continuar para o teste"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;
