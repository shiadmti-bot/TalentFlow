import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  ClipboardCheck, 
  FileText, 
  ArrowRight, 
  Briefcase, 
  Target, 
  Award, 
  LogIn, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Cpu, 
  Coins, 
  Megaphone,
  Clock, 
  ShieldCheck, 
  HelpCircle,
  TrendingUp
} from "lucide-react";

const Index = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const recruitmentAreas = [
    {
      nome: "Tecnologia da Informação",
      desc: "Desenvolvimento de produtos digitais, análise de dados, interfaces e gestão ágil de projetos.",
      icon: Cpu,
      cargos: [
        "Desenvolvedor(a) Full Stack",
        "Analista de Dados",
        "Designer UX/UI",
        "Gerente de Projetos de TI"
      ],
      color: "bg-blue-500/10 text-blue-600 border-blue-200/50"
    },
    {
      nome: "Recursos Humanos",
      desc: "Gestão estratégica de pessoas, hunting de talentos, clima organizacional e departamento pessoal.",
      icon: Users,
      cargos: [
        "Analista de Recrutamento e Seleção",
        "Analista de Departamento Pessoal",
        "Business Partner (BP)"
      ],
      color: "bg-purple-500/10 text-purple-600 border-purple-200/50"
    },
    {
      nome: "Financeiro",
      desc: "Planejamento corporativo, análise tributária, tesouraria e controladoria estratégica.",
      icon: Coins,
      cargos: [
        "Analista de FP&A",
        "Analista de Tesouraria",
        "Analista Fiscal"
      ],
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-200/50"
    },
    {
      nome: "Vendas e Marketing",
      desc: "Atração de clientes de alta performance, tráfego pago, crescimento acelerado e inside sales.",
      icon: Megaphone,
      cargos: [
        "Analista de Growth Marketing",
        "Analista de Performance (Tráfego)",
        "Executivo(a) de Contas (SDR/Sales)"
      ],
      color: "bg-amber-500/10 text-amber-600 border-amber-200/50"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Inscrição Rápida",
      desc: "Selecione seus cargos de interesse e preencha suas informações básicas de forma simplificada."
    },
    {
      number: "02",
      title: "Desafio de Aptidão",
      desc: "Responda a 5 perguntas objetivas de nivelamento focadas no seu dia a dia profissional (tempo limite de 5 minutos)."
    },
    {
      number: "03",
      title: "Currículo & Conclusão",
      desc: "Faça upload do seu currículo em PDF/Word. Seu cadastro estará completo e pronto para análise imediata do nosso time."
    }
  ];

  const faqs = [
    {
      q: "O teste técnico é eliminatório?",
      a: "O teste serve para nivelamento técnico inicial e nos ajuda a identificar sua afinidade com as tecnologias ou rotinas do cargo. É parte importante da avaliação, mas não o único critério considerado."
    },
    {
      q: "Posso interromper ou refazer o teste técnico?",
      a: "Não é possível pausar ou reiniciar o teste após o início. Você terá um cronômetro na tela de 5 minutos. Se o tempo expirar ou a janela for fechada, as respostas selecionadas até o momento serão salvas e enviadas automaticamente."
    },
    {
      q: "Como acompanho o status da minha candidatura?",
      a: "Após realizar seu cadastro, você pode acessar o 'Portal do Candidato' utilizando seu e-mail e senha cadastrados para verificar o estágio do seu processo seletivo em tempo real."
    },
    {
      q: "Posso me candidatar para mais de uma vaga/área?",
      a: "Sim! Em nosso formulário de inscrição, você pode selecionar múltiplos cargos de interesse dentro da área escolhida para ampliar suas possibilidades de contratação."
    },
    {
      q: "O que acontece se eu não finalizar o teste ou upload do currículo?",
      a: "Seu cadastro constará como 'Cadastro Incompleto' em nosso painel administrativo. Você poderá fazer login no Portal do Candidato a qualquer momento para finalizar as etapas pendentes e entrar oficialmente no processo seletivo."
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <header className="border-b border-border/80 bg-card/65 backdrop-blur-md sticky top-0 z-50 transition-all">
        <div className="container mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl hero-gradient flex items-center justify-center shadow-md shadow-primary/15">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg font-extrabold text-accent leading-none">TalentFlow</span>
              <span className="text-[9px] text-muted-foreground font-semibold mt-0.5 tracking-wider uppercase">
                BC Gestão
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#como-funciona" className="hover:text-foreground transition-colors">Como Funciona</a>
            <a href="#areas" className="hover:text-foreground transition-colors">Áreas de Atuação</a>
            <a href="#faq" className="hover:text-foreground transition-colors">Dúvidas Frequentes</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden md:inline-block mr-2">
              <Button variant="outline" size="sm" className="text-xs h-9 gap-1.5 border-primary/30 text-primary hover:bg-primary/10 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> Área Administrativa
              </Button>
            </Link>

            <Link to="/candidato/login" className="hidden sm:inline-block">
              <Button variant="ghost" size="sm" className="text-xs h-9 gap-1.5 hover:bg-secondary/20 text-accent font-medium">
                <LogIn className="w-3.5 h-3.5" /> Portal do Candidato
              </Button>
            </Link>
            
            <Link to="/candidatar">
              <Button size="sm" className="hero-gradient border-0 text-white text-xs h-9 font-semibold hover:opacity-90 shadow-sm transition-all px-4">
                Candidatar-se
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 md:py-32 bg-gradient-to-b from-primary/5 via-transparent to-background border-b border-border/20">
        {/* Glowing Blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-10 right-10 w-[250px] h-[250px] bg-indigo-500/5 rounded-full blur-[70px] pointer-events-none" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              Banco de Talentos 2026
            </div>
            
            <h1 className="font-display text-4xl md:text-6xl font-black text-accent leading-tight tracking-tight max-w-3xl mx-auto">
              O caminho mais curto entre seu <span className="text-primary hero-gradient bg-clip-text text-transparent">talento</span> e sua nova vaga
            </h1>
            
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Candidate-se de forma ágil, faça um rápido teste técnico interativo e envie seu currículo. Acompanhe todas as etapas do seu processo em tempo real no seu portal.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3.5 justify-center pt-2 max-w-md mx-auto sm:max-w-none">
              <Link to="/candidatar" className="flex-1 sm:flex-initial">
                <Button size="lg" className="w-full sm:w-auto gap-2 hero-gradient border-0 text-white hover:opacity-95 shadow-md shadow-primary/10 font-bold text-sm px-7 h-12">
                  Iniciar Minha Candidatura
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              
              <Link to="/candidato/login" className="flex-1 sm:flex-initial">
                <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 text-accent border-border hover:bg-muted/50 font-bold text-sm px-7 h-12">
                  <LogIn className="w-4 h-4 text-primary" /> Acessar Meu Portal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="border-b border-border/40 bg-muted/20 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="flex items-start gap-4 p-4 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-accent text-sm">Processo Rápido</h3>
                <p className="text-muted-foreground text-xs mt-1 leading-relaxed">Conclua sua candidatura em cerca de 10 minutos, sem burocracia desnecessária.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0 text-indigo-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-accent text-sm">Transparência Integral</h3>
                <p className="text-muted-foreground text-xs mt-1 leading-relaxed">Veja exatamente em qual estágio o recrutador está analisando seu perfil em tempo real.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-accent text-sm">Feedback no Teste</h3>
                <p className="text-muted-foreground text-xs mt-1 leading-relaxed">Resultado automatizado do teste de conhecimentos gerais/específicos imediatamente.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona Section */}
      <section id="como-funciona" className="container mx-auto px-4 py-20 md:py-28 border-b border-border/20">
        <div className="text-center max-w-xl mx-auto mb-16 space-y-2">
          <h2 className="font-display text-3xl font-extrabold text-accent">Como funciona o processo?</h2>
          <p className="text-muted-foreground text-sm">Completando estas três etapas simples você entra no nosso radar de contratações:</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
          {steps.map((step, idx) => (
            <div key={step.number} className="relative group">
              <div className="glass-card-lg p-8 rounded-2xl border border-border/80 bg-card hover:border-primary/20 transition-all hover:scale-[1.02] shadow-sm hover:shadow-md relative z-10 h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-display text-4xl font-black hero-gradient bg-clip-text text-transparent opacity-85">
                      {step.number}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center">
                      {idx === 0 && <Users className="w-4 h-4 text-primary" />}
                      {idx === 1 && <ClipboardCheck className="w-4 h-4 text-primary" />}
                      {idx === 2 && <FileText className="w-4 h-4 text-primary" />}
                    </div>
                  </div>
                  <h3 className="font-display text-lg font-bold text-accent">{step.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">{step.desc}</p>
                </div>
              </div>
              {idx < 2 && (
                <div className="hidden md:block absolute top-1/2 -right-4 -translate-y-1/2 z-0 pointer-events-none">
                  <ArrowRight className="w-8 h-8 text-border/60" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Areas de Atuação Section */}
      <section id="areas" className="bg-muted/10 py-20 md:py-28 border-b border-border/20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-2">
            <h2 className="font-display text-3xl font-extrabold text-accent">Nossas Áreas de Recrutamento</h2>
            <p className="text-muted-foreground text-sm">Temos oportunidades contínuas e bancos de talentos para as seguintes verticais:</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {recruitmentAreas.map((area) => {
              const IconComp = area.icon;
              return (
                <div key={area.nome} className="glass-card-lg p-6 md:p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 flex flex-col justify-between group">
                  <div className="space-y-5">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${area.color} group-hover:scale-105 transition-transform`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <h3 className="font-display text-xl font-bold text-accent">{area.nome}</h3>
                    </div>
                    
                    <p className="text-muted-foreground text-xs leading-relaxed">{area.desc}</p>
                    
                    <div className="space-y-2">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Cargos Atendidos</p>
                      <div className="flex flex-wrap gap-2">
                        {area.cargos.map((cargo) => (
                          <span key={cargo} className="text-[10px] px-2.5 py-1 rounded-lg bg-muted border border-border/70 text-accent font-medium">
                            {cargo}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-border/50 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                      <ClipboardCheck className="w-3.5 h-3.5 text-primary" /> Teste de 5 questões incluído
                    </span>
                    <Link to="/candidatar" className="text-primary font-semibold hover:underline inline-flex items-center gap-1">
                      Candidatar-se <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="container mx-auto px-4 py-20 md:py-28 flex-grow">
        <div className="text-center max-w-xl mx-auto mb-16 space-y-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h2 className="font-display text-3xl font-extrabold text-accent">Dúvidas Frequentes</h2>
          <p className="text-muted-foreground text-sm">Respostas para as principais perguntas dos candidatos:</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div 
                key={idx} 
                className="border border-border/80 rounded-xl bg-card overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-semibold text-accent hover:bg-muted/40 transition-colors text-sm md:text-base"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-primary flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                
                {isOpen && (
                  <div className="px-5 pb-4 text-xs md:text-sm text-muted-foreground leading-relaxed border-t border-border/20 pt-3 bg-muted/10 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Final */}
      <section className="container mx-auto px-4 pb-20">
        <div className="hero-gradient rounded-3xl p-10 md:p-14 text-center text-white relative overflow-hidden shadow-xl shadow-primary/10">
          {/* Decorative shapes */}
          <div className="absolute inset-0 bg-white/5 opacity-10 mix-blend-overlay" />
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-black/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <Award className="w-12 h-12 mx-auto opacity-90 animate-bounce" />
            <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">Pronto para dar o próximo passo?</h2>
            <p className="text-white/80 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
              Junte-se à equipe BC Gestão. Seu cadastro rápido é o início de uma grande jornada profissional.
            </p>
            <div className="flex flex-col sm:flex-row gap-3.5 justify-center pt-4 max-w-xs sm:max-w-none mx-auto">
              <Link to="/candidatar">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto gap-2 bg-white text-primary hover:bg-white/95 font-bold shadow-md shadow-black/5 text-sm h-12 px-8">
                  Iniciar Inscrição
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              
              <Link to="/candidato/login">
                <Button size="lg" className="w-full sm:w-auto gap-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 text-white border border-white/25 font-bold text-sm h-12 px-8">
                  Acessar Meu Portal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-10 mt-auto">
        <div className="container mx-auto px-4 text-center space-y-3.5">
          <div className="flex items-center justify-center gap-1.5">
            <Briefcase className="w-4 h-4 text-primary" />
            <span className="font-display font-bold text-accent text-sm">TalentFlow Suite</span>
            <span className="text-[10px] text-muted-foreground border-l border-border pl-2 ml-1">BC Gestão</span>
          </div>
          
          <p className="text-muted-foreground text-xs leading-relaxed max-w-md mx-auto">
            Plataforma corporativa de atração, avaliação técnica e gestão unificada de candidatos.
          </p>

          <div className="flex items-center justify-center gap-4 text-xs font-semibold text-muted-foreground pt-2">
            <Link to="/candidato/login" className="hover:text-primary transition-colors">Portal do Candidato</Link>
            <span className="text-border/60">•</span>
            <Link to="/login" className="hover:text-primary transition-colors">Painel Administrativo</Link>
          </div>

          <div className="text-[10px] text-muted-foreground/60 pt-4 border-t border-border/50 max-w-lg mx-auto">
            © 2026 TalentFlow Suite. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
