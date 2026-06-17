# Checklist de Funcionalidades & Requisitos — TalentFlow Suite

Este documento serve como o quadro de acompanhamento (Kanban/Checklist) do desenvolvimento do **TalentFlow Suite**, detalhando os requisitos e funcionalidades de cada módulo do sistema.

> **Legenda:** ✅ Concluído | 🔧 Em andamento | ❌ Pendente

---

## Módulo 0: Arquitetura do Sistema & Fluxo de Usuários

### Tipos de Usuários

| Tipo | Acesso | Descrição |
|------|--------|-----------|
| **Candidato** | Público (sem login) | Pré-cadastro via formulário, realiza teste técnico, envia currículo |
| **Administrador (RH/Gestor)** | `/login` (JWT) | Gerencia pipeline, candidatos, dashboards, CRUDs |
| **Super Admin (TI/Dono)** | `/login` (JWT + permissão especial) | Gerencia admins, logs do sistema, config globais |

### Fluxo do Candidato (Completo)
```
Landing (/)
  -> Formulário (/candidatar) — 4 etapas (Identificação, Endereço, Vaga, Perfil)
  -> Teste Técnico (/teste/:id) — 5 perguntas, 5 min, correção automática
  -> Upload Currículo (/curriculo/:id) — PDF/DOC até 5MB
  -> Confirmação (/confirmacao)
```

### Fluxo do Admin (Completo)
```
Login (/login)
  -> Painel Admin (/admin)
    ├── Dashboard (métricas, gráficos, funil, top talentos)
    ├── Processo (Kanban + Tabela + Filtros + Modal de detalhes)
    └── Ajustes (CRUD Áreas, Cargos, Questões)
```

### Pipeline de Recrutamento (Estados)
```
Inscrição -> Teste -> Separação -> Entrevistando -> Aprovado -> Contratado
                        ↓                                  ↓
                    Arquivo                            Arquivo
```

---

## Módulo 1: Portal de Candidaturas (Cadastro & Currículo)

### Requisitos de Cadastro
- [x] **Formulário de Inscrição:** Interface amigável e responsiva para coleta de dados.
- [x] **Dados Pessoais:**
  - [x] Nome completo
  - [x] Email (com validação de formato RFC)
  - [x] Telefone (com máscara de input e suporte a nulo)
- [x] **Localização:**
  - [x] Endereço
  - [x] Bairro
  - [x] Cidade
  - [x] Estado
- [x] **Dados Profissionais:**
  - [x] Área de atuação (carregada dinamicamente via API)
  - [x] Cargo pretendido (dropdown dinâmico filtrado com base na área escolhida)
  - [x] Nível de senioridade pretendido (Júnior, Pleno, Sênior)
- [x] **Perguntas Subjetivas:**
  - [x] Campo de texto: "Fale sobre você"
  - [x] Campo de texto: "Por que deseja essa vaga?"
- [x] **Detecção de Email Duplicado:** Impedir cadastro repetido do mesmo email (verificar no backend antes de criar candidato).

### Requisitos de Currículo
- [x] **Validação de Formatos:** Aceitar apenas arquivos `.pdf`, `.doc` e `.docx`.
- [x] **Restrição de Tamanho:** Validar no frontend e no backend limite de até 5MB.
- [x] **Armazenamento Seguro:** Gravação física dos arquivos no backend (`/backend/uploads`) e persistência do caminho no banco.
- [x] **Associação de Dados:** Vincular o registro do currículo diretamente ao ID do candidato.
- [ ] **Upload para Cloud (opcional):** Migrar armazenamento para S3/Cloudinary em vez de disco local.
- [x] **Limpeza de Arquivos Órfãos:** Remover currículos do disco quando o candidato for excluído ou um novo upload for feito.

---

## Módulo 2: Teste de Avaliação Técnico

