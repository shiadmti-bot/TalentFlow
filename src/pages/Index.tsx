import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, ClipboardCheck, FileText, ArrowRight, Briefcase, Target, Award } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg hero-gradient flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">TalentFlow</span>
          </div>
          <Link to="/admin">
            <Button variant="outline" size="sm">Painel Admin</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="hero-gradient absolute inset-0 opacity-5" />
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium">
              <Target className="w-4 h-4" />
              Plataforma de Recrutamento
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground leading-tight">
              Encontre sua próxima{" "}
              <span className="text-primary">oportunidade</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Cadastre-se, realize o teste de aptidão e envie seu currículo.
              Processo simples, rápido e transparente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/candidatar">
                <Button size="lg" className="gap-2 hero-gradient border-0 text-primary-foreground hover:opacity-90 transition-opacity">
                  Candidatar-se agora
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold text-foreground">Como funciona</h2>
          <p className="text-muted-foreground mt-2">Processo simples em 3 etapas</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { icon: Users, title: "1. Cadastro", desc: "Preencha seus dados pessoais e escolha a vaga desejada." },
            { icon: ClipboardCheck, title: "2. Teste", desc: "Responda perguntas de múltipla escolha sobre sua área." },
            { icon: FileText, title: "3. Currículo", desc: "Envie seu currículo em PDF ou DOC para completar." },
          ].map((step) => (
            <div key={step.title} className="glass-card-lg p-8 text-center space-y-4 hover:scale-[1.02] transition-transform">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <step.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground">{step.title}</h3>
              <p className="text-muted-foreground text-sm">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="hero-gradient rounded-2xl p-12 text-center text-primary-foreground">
          <Award className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h2 className="font-display text-3xl font-bold mb-4">Pronto para começar?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">
            Junte-se a centenas de profissionais que já encontraram sua vaga ideal.
          </p>
          <Link to="/candidatar">
            <Button size="lg" variant="secondary" className="gap-2">
              Iniciar candidatura
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-muted-foreground text-sm">
        <p>© 2026 TalentFlow. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default Index;
