import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { questionsByArea } from "@/data/questionsData";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const TestPage = () => {
  const { candidatoId } = useParams<{ candidatoId: string }>();
  const [searchParams] = useSearchParams();
  const area = searchParams.get("area") || "TI";
  const navigate = useNavigate();

  const questions = questionsByArea[area] || questionsByArea["TI"];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async () => {
    if (answers.some((a) => a === null)) {
      toast.error("Responda todas as perguntas antes de enviar.");
      return;
    }

    setLoading(true);
    try {
      const testRows = questions.map((q, i) => ({
        candidato_id: candidatoId!,
        pergunta: q.pergunta,
        resposta: q.opcoes[answers[i]!],
        correta: answers[i] === q.correta,
      }));

      const { error: testError } = await supabase.from("testes").insert(testRows);
      if (testError) throw testError;

      const correctCount = testRows.filter((r) => r.correta).length;
      const nota = Math.round((correctCount / questions.length) * 100);

      const { error: updateError } = await supabase
        .from("candidatos")
        .update({ nota })
        .eq("id", candidatoId!);
      if (updateError) throw updateError;

      toast.success(`Teste concluído! Nota: ${nota}%`);
      navigate(`/curriculo/${candidatoId}`);
    } catch (err: any) {
      toast.error("Erro ao salvar teste: " + (err.message || "Tente novamente."));
    } finally {
      setLoading(false);
    }
  };

  const current = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="glass-card-lg p-8 md:p-10">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="font-display text-2xl font-bold text-foreground">Teste — {area}</h1>
              <span className="text-sm text-muted-foreground font-medium">{currentIndex + 1}/{questions.length}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="space-y-6">
            <h2 className="text-lg font-medium text-foreground">{current.pergunta}</h2>

            <div className="space-y-3">
              {current.opcoes.map((opcao, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    answers[currentIndex] === i
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30 bg-card"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      answers[currentIndex] === i ? "border-primary bg-primary" : "border-muted-foreground/30"
                    }`}>
                      {answers[currentIndex] === i && <CheckCircle2 className="w-4 h-4 text-primary-foreground" />}
                    </div>
                    <span className="text-foreground">{opcao}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0}>
                Anterior
              </Button>
              {currentIndex < questions.length - 1 ? (
                <Button onClick={handleNext} disabled={answers[currentIndex] === null}>
                  Próxima
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading || answers.some((a) => a === null)} className="hero-gradient border-0 text-primary-foreground hover:opacity-90">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {loading ? "Enviando..." : "Finalizar teste"}
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