### Geração de Questões
- [x] **Seed Inicial:** 20 perguntas técnicas distribuídas em 4 áreas (TI, RH, Financeiro, Vendas/Marketing).
- [x] **Perguntas Fixas:** CRUD manual de questões no painel admin.
- [x] **Geração por IA:** Botão "Gerar com IA" que cria perguntas contextualizadas com base no cargo e nível de senioridade (via OpenAI/Google AI).

### Experiência do Teste
- [x] **Fluxo Direcionado:** Redirecionar o candidato automaticamente para a página do teste imediatamente após salvar o cadastro.
- [x] **Carga Dinâmica:** Perguntas carregadas dinamicamente com base no cargo e área selecionados pelo candidato.
- [x] **Segurança das Respostas:** Carregar enunciados e opções sem enviar as alternativas corretas no payload HTTP.
- [x] **Estrutura do Teste:**
  - [x] Mínimo de 5 perguntas simples de múltipla escolha.
  - [x] Barra de progresso visual mostrando o andamento do candidato (ex: 2/5).
  - [x] Permissão de navegação para pergunta anterior/próxima.
- [x] **Processamento & Notas:**
  - [x] Envio das respostas selecionadas para correção segura no servidor.
  - [x] Cálculo automático da nota de 0 a 100% no backend.
  - [x] Armazenamento dos resultados detalhados (pergunta, resposta enviada e se estava correta).
- [ ] **Timer Configurável:** Permitir que o admin defina o tempo limite do teste (ex: 5 min, 10 min) nas configurações.
- [ ] **Número de Perguntas Variável:** Permitir configurar quantidade de perguntas por teste (ex: 5, 10, 15).

---

## Módulo 3: Painel Administrativo (Consola de Gestão)

### Gestão de Candidatos
- [x] **Visualização de Listas:** Tabela com todos os candidatos contendo Cargo, Área, Nível, Nota, Status e Data de Inscrição.
- [x] **Filtros e Busca:**
  - [x] Busca textual por Nome do Candidato.
  - [x] Filtro por Área de Atuação.
  - [x] Filtro por Cargo Pretendido.
  - [x] Filtro por Status no Pipeline.
- [x] **Visualização Detalhada (Modal):**
  - [x] Exibição de todos os dados cadastrais e endereço completo.
  - [x] Download direto do currículo em anexo.
  - [x] Visualização individualizada das respostas enviadas no teste técnico (quais acertou/errou).
- [x] **Pipeline / Processo Seletivo:**
  - [x] Movimentação manual de status/etapa (Tags: "Separação", "Entrevistando", "Aprovado", "Arquivo", "Contratado").
  - [x] Exibição da Timeline histórica de transições do candidato (Inscrição -> Teste -> Separação -> etc.) com data e hora.
- [x] **Feedback Interno:** Campo de anotação de observações internas do candidato, restrito e visível apenas para administradores.
- [ ] **Paginação na Listagem:** Carregar candidatos com paginação (ex: 20 por página) para performance com muitos registros.

### Configurações do Sistema (Ajustes CRUD)
- [x] **CRUD de Áreas:** Interface para adicionar e excluir Áreas (ex: TI, RH).
- [x] **CRUD de Cargos:** Interface para adicionar e excluir cargos associados a uma Área.
- [x] **CRUD de Questões:** Interface para adicionar e excluir perguntas vinculadas a um cargo (Enunciado, 4 Opções de resposta e seleção da correta).
- [ ] **CRUD de Admins:** Interface para Super Admin gerenciar contas de administradores (criar, editar, remover).
- [x] **Geração de Questões por IA:** Botão no CRUD de Questões que abre modal para gerar perguntas automaticamente via IA (selecionar cargo, nível, quantidade).

---

## Módulo 4: Dashboard & Visão Geral

### Métricas Atuais
- [x] **Métricas de Acompanhamento (Cards):**
  - [x] Card "Banco de Talentos" — total de candidatos cadastrados na base.
  - [x] Card "Média Geral Técnica" — média das notas dos testes.
  - [x] Card "Aprovados no Teste" — candidatos com nota >= 60.
  - [x] Card "Contratações Realizadas" — candidatos com tag "Contratado".
