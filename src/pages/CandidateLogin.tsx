import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { User, ArrowLeft, Loader2, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function CandidateLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if candidate is already logged in
    const token = localStorage.getItem("candidate_token");
    if (token) {
      navigate("/candidato/painel");
    }

    // Load saved email if rememberMe was active
    const savedEmail = localStorage.getItem("candidate_remember_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);
    try {
      const data = await api.post<any>("/auth/candidate/login", {
        email: email.trim(),
        password: password.trim(),
      });

      localStorage.setItem("candidate_token", data.token);
      localStorage.setItem("candidate_email", data.email);
      localStorage.setItem("candidate_nome", data.nome);

      if (rememberMe) {
        localStorage.setItem("candidate_remember_email", email.trim());
      } else {
        localStorage.removeItem("candidate_remember_email");
      }

      toast.success(`Bem-vindo de volta, ${data.nome}!`);
      navigate("/candidato/painel");
    } catch (err: any) {
      toast.error(err.message || "E-mail ou senha incorretos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Decorative Blur Circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md space-y-5 relative z-10">
        {/* Back Link */}
        <Link 
          to="/" 
          className="inline-flex items-center text-xs text-slate-400 hover:text-white transition-colors gap-1.5 bg-slate-900/50 hover:bg-slate-900 px-3 py-2 rounded-lg border border-white/5 backdrop-blur-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o início
        </Link>

        {/* Login Card */}
        <Card className="border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden card-hover-effect">
          {/* Top colored accent bar */}
          <div className="h-1.5 hero-gradient w-full" />
          
          <CardHeader className="text-center pt-8 pb-4 space-y-1">
            <div className="w-12 h-12 rounded-2xl hero-gradient flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-primary/20">
              <User className="w-6 h-6" />
            </div>
            <CardTitle className="font-display text-2xl font-black text-white">Portal do Candidato</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Acesse sua conta para ver suas candidaturas e finalizar testes
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300 text-xs font-semibold">E-mail de Cadastro</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    required
                    disabled={loading}
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-primary/40 focus-visible:border-primary/50"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-slate-300 text-xs font-semibold">Senha de Acesso</Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={loading}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-primary/40 focus-visible:border-primary/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center space-x-2 pt-1">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe} 
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  disabled={loading}
                  className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Label 
                  htmlFor="remember" 
                  className="text-xs font-medium text-slate-400 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none"
                >
                  Lembrar meu e-mail
                </Label>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pb-8 pt-2">
              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-11 hero-gradient border-0 text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 shadow-md shadow-primary/10 transition-opacity" 
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? "Entrando..." : "Entrar no Portal"}
              </Button>
              
              {/* Redirect to Application */}
              <div className="text-center text-xs text-slate-400">
                Ainda não tem cadastro?{" "}
                <Link to="/candidatar" className="text-white font-semibold underline hover:text-slate-200 transition-colors">
                  Candidate-se agora
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
