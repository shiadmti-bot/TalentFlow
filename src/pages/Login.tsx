import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Briefcase, Lock, Mail, Eye, EyeOff } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    // Check if session expired
    if (searchParams.get("expired") === "true") {
      toast.error("Sessão expirada. Por favor, faça login novamente.");
    }
    
    // Check for remembered email
    const savedEmail = localStorage.getItem("admin_remember_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
    
    // If already logged in, redirect straight to admin
    const token = localStorage.getItem("admin_token");
    if (token) {
      navigate("/admin");
    }
  }, [searchParams, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Preencha todos os campos.");
      return;
    }

    setLoading(true);
    try {
      const data = await api.post<any>("/auth/login", { email, password });
      
      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_email", data.email);
      localStorage.setItem("admin_nome", data.nome);
      
      if (rememberMe) {
        localStorage.setItem("admin_remember_email", email.trim());
      } else {
        localStorage.removeItem("admin_remember_email");
      }

      toast.success("Login efetuado com sucesso!");
      navigate("/admin");
    } catch (err: any) {
      toast.error(err.message || "E-mail ou senha incorretos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-4">
        {/* Logo */}
        <div className="inline-flex w-12 h-12 rounded-2xl hero-gradient items-center justify-center shadow-lg shadow-primary/20">
          <Briefcase className="w-6 h-6 text-primary-foreground" />
        </div>
        <h2 className="font-display text-3xl font-extrabold text-accent">
          Painel Administrativo
        </h2>
        <p className="text-sm text-muted-foreground">
          Entre com suas credenciais para gerenciar candidatos e vagas
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="glass-card-lg p-8 md:p-10 card-hover-effect">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail Corporativo</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@talentflow.com"
                  className="pl-10 h-11 border-border/80 focus-visible:ring-primary/30"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha de Acesso</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-11 border-border/80 focus-visible:ring-primary/30"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="remember" 
                checked={rememberMe} 
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <Label htmlFor="remember" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                Lembrar e-mail
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-11 hero-gradient border-0 text-white hover:opacity-90 transition-opacity mt-2 font-semibold"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {loading ? "Entrando..." : "Acessar Painel"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