- [x] **Funil de Recrutamento:** Visualização da quantidade de talentos em cada fase (Separação -> Entrevistando -> Aprovado -> Contratado -> Arquivo).
- [x] **Top Talentos:** Lista dos 5 melhores desempenhos nos testes técnicos (ordenado por nota).
- [x] **Gráficos de Performance (Recharts):**
  - [x] Gráfico de rosca/pizza com distribuição por Área de Interesse.
  - [x] Gráfico de rosca/pizza com distribuição por Nível de Senioridade.

### Métricas Futuras
- [ ] **Tempo Médio no Pipeline:** Quanto tempo cada candidato leva em média para ser contratado ou arquivado.
- [ ] **Taxa de Conversão por Área:** Percentual de aprovação em testes agrupado por área.
- [ ] **Gráfico de Retenção:** Acompanhamento de candidatos que reaplicam para outras vagas.
- [ ] **Exportar Relatórios:** Botão para exportar dados do dashboard em CSV/PDF.

---

## Módulo 5: Infraestrutura, Arquitetura & UX

### Arquitetura
- [x] **Desvinculação Tecnológica:** Remoção completa do `lovable-tagger` e das conexões/chaves diretas com o Supabase SDK.
- [x] **Arquitetura Desacoplada:**
  - [x] Frontend isolado em React + Vite + TypeScript.
  - [x] Backend modular isolado em Node.js + Express + TypeScript.
  - [x] Camada de persistência segura gerenciada por Prisma ORM.
- [x] **Banco de Dados:** Conexão integrada e ativa no Neon PostgreSQL com banco próprio `talentflow`.

### Segurança
- [x] **Autenticação JWT:** Login de admin com token de 24h armazenado no localStorage.
- [x] **Rate Limit no Login:** Proteger endpoint `/api/auth/login` contra brute-force (ex: 5 tentativas por minuto).
- [ ] **CORS Restrito:** Trocar `origin: "*"` por domínios específicos em produção.
- [x] **JWT_SECRET em .env:** Remover fallback hardcoded e exigir variável de ambiente.
- [ ] **Recuperação de Senha:** Fluxo de "Esqueci minha senha" para admins.
- [ ] **Hash de Senha com Salt:** Já implementado (bcryptjs, 10 rounds) — manter.

### UX / Interface
- [x] **Interface Gráfica Premium:**
  - [x] Paleta de cores degradês baseada nos pesos HSL solicitados (Branco 40%, Violeta 25%, Azul Claro 20%, Azul Escuro 15%).
  - [x] Responsividade para dispositivos móveis e desktops.
  - [x] Micro-animações em botões, hovers e transições de tela.
- [ ] **Modo Escuro/Claro:** Alternância entre temas (já existe `next-themes` como dependência).

### Testes
- [x] **Playwright Configurado:** Framework E2E instalado e configurado.
- [x] **Vitest Configurado:** Test runner unitário instalado.
- [ ] **Testes Unitários:** Implementar testes para hooks, utils e componentes críticos.
- [ ] **Testes de Integração:** Testar fluxos completos (cadastro -> teste -> currículo) via Playwright.
- [ ] **Testes de API:** Testar endpoints críticos (auth, candidates, tests) com supertest ou similar.

---

## Módulo 6: Geração de Perguntas com Inteligência Artificial

### Visão Geral
Sistema para gerar perguntas de múltipla escolha contextualizadas usando IA (OpenAI, Google Gemini ou similar), eliminando a necessidade de cadastro manual de questões.

