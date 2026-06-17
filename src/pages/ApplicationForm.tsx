import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2, User, MapPin, Briefcase, FileText, Check } from "lucide-react";
import { Link } from "react-router-dom";


const niveis = ["Júnior", "Pleno", "Sênior"];

interface Area {
  id: string;
  nome: string;
  cargos: Cargo[];
}

interface Cargo {
  id: string;
  nome: string;
  areaId: string;
}

const ApplicationForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [areas, setAreas] = useState<Area[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  
  const [form, setForm] = useState({
    nome: "",
    email: "",
    password: "",
    cpf: "",
    dataNascimento: "",
    telefone: "",
    cep: "",
    endereco: "",
    bairro: "",
    cidade: "",
    estado: "",
    cargos: [] as string[],
    area: "",
    nivel: "",
    descricao: "",
    motivacao: "",
  });


  // Fetch Areas and Cargos dynamically
  useEffect(() => {
    api.get<Area[]>("/areas")
      .then((data) => setAreas(data))
      .catch((err: any) => {
        toast.error("Erro ao carregar áreas da vaga: " + err.message);
      });
  }, []);

  // Update cargos when selected area changes
  useEffect(() => {
    if (form.area) {
      const selectedAreaObj = areas.find((a) => a.id === form.area);
      if (selectedAreaObj) {
        const newCargosList = selectedAreaObj.cargos || [];
        // Only update cargos list state if it actually changed
        setCargos((prev) => {
          const isSame = prev.length === newCargosList.length && prev.every((val, i) => val.id === newCargosList[i]?.id);
          return isSame ? prev : newCargosList;
        });
        
        // Reset selected cargos that don't belong to the new area
        setForm((prev) => {
          const filtered = prev.cargos.filter((id) => newCargosList.some((c) => c.id === id));
          const isSame = prev.cargos.length === filtered.length && prev.cargos.every((val, i) => val === filtered[i]);
          return isSame ? prev : { ...prev, cargos: filtered };
        });
      }
    } else {
      setCargos((prev) => (prev.length === 0 ? prev : []));
      setForm((prev) => (prev.cargos.length === 0 ? prev : { ...prev, cargos: [] }));
    }
  }, [form.area, areas]);

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};
    
    if (currentStep === 1) {
      if (!form.nome.trim()) newErrors.nome = "Nome completo é obrigatório";
      if (!form.email.trim()) newErrors.email = "Email é obrigatório";
      else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(form.email)) newErrors.email = "Email inválido";
      if (!form.password) newErrors.password = "Senha é obrigatória";
      else if (form.password.length < 6) newErrors.password = "A senha deve ter pelo menos 6 caracteres";
      if (!form.cpf.trim() || form.cpf.replace(/\D/g, '').length !== 11) newErrors.cpf = "CPF inválido";
      if (!form.dataNascimento) newErrors.dataNascimento = "Data de nascimento é obrigatória";
    }
    
    if (currentStep === 3) {
      if (!form.area) newErrors.area = "Selecione uma área";
      if (!form.cargos || form.cargos.length === 0) newErrors.cargo = "Selecione pelo menos um cargo";
      if (!form.nivel) newErrors.nivel = "Selecione um nível";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    // If we're somehow already past or at the final step, don't advance
    if (step >= 4) return;
    
    if (validateStep(step)) {
      // Use Math.min to guarantee it never exceeds step 4 even on rapid double clicks
      setStep((prev) => Math.min(prev + 1, 4));
    } else {
      toast.error("Por favor, corrija os erros do formulário.");
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent accidental submission if the user presses Enter on an earlier step
    if (step !== 4) {
      handleNext();
      return;
    }
    
    if (!validateStep(4)) return;

    setLoading(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        email: form.email.trim(),
        password: form.password,
        cpf: form.cpf.replace(/\D/g, ''),
        dataNascimento: form.dataNascimento,
        telefone: form.telefone.trim() || null,
        endereco: form.endereco.trim() || null,
        bairro: form.bairro.trim() || null,
        cidade: form.cidade.trim() || null,
        estado: form.estado.trim() || null,
        nivel: form.nivel,
        areaId: form.area,
        cargoId: form.cargos[0] || "",
        cargoIds: form.cargos,
        descricao: form.descricao.trim() || null,
        motivacao: form.motivacao.trim() || null,
      };

      const response = await api.post<any>("/candidates", payload);

      toast.success("Cadastro realizado com sucesso!");
      
      // Navigate to resume upload first, then test
      const selectedAreaObj = areas.find((a) => a.id === form.area);
      const areaName = selectedAreaObj ? selectedAreaObj.nome : "TI";
      navigate(`/curriculo/${response.id}?area=${encodeURIComponent(areaName)}`);
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

  const handleCEPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    
    // Mask: 00000-000
    let formattedVal = rawVal;
    if (rawVal.length > 5) {
      formattedVal = `${rawVal.slice(0, 5)}-${rawVal.slice(5, 8)}`;
    }
    
    setForm((prev) => ({ ...prev, cep: formattedVal }));
    if (errors.cep) setErrors((prev) => ({ ...prev, cep: "" }));

    if (rawVal.length === 8) {
      setLoadingCEP(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${rawVal}/json/`);
        const data = await res.json();
        
        if (data.erro) {
          toast.error("CEP não encontrado.");
          setErrors((prev) => ({ ...prev, cep: "CEP não encontrado" }));
        } else {
          setForm((prev) => ({
            ...prev,
            endereco: data.logradouro || "",
            bairro: data.bairro || "",
            cidade: data.localidade || "",
            estado: data.uf || "",
          }));
          toast.success("Endereço preenchido automaticamente!");
        }
      } catch (err) {
        toast.error("Erro ao buscar CEP. Preencha manualmente.");
      } finally {
        setLoadingCEP(false);
      }
    }
  };

  // Step Indicators data
  const steps = [
    { num: 1, label: "Identificação", icon: User },
    { num: 2, label: "Endereço", icon: MapPin },
    { num: 3, label: "Vaga", icon: Briefcase },
    { num: 4, label: "Perfil", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar ao início
        </Link>

        {/* Step Indicator Bar */}
        <div className="flex justify-between items-center mb-8 bg-card/40 border p-4 rounded-2xl backdrop-blur-sm">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isActive = step === s.num;
            const isCompleted = step > s.num;
            return (
              <div key={s.num} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5 relative">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isActive 
                      ? "border-primary bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/20"
                      : isCompleted
                        ? "border-secondary bg-secondary text-secondary-foreground"
                        : "border-border bg-card text-muted-foreground"
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[10px] md:text-xs font-semibold ${isActive ? "text-primary" : isCompleted ? "text-secondary" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`h-[2px] flex-1 mx-2 transition-all duration-500 ${
                    step > s.num ? "bg-secondary" : "bg-border"
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="glass-card-lg p-8 md:p-10 card-hover-effect">
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Passo {step} de 4
            </span>
            <h1 className="font-display text-3xl font-bold text-accent mt-0.5">
              {step === 1 && "Informações Pessoais"}
              {step === 2 && "Dados de Localização"}
              {step === 3 && "Vaga Pretendida"}
              {step === 4 && "Perfil Profissional"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {step === 1 && "Precisamos do seu contato inicial para nos comunicarmos."}
              {step === 2 && "Insira seu endereço (todos os campos abaixo são opcionais)."}
              {step === 3 && "Selecione a área profissional e cargo que deseja concorrer."}
              {step === 4 && "Conte-nos suas motivações e suas experiências na área."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* STEP 1: PERSONAL INFO */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome completo *</Label>
                  <Input 
                    id="nome" 
                    value={form.nome} 
                    onChange={(e) => updateField("nome", e.target.value)} 
                    placeholder="Seu nome completo" 
                    className="h-11 border-border/80 focus-visible:ring-primary/30"
                    autoComplete="name"
                  />
                  {errors.nome && <p className="text-destructive text-xs font-medium">{errors.nome}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={form.email} 
                    onChange={(e) => updateField("email", e.target.value)} 
                    placeholder="seu@email.com" 
                    className="h-11 border-border/80 focus-visible:ring-primary/30"
                    autoComplete="email"
                  />
                  {errors.email && <p className="text-destructive text-xs font-medium">{errors.email}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input 
                      id="cpf" 
                      value={form.cpf} 
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, "");
                        if (val.length > 11) val = val.slice(0, 11);
                        let formatted = val;
                        if (val.length > 9) {
                          formatted = val.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
                        } else if (val.length > 6) {
                          formatted = val.replace(/(\d{3})(\d{3})(\d{3})/, "$1.$2.$3");
                        } else if (val.length > 3) {
                          formatted = val.replace(/(\d{3})(\d{3})/, "$1.$2");
                        }
                        updateField("cpf", formatted);
                      }} 
                      placeholder="000.000.000-00" 
                      className="h-11 border-border/80 focus-visible:ring-primary/30"
                    />
                    {errors.cpf && <p className="text-destructive text-xs font-medium">{errors.cpf}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
                    <Input 
                      id="dataNascimento" 
                      type="date"
                      value={form.dataNascimento} 
                      onChange={(e) => updateField("dataNascimento", e.target.value)} 
                      className="h-11 border-border/80 focus-visible:ring-primary/30"
                    />
                    {errors.dataNascimento && <p className="text-destructive text-xs font-medium">{errors.dataNascimento}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Crie uma Senha *</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={form.password} 
                    onChange={(e) => updateField("password", e.target.value)} 
                    placeholder="Mínimo 6 caracteres (para acessar o portal)" 
                    className="h-11 border-border/80 focus-visible:ring-primary/30"
                    autoComplete="new-password"
                  />
                  {errors.password && <p className="text-destructive text-xs font-medium">{errors.password}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone / WhatsApp</Label>
                  <Input 
                    id="telefone" 
                    value={form.telefone} 
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, "");
                      if (val.length > 11) val = val.slice(0, 11);
                      let formatted = val;
                      if (val.length > 2) {
                        formatted = `(${val.slice(0, 2)}) ${val.slice(2)}`;
                      }
                      if (val.length > 7) {
                        formatted = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
                      }
                      updateField("telefone", formatted);
                    }} 
                    placeholder="(11) 99999-9999" 
                    className="h-11 border-border/80 focus-visible:ring-primary/30"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: ADDRESS */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="relative">
                    <Input 
                      id="cep" 
                      value={form.cep} 
                      onChange={handleCEPChange} 
                      placeholder="00000-000" 
                      maxLength={9}
                      className="h-11 border-border/80 focus-visible:ring-primary/30 pr-10"
                    />
                    {loadingCEP && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
                    )}
                  </div>
                  {errors.cep && <p className="text-destructive text-xs font-medium">{errors.cep}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endereco">Logradouro (Rua, Av, Número)</Label>
                  <Input 
                    id="endereco" 
                    value={form.endereco} 
                    onChange={(e) => updateField("endereco", e.target.value)} 
                    placeholder="Rua Exemplo, 123 - Apto 4" 
                    className="h-11 border-border/80 focus-visible:ring-primary/30"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input 
                      id="bairro" 
                      value={form.bairro} 
                      onChange={(e) => updateField("bairro", e.target.value)} 
                      placeholder="Seu bairro" 
                      className="h-11 border-border/80 focus-visible:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input 
                      id="cidade" 
                      value={form.cidade} 
                      onChange={(e) => updateField("cidade", e.target.value)} 
                      placeholder="Sua cidade" 
                      className="h-11 border-border/80 focus-visible:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Input 
                      id="estado" 
                      value={form.estado} 
                      onChange={(e) => updateField("estado", e.target.value)} 
                      placeholder="SP, RJ, BA, etc." 
                      className="h-11 border-border/80 focus-visible:ring-primary/30"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: JOB & AREA */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-2">
                  <Label>Área de Atuação *</Label>
                  <Select value={form.area} onValueChange={(v) => updateField("area", v)}>
                    <SelectTrigger className="h-11 border-border/80"><SelectValue placeholder="Selecione a Área" /></SelectTrigger>
                    <SelectContent>
                      {areas.map((a) => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.area && <p className="text-destructive text-xs font-medium">{errors.area}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Cargos Pretendidos * (Selecione um ou mais)</Label>
                  {!form.area ? (
                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border border-dashed text-center">
                      Selecione a área de atuação primeiro para ver as vagas
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border p-4 rounded-xl bg-card/40 backdrop-blur-sm max-h-[200px] overflow-y-auto pr-2">
                      {cargos.map((c) => {
                        const isChecked = form.cargos.includes(c.id);
                        return (
                          <div
                            key={c.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              const newCargos = isChecked
                                ? form.cargos.filter((id) => id !== c.id)
                                : [...form.cargos, c.id];
                              setForm((prev) => ({ ...prev, cargos: newCargos }));
                              if (errors.cargo) setErrors((prev) => ({ ...prev, cargo: "" }));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                const newCargos = isChecked
                                  ? form.cargos.filter((id) => id !== c.id)
                                  : [...form.cargos, c.id];
                                setForm((prev) => ({ ...prev, cargos: newCargos }));
                                if (errors.cargo) setErrors((prev) => ({ ...prev, cargo: "" }));
                              }
                            }}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none ${
                              isChecked
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-border/60 hover:bg-muted/10 hover:border-primary/30"
                            }`}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                              isChecked
                                ? "bg-primary border-primary"
                                : "border-muted-foreground/30"
                            }`}>
                              {isChecked && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className="text-xs font-semibold text-accent flex-1 leading-snug">
                              {c.nome}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {errors.cargo && <p className="text-destructive text-xs font-medium">{errors.cargo}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Nível de Senioridade *</Label>
                  <Select value={form.nivel} onValueChange={(v) => updateField("nivel", v)}>
                    <SelectTrigger className="h-11 border-border/80"><SelectValue placeholder="Selecione o Nível" /></SelectTrigger>
                    <SelectContent>
                      {niveis.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.nivel && <p className="text-destructive text-xs font-medium">{errors.nivel}</p>}
                </div>
              </div>
            )}

            {/* STEP 4: PERFIL & MOTIVACAO */}
            {step === 4 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="descricao">Fale sobre você (sua experiência, hobbies, pontos fortes)</Label>
                  <Textarea 
                    id="descricao" 
                    value={form.descricao} 
                    onChange={(e) => updateField("descricao", e.target.value)} 
                    placeholder="Tenho x anos de mercado, atuo principalmente em..." 
                    rows={4} 
                    className="border-border/80 focus-visible:ring-primary/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motivacao">Por que deseja essa vaga na nossa empresa?</Label>
                  <Textarea 
                    id="motivacao" 
                    value={form.motivacao} 
                    onChange={(e) => updateField("motivacao", e.target.value)} 
                    placeholder="Desejo fazer parte do time porque me identifico com..." 
                    rows={4} 
                    className="border-border/80 focus-visible:ring-primary/30"
                  />
                </div>
              </div>
            )}

            {/* Form Navigation Controls */}
            <div className="flex gap-4 pt-4 border-t">
              {step > 1 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleBack} 
                  className="flex-1 h-11"
                  disabled={loading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                </Button>
              )}
              
              {step < 4 ? (
                <Button 
                  type="button" 
                  onClick={handleNext} 
                  className="flex-1 h-11 hero-gradient border-0 text-white hover:opacity-90 transition-opacity"
                >
                  Avançar <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  className="flex-1 h-11 hero-gradient border-0 text-white hover:opacity-90 transition-opacity" 
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {loading ? "Enviando..." : "Continuar para o teste"}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;
