import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowLeft } from "lucide-react";

const Confirmation = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="glass-card-lg p-10 md:p-14 text-center max-w-lg">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground mb-3">
          Candidatura enviada!
        </h1>
        <p className="text-muted-foreground mb-8">
          Seu cadastro, teste e currículo foram recebidos com sucesso.
          Nossa equipe analisará seu perfil e entrará em contato em breve.
        </p>
        <Link to="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Confirmation;