### Requisitos Técnicos
- [ ] **Provedor de IA Configurável:** Suporte a OpenAI (GPT-4o-mini) e Google Gemini, definido via variável de ambiente (`AI_PROVIDER`, `OPENAI_API_KEY`, `GEMINI_API_KEY`).
- [ ] **Endpoint `POST /api/questions/generate`:** Recebe `{ cargoId, nivel, quantidade }` e retorna perguntas geradas.
- [ ] **Prompt Engineering:** Template de prompt que instrui a IA a gerar perguntas no formato JSON específico do sistema.
- [ ] **Validação e Sanitização:** Verificar se a resposta da IA é um JSON válido antes de salvar no banco.
- [ ] **Fallback Progressivo:** Se a IA falhar, tentar provedor alternativo; se ambos falharem, retornar erro amigável.
- [ ] **Interface no Admin:** Modal "Gerar com IA" no CRUD de Questões com campos: Cargo, Nível (Júnior/Pleno/Sênior), Quantidade (5, 10, 15).
- [ ] **Histórico de Geração:** Registrar quais perguntas foram geradas por IA vs. manuais.
- [ ] **Custo Controlado:** Usar modelo econômico (GPT-4o-mini) e limitar geração a no máximo 15 perguntas por vez.

### Fluxo de Geração com IA
```
Admin clica "Gerar com IA" no painel
  -> Modal: seleciona Cargo, Nível, Quantidade
  -> Backend monta prompt + chama API de IA
  -> IA retorna JSON com perguntas, opções e índice correto
  -> Backend valida estrutura e salva no banco
  -> Frontend exibe sucesso + recarrega lista de questões
```

### Exemplo de Prompt para IA
```
Você é um assistente especializado em criar questões de múltipla escolha para processos seletivos.
Gere {quantidade} perguntas técnicas para o cargo de "{cargo}" nível {nivel}.
Formato obrigatório (JSON array):
[
  {
    "pergunta": "texto da pergunta",
    "opcoes": ["opção A", "opção B", "opção C", "opção D"],
    "correta": 0
  }
]
A resposta correta é o índice no array (0-3).
As perguntas devem ser adequadas para um profissional nível {nivel} na área de {area}.
```

---

## Módulo 7: Personalizações & Fluxo Avançado

### Portal do Candidato (Autenticação)
- [ ] **Login do Candidato:** Permitir que candidatos criem conta e acompanhem seu status no processo.
- [ ] **Minhas Candidaturas:** Tela para o candidato ver histórico de vagas aplicadas, nota do teste e status atual.
- [ ] **Notificações por Email:** Enviar email de confirmação após cadastro e notificar mudanças de status no pipeline.

### Pipeline Aprimorado
- [ ] **Etapas Customizáveis:** Permitir que o admin crie/renomeie etapas do pipeline (ex: "Triagem Curricular", "Entrevista Técnica", "Entrevista RH").
- [ ] **Atribuição de Responsável:** Vincular cada candidato a um admin específico durante o processo.
- [ ] **Ações em Massa:** Selecionar múltiplos candidatos e mover de etapa ou arquivar em lote.

### Analytics Avançado
- [ ] **Comparativo entre Vagas:** Comparar métricas de diferentes cargos lado a lado.
- [ ] **Sazonalidade:** Gráfico de candidaturas ao longo dos meses para identificar picos de inscrição.
- [ ] **Previsão de Contratação:** Usar dados históricos para estimar tempo até contratação.

---

## Resumo do Progresso

| Módulo | Concluído | Pendente | % |
|--------|-----------|----------|---|
| 0 — Arquitetura & Fluxo | ✅ Estrutura base | ❌ Tipos de usuário refinados | 80% |
| 1 — Portal de Candidaturas | ✅ 12/12 itens | ❌ Upload cloud | 95% |
| 2 — Teste Técnico | ✅ 8/10 itens | ❌ Timer config, Qtd variável | 80% |
| 3 — Painel Admin | ✅ 10/11 itens | ❌ Paginação, CRUD Admins | 90% |
| 4 — Dashboard | ✅ 7/10 itens | ❌ Métricas avançadas, Export | 70% |
| 5 — Infraestrutura | ✅ 7/11 itens | ❌ CORS, Testes, Modo escuro | 63% |
| 6 — IA Generativa | ✅ 7/8 itens | ❌ Histórico geração IA | 87% |
| 7 — Personalizações | ❌ 0/8 itens | ❌ Tudo pendente | 0% |
| **Total Geral** | **45/70 itens** | **25 pendentes** | **64%** |
