# TalentFlow Suite

Plataforma inteligente e autônoma de Recrutamento, Avaliação Técnica de Candidatos e Gestão de Pipelines de Contratação.

---

## 🚀 Como Executar o Projeto

Ambos os serviços (Frontend e Backend) estão integrados e podem ser iniciados concorrentemente.

### Pré-requisitos
- Node.js (v18 ou superior)
- Banco de dados PostgreSQL (Neon DB configurado)

### Inicialização
1. Instale as dependências na raiz e no backend:
   ```bash
   npm install
   npm run install --prefix backend
   ```
2. Inicialize o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   - O **Frontend** estará disponível em: [http://localhost:8080](http://localhost:8080)
   - O **Backend** estará rodando em: [http://localhost:5000](http://localhost:5000)

---

## 🛠️ Tecnologias Utilizadas
- **Frontend**: React, Vite, TypeScript, Tailwind CSS, Shadcn UI, Recharts, React Query.
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, Multer.
- **Banco de Dados**: PostgreSQL (Neon DB).
