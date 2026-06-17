import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Upload, FileText, Loader2, X } from "lucide-react";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const ResumeUpload = () => {
  const { candidatoId } = useParams<{ candidatoId: string }>();
  const [searchParams] = useSearchParams();
  const areaName = searchParams.get("area") || "TI";
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const validateFile = (f: File) => {
    if (!ALLOWED_TYPES.includes(f.type)) {
      toast.error("Formato inválido. Envie PDF, DOC ou DOCX.");
      return false;
    }
    if (f.size > MAX_SIZE) {
      toast.error("Arquivo muito grande. Máximo 5MB.");
      return false;
    }
    return true;
  };

  const handleFile = (f: File) => {
    if (validateFile(f)) setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!file || !candidatoId) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);

      await api.post(`/resumes/upload/${candidatoId}`, formData);

      toast.success("Currículo enviado com sucesso!");
      navigate(`/teste/${candidatoId}?area=${encodeURIComponent(areaName)}`);
    } catch (err: any) {
      toast.error("Erro ao enviar: " + (err.message || "Tente novamente."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="glass-card-lg p-8 md:p-10">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground">Envie seu currículo</h1>
            <p className="text-muted-foreground mt-1">Último passo! Envie seu currículo para concluir.</p>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
              dragOver ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button onClick={() => setFile(null)} className="ml-4 text-muted-foreground hover:text-destructive">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                <div>
                  <p className="font-medium text-foreground">Arraste seu arquivo aqui</p>
                  <p className="text-sm text-muted-foreground">ou clique para selecionar</p>
                </div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="hidden"
                  id="file-input"
                />
                <Button variant="outline" onClick={() => document.getElementById("file-input")?.click()}>
                  Selecionar arquivo
                </Button>
                <p className="text-xs text-muted-foreground">PDF, DOC ou DOCX • Máximo 5MB</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleSubmit}
              disabled={!file || loading}
              className="w-full hero-gradient border-0 text-primary-foreground hover:opacity-90"
              size="lg"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {loading ? "Enviando..." : "Enviar currículo e ir para o teste"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            O envio do currículo é obrigatório para prosseguirmos com seu teste técnico e avaliação.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResumeUpload;
