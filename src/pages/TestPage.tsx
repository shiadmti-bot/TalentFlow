import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Loader2, Clock, AlertTriangle, ShieldCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Question {
  id: string;
  pergunta: string;
  opcoes: string[];
}

const TestPage = () => {
  const { candidatoId } = useParams<{ candidatoId: string }>();
  const [searchParams] = useSearchParams();
  const areaName = searchParams.get("area") || "TI";
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompletedBefore, setTestCompletedBefore] = useState(false);
  
  // Timer settings: 5 minutes (300 seconds)
  const [timeLeft, setTimeLeft] = useState(300);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch candidate details and check if already completed
  useEffect(() => {
    if (!candidatoId) return;

    const loadData = async () => {
      try {
        const cand = await api.get<any>(`/candidates/${candidatoId}`);
        setCandidate(cand);
        
        if (cand.testAnswers && cand.testAnswers.length > 0) {
          setTestCompletedBefore(true);
          setLoadingInitial(false);
          return;
        }

        const quests = await api.get<Question[]>(`/tests/questions/${candidatoId}`);
        setQuestions(quests);
        setAnswers(new Array(quests.length).fill(null));
      } catch (err: any) {
        toast.error("Erro ao carregar dados do teste: " + err.message);
      } finally {
        setLoadingInitial(false);
      }
    };

    loadData();
  }, [candidatoId]);

  // Handle countdown timer
  useEffect(() => {
    if (testStarted && !loadingSubmit && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [testStarted, timeLeft, loadingSubmit]);

  const handleStartTest = () => {
    setTestStarted(true);
    toast.success("Teste iniciado! Boa sorte.");
  };

  const handleSelect = (optionIndex: number) => {
    const updated = [...answers];
    updated[currentIndex] = optionIndex;
    setAnswers(updated);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const submitTestAnswers = async (finalAnswers: (number | null)[]) => {
    setLoadingSubmit(true);
    if (timerRef.current) clearInterval(timerRef.current);
    
    try {
      // Map all questions, using -1 for unanswered in case of timeout
      const payload = {
        answers: questions.map((q, i) => ({
          questionId: q.id,
          selectedIndex: finalAnswers[i] !== null ? finalAnswers[i]! : -1,
        })),
      };

      const result = await api.post<any>(`/tests/submit/${candidatoId}`, payload);
      try {
        await api.post(`/candidates/${candidatoId}/finalize`);
      } catch (err) {
        console.error("Erro ao finalizar cadastro:", err);
      }
      toast.success(`Teste concluído! Nota final: ${result.nota}%`);
      navigate("/confirmacao");
    } catch (err: any) {
      toast.error("Erro ao enviar teste: " + (err.message || "Tente novamente."));
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleAutoSubmit = () => {
    toast.error("Tempo esgotado! Enviando suas respostas automaticamente...");
    submitTestAnswers(answers);
  };

  const handleSubmit = () => {
    if (answers.some((a) => a === null)) {
      toast.error("Responda todas as perguntas antes de finalizar.");
      return;
    }
    submitTestAnswers(answers);
  };

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Carregando informações...</p>
        </div>
      </div>
    );
  }

  // Pre-test block: Candidate already completed this test
  if (testCompletedBefore) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="glass-card-lg p-10 max-w-md text-center space-y-5 border-secondary/20 card-hover-effect">
          <div className="w-16 h-16 rounded-full bg-secondary/15 flex items-center justify-center mx-auto text-secondary">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="font-display text-2xl font-bold text-accent">Teste já Concluído</h2>
          <p className="text-muted-foreground text-sm">
            Olá, <strong className="text-foreground">{candidate?.nome}</strong>. Nosso sistema registrou que você já concluiu a avaliação técnica para a vaga de <strong className="text-foreground">{candidate?.cargo?.nome}</strong>.
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={async () => {
              try {
                await api.post(`/candidates/${candidatoId}/finalize`);
                navigate("/confirmacao");
              } catch (err) {
                toast.error("Erro ao avançar.");
              }
            }} className="w-full hero-gradient border-0 text-white h-11">
              Ir para Confirmação
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="glass-card-lg p-8 max-w-md text-center space-y-4 border-secondary/20">
          <h2 className="font-display text-xl font-bold text-accent">Sem perguntas cadastradas</h2>
          <p className="text-muted-foreground text-sm">
            Não encontramos perguntas cadastradas para o cargo de <strong>{candidate?.cargo?.nome}</strong> no momento.
          </p>
          <Button onClick={async () => {
            try {
              await api.post(`/candidates/${candidatoId}/finalize`);
              navigate("/confirmacao");
            } catch (err) {
              toast.error("Erro ao avançar.");
            }
          }} className="w-full hero-gradient border-0 text-white h-11">
            Avançar para Confirmação
          </Button>
        </div>
      </div>
    );
  }

  // Pre-test block: Show rules and let candidate click start
  if (!testStarted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="glass-card-lg p-8 md:p-10 max-w-lg space-y-6 card-hover-effect">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Avaliação de Aptidão</span>
            <h1 className="font-display text-3xl font-bold text-accent">Preparado para o teste?</h1>
            <p className="text-muted-foreground text-sm">
              Olá {candidate?.nome}, sua vaga requer um teste de aptidão inicial para a área de <strong>{areaName}</strong>.
            </p>
          </div>

          <div className="border rounded-xl p-5 space-y-3 bg-card/50 text-sm">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" /> Regras da Avaliação:
            </h3>
            <ul className="space-y-2 text-muted-foreground list-disc pl-5">
              <li>O teste contém exatamente <strong>{questions.length} questões</strong> de múltipla escolha.</li>
              <li>Você terá um tempo limite total de <strong>5 minutos (05:00)</strong> para concluir o teste.</li>
              <li>Se o tempo acabar, suas respostas selecionadas serão **enviadas automaticamente**.</li>
              <li>Não recarregue a página durante a execução do teste, ou perderá o progresso.</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate(-1)} className="flex-1 h-11">
              Voltar
            </Button>
            <Button onClick={handleStartTest} className="flex-1 h-11 hero-gradient border-0 text-white hover:opacity-90">
              Iniciar Teste
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Active test layout
  const current = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isTimeUrgent = timeLeft < 60;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => {
              if (confirm("Se sair agora, seu progresso será perdido. Deseja sair?")) {
                navigate(-1);
              }
            }} 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Abandonar teste
          </button>

          {/* Visual Timer */}
          <div className={`flex items-center gap-2 border px-3 py-1.5 rounded-full font-mono text-sm font-semibold backdrop-blur-sm transition-all duration-300 ${
            isTimeUrgent 
              ? "border-red-200 bg-red-50 text-red-600 animate-pulse scale-105" 
              : "border-border bg-card text-foreground"
          }`}>
            {isTimeUrgent ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <Clock className="w-4 h-4 text-primary" />}
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="glass-card-lg p-8 md:p-10 card-hover-effect">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="font-display text-2xl font-bold text-accent">Questão {currentIndex + 1} de {questions.length}</h1>
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{areaName}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="space-y-6">
            <h2 className="text-lg font-medium text-foreground leading-relaxed">{current.pergunta}</h2>

            <div className="space-y-3">
              {current.opcoes.map((opcao, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    answers[currentIndex] === i
                      ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                      : "border-border hover:border-secondary/40 bg-card"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      answers[currentIndex] === i ? "border-primary bg-primary" : "border-muted-foreground/30"
                    }`}>
                      {answers[currentIndex] === i && <CheckCircle2 className="w-4 h-4 text-primary-foreground" />}
                    </div>
                    <span className="text-foreground font-medium text-sm">{opcao}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0}>
                Anterior
              </Button>
              
              {currentIndex < questions.length - 1 ? (
                <Button 
                  onClick={handleNext} 
                  disabled={answers[currentIndex] === null}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  Próxima
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  disabled={loadingSubmit || answers.some((a) => a === null)} 
                  className="hero-gradient border-0 text-white hover:opacity-90 transition-opacity"
                >
                  {loadingSubmit ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {loadingSubmit ? "Enviando..." : "Finalizar teste"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
