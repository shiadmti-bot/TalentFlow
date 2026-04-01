
-- Create candidatos table
CREATE TABLE public.candidatos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  cargo TEXT NOT NULL,
  area TEXT NOT NULL,
  nivel TEXT NOT NULL,
  descricao TEXT,
  motivacao TEXT,
  nota NUMERIC DEFAULT 0,
  data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create testes table
CREATE TABLE public.testes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidato_id UUID NOT NULL REFERENCES public.candidatos(id) ON DELETE CASCADE,
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL,
  correta BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create curriculos table
CREATE TABLE public.curriculos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidato_id UUID NOT NULL REFERENCES public.candidatos(id) ON DELETE CASCADE,
  arquivo_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.candidatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculos ENABLE ROW LEVEL SECURITY;

-- Public insert policies (candidates can submit without auth)
CREATE POLICY "Anyone can insert candidatos" ON public.candidatos FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert testes" ON public.testes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert curriculos" ON public.curriculos FOR INSERT WITH CHECK (true);

-- Public select for admin (will add proper admin auth later)
CREATE POLICY "Anyone can view candidatos" ON public.candidatos FOR SELECT USING (true);
CREATE POLICY "Anyone can view testes" ON public.testes FOR SELECT USING (true);
CREATE POLICY "Anyone can view curriculos" ON public.curriculos FOR SELECT USING (true);

-- Storage bucket for resumes
INSERT INTO storage.buckets (id, name, public) VALUES ('curriculos', 'curriculos', true);

CREATE POLICY "Anyone can upload curriculos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'curriculos');
CREATE POLICY "Anyone can view curriculos files" ON storage.objects FOR SELECT USING (bucket_id = 'curriculos');
