import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const areasData = [
  {
    nome: "Tecnologia da Informação",
    cargos: [
      "Desenvolvedor(a) Full Stack",
      "Analista de Dados",
      "Designer UX/UI",
      "Gerente de Projetos de TI"
    ],
    perguntas: [
      {
        pergunta: "Qual a diferença conceitual entre Server-Side Rendering (SSR) e Static Site Generation (SSG) no React/Next.js?",
        opcoes: [
          "SSR renderiza a página em tempo de build, enquanto SSG renderiza a cada nova requisição do usuário.",
          "SSR renderiza a página a cada nova requisição no servidor, enquanto SSG gera o HTML estático uma única vez durante o build.",
          "SSR é executado exclusivamente no navegador, enquanto SSG roda apenas no servidor Node.js.",
          "Ambos processam páginas de forma idêntica e não influenciam a performance ou o SEO da aplicação."
        ],
        correta: 1
      },
      {
        pergunta: "Em um banco de dados relacional (SQL), qual o impacto e a recomendação de se criar um Índice (Index) em colunas?",
        opcoes: [
          "Índices aceleram a escrita (INSERT/UPDATE), mas diminuem consideravelmente a velocidade de leitura (SELECT).",
          "Índices melhoram a velocidade de leitura em consultas complexas, porém adicionam sobrecarga e podem retardar operações de escrita.",
          "Índices dobram o espaço em disco do banco de dados e devem ser criados em todas as colunas de todas as tabelas.",
          "Índices servem apenas para criar chaves estrangeiras e não alteram a velocidade das buscas da aplicação."
        ],
        correta: 1
      },
      {
        pergunta: "No contexto de SOLID, o que dita o princípio da Responsabilidade Única (Single Responsibility Principle)?",
        opcoes: [
          "Uma classe ou módulo deve possuir apenas um método público disponível para chamada externa.",
          "Um programador deve ser o único responsável pela escrita e manutenção de um arquivo específico de código.",
          "Uma classe ou módulo deve ter um, e apenas um, motivo para ser modificado (deve ter apenas uma responsabilidade clara).",
          "A aplicação inteira deve possuir apenas uma única conexão de banco de dados (padrão Singleton)."
        ],
        correta: 2
      },
      {
        pergunta: "Como o mecanismo do CORS (Cross-Origin Resource Sharing) atua na segurança de sistemas web?",
        opcoes: [
          "Ele encripta todas as requisições HTTP entre o navegador e o servidor com certificados SSL.",
          "Ele permite que o servidor restrinja e defina quais origens (domínios) externas estão autorizadas a carregar recursos via browser.",
          "Ele impede ataques de injeção de SQL (SQL Injection) validando inputs de texto no lado do servidor.",
          "Ele gera e valida automaticamente a assinatura criptográfica de tokens de autenticação JWT."
        ],
        correta: 1
      },
      {
        pergunta: "Qual a principal vantagem da utilização do async/await (Promises) em relação a Callbacks tradicionais em JavaScript?",
        opcoes: [
          "async/await permite que o JavaScript execute tarefas multi-thread paralelas na CPU do usuário.",
          "async/await evita o aninhamento excessivo (Callback Hell), facilitando a leitura do fluxo assíncrono como se fosse sequencial.",
          "async/await reduz o consumo de memória RAM do servidor Node.js eliminando a pilha de execução.",
          "async/await substitui por completo o tratamento de exceções com blocos try/catch."
        ],
        correta: 1
      }
    ]
  },
  {
    nome: "Recursos Humanos",
    cargos: [
      "Analista de Recrutamento e Seleção",
      "Analista de Departamento Pessoal",
      "Business Partner (BP)"
    ],
    perguntas: [
      {
        pergunta: "O que caracteriza uma entrevista por competências utilizando o método STAR?",
        opcoes: [
          "Avaliar as habilidades e conhecimentos com foco exclusivo na formação acadêmica do candidato.",
          "Estruturar perguntas para investigar experiências passadas detalhando a Situação, Tarefa, Ação e Resultado obtido.",
          "Formular perguntas hipotéticas sobre decisões futuras do candidato diante de problemas fictícios.",
          "Aplicar testes psicológicos padronizados com duração mínima de duas horas."
        ],
        correta: 1
      },
      {
        pergunta: "Qual a diferença conceitual e operacional entre recrutamento ativo (hunting) e recrutamento passivo?",
        opcoes: [
          "No ativo, o recrutador busca ativamente talentos no mercado (ex: LinkedIn); no passivo, a empresa divulga a vaga e aguarda inscrições.",
          "No ativo, são selecionados apenas estagiários; no passivo, recrutam-se cargos executivos de liderança.",
          "No ativo, o recrutamento é feito por consultorias externas; no passivo, a equipe interna é quem gerencia o processo.",
          "Não há diferença, sendo termos sinônimos utilizados para descrever a mesma estratégia de captação."
        ],
        correta: 0
      },
      {
        pergunta: "O que indica e qual o impacto de um indicador de 'Turnover' elevado em uma organização?",
        opcoes: [
          "Indica a taxa de conversão de leads comerciais e reflete a eficiência do setor de marketing da empresa.",
          "Mede a quantidade de horas extras realizadas e reflete a sobrecarga das equipes operacionais.",
          "Mede a taxa de rotatividade de funcionários (entradas/saídas), cujo nível elevado aponta custos extras de contratação e problemas de clima.",
          "Reflete a satisfação e retenção de talentos internos a longo prazo na organização."
        ],
        correta: 2
      },
      {
        pergunta: "O que define a técnica e o processo estruturado de 'Onboarding' corporativo?",
        opcoes: [
          "O processo de rescisão contratual e entrevista de desligamento do funcionário.",
          "O programa de integração estruturado para aculturar e treinar novos contratados em suas funções iniciais.",
          "A rodada trimestral de feedbacks e reavaliações de cargos e salários.",
          "O planejamento estratégico de atração de candidatos e fortalecimento de marca empregadora."
        ],
        correta: 1
      },
      {
        pergunta: "O que significa a prática de 'Employer Branding'?",
        opcoes: [
          "A criação de submarcas e novos produtos exclusivos voltados para o público interno da empresa.",
          "A estratégia de promover a reputação da empresa no mercado a fim de torná-la um local altamente desejável para se trabalhar.",
          "A auditoria de conformidade fiscal e trabalhista das filiais da corporação.",
          "O processo de registro de patentes de ideias sugeridas no canal de inovação interna."
        ],
        correta: 1
      }
    ]
  },
  {
    nome: "Financeiro",
    cargos: [
      "Analista de Planejamento e Análise Financeira (FP&A)",
      "Analista de Tesouraria",
      "Analista Fiscal"
    ],
    perguntas: [
      {
        pergunta: "O que mede o EBITDA (Lajida) e por que ele é uma métrica relevante na análise de empresas?",
        opcoes: [
          "Ele mede o lucro líquido integral após deduzidas as despesas contábeis de depreciação e amortização.",
          "Ele mede o potencial de geração de caixa operacional bruto, eliminando distorções de impostos, estrutura de capital e depreciação.",
          "Ele representa o faturamento bruto antes da devolução de mercadorias ou cancelamentos de clientes.",
          "Ele reflete a liquidez de curtíssimo prazo e a capacidade de saldar dívidas bancárias nas próximas 24 horas."
        ],
        correta: 1
      },
      {
        pergunta: "Qual a diferença contábil fundamental entre o regime de caixa e o regime de competência?",
        opcoes: [
          "No regime de competência, receitas e despesas são registradas na data do fato gerador; no de caixa, na data do efetivo recebimento/pagamento.",
          "O regime de competência é facultativo para grandes corporações, enquanto o de caixa é obrigatório para todas as empresas.",
          "O regime de caixa computa os investimentos de longo prazo, enquanto o de competência foca no curto prazo.",
          "O regime de competência considera apenas as receitas e desconsidera as despesas operacionais da folha."
        ],
        correta: 0
      },
      {
        pergunta: "O que representa o indicador de Liquidez Corrente menor do que 1,0 em um Balanço Patrimonial?",
        opcoes: [
          "Significa que os recursos de curto prazo (ativo circulante) superam com folga as obrigações a vencer no mesmo período.",
          "Sinaliza que a empresa tem menos recursos circulantes do que obrigações de curto prazo, indicando risco de inadimplência ou aperto de caixa.",
          "Aponta que a empresa tem uma margem de lucro líquido operacional muito acima do padrão de mercado.",
          "Significa que a empresa é financiada majoritariamente por capital próprio e não possui dívidas de longo prazo."
        ],
        correta: 1
      },
      {
        pergunta: "Qual o significado de Custo de Capital Próprio (Ke) na modelagem de finanças corporativas?",
        opcoes: [
          "A taxa média de juros cobrada por instituições financeiras sobre empréstimos obtidos pela empresa.",
          "O retorno mínimo exigido pelos acionistas ou investidores para compensar o risco de alocar seu capital na empresa.",
          "A folha salarial total consolidada da gerência administrativa e conselho de administração da corporação.",
          "A despesa anual de depreciação de maquinários e frotas de veículos da organização."
        ],
        correta: 1
      },
      {
        pergunta: "O que representa o Valor Presente Líquido (VPL) na análise de viabilidade de projetos de investimentos?",
        opcoes: [
          "O valor nominal das receitas brutas estimadas sem qualquer desconto de juros ou tempo.",
          "A diferença simples entre o valor de liquidação dos ativos fixos e o valor contábil líquido.",
          "O valor gerado por fluxos de caixa futuros descontados pela taxa de atratividade da empresa, subtraindo o investimento inicial.",
          "A taxa percentual na qual o projeto empata e o retorno é igual a zero."
        ],
        correta: 2
      }
    ]
  },
  {
    nome: "Vendas e Marketing",
    cargos: [
      "Analista de Growth Marketing",
      "Analista de Performance (Tráfego Pago)",
      "Executivo(a) de Contas (SDR/Inside Sales)"
    ],
    perguntas: [
      {
        pergunta: "O que representa o indicador CAC (Custo de Aquisição de Clientes) em vendas e marketing?",
        opcoes: [
          "A média de valor que os clientes pagam anualmente para manter a assinatura ativa.",
          "A soma de todos os investimentos em marketing e vendas dividida pela quantidade de novos clientes obtidos em um período.",
          "O custo operacional bruto para produzir a mercadoria física que é enviada ao consumidor final.",
          "A taxa de abandono de compras no carrinho antes de concluir o checkout no site."
        ],
        correta: 1
      },
      {
        pergunta: "Como se calcula e o que indica o indicador ROAS (Return on Ad Spend) em campanhas digitais?",
        opcoes: [
          "Calcula-se pelo número de cliques dividido pelo número de impressões e indica o engajamento criativo do anúncio.",
          "Calcula-se pelo custo por mil impressões de anúncio e indica o quão cara está a publicidade no canal escolhido.",
          "Calcula-se pela receita gerada com anúncios dividida pelo gasto com mídia paga e indica a eficiência financeira do investimento.",
          "Calcula-se pelo tempo médio gasto na landing page e indica o interesse do cliente no conteúdo."
        ],
        correta: 2
      },
      {
        pergunta: "Qual a metodologia e objetivo central da realização de um Teste A/B em canais digitais?",
        opcoes: [
          "Dividir o tráfego de usuários entre duas variações (A e B) para comparar estatisticamente qual gera melhor taxa de conversão.",
          "Alterar todas as imagens e cores do site semanalmente de acordo com a preferência interna do time de design.",
          "Rodar anúncios idênticos em dois canais concorrentes com orçamentos diferentes para testar as plataformas.",
          "Substituir o time de redação humana por inteligências artificiais geradoras de texto para cortar custos."
        ],
        correta: 0
      },
      {
        pergunta: "O que define a métrica LTV (Lifetime Value) de um cliente corporativo?",
        opcoes: [
          "A validade total média do produto ou serviço oferecido antes de expirar.",
          "O valor monetário total que um cliente gasta e gera de receita para a empresa durante todo o seu tempo de relacionamento ativo.",
          "O custo médio para fechar uma proposta comercial em vendas corporativas.",
          "O tempo total que a equipe de vendas leva para qualificar e converter um lead."
        ],
        correta: 1
      },
      {
        pergunta: "Qual a principal característica que diferencia o tráfego orgânico via SEO (Search Engine Optimization) das demais mídias?",
        opcoes: [
          "O tráfego é proveniente de campanhas pagas otimizadas por palavras-chave na busca patrocinada do Google.",
          "O tráfego é oriundo de acessos gratuitos gerados pelo bom ranqueamento de conteúdos nos mecanismos de pesquisa.",
          "O tráfego consiste apenas em acessos diretos de usuários que digitaram o domínio no navegador.",
          "O tráfego provém exclusivamente de cliques feitos em links compartilhados por influenciadores em redes sociais."
        ],
        correta: 1
      }
    ]
  }
];

async function main() {
  console.log("Iniciando semeadura do banco de dados com dados realistas...");

  // Seed default pipeline stages
  const defaultStages = ["Separação", "Entrevistando", "Aprovado", "Contratado", "Arquivo"];
  console.log("Semeando etapas padrão do pipeline...");
  for (let i = 0; i < defaultStages.length; i++) {
    await prisma.pipelineStage.upsert({
      where: { nome: defaultStages[i] },
      update: {},
      create: {
        nome: defaultStages[i],
        ordem: i
      }
    });
  }

  for (const areaData of areasData) {
    // Upsert Area
    const area = await prisma.area.upsert({
      where: { nome: areaData.nome },
      update: {},
      create: { nome: areaData.nome }
    });

    console.log(`Área criada/encontrada: ${area.nome}`);

    for (const cargoNome of areaData.cargos) {
      // Upsert Cargo
      const cargo = await prisma.cargo.upsert({
        where: {
          nome_areaId: {
            nome: cargoNome,
            areaId: area.id
          }
        },
        update: {},
        create: {
          nome: cargoNome,
          areaId: area.id
        }
      });

      console.log(`  Cargo criado/encontrado: ${cargo.nome}`);

      // Seed default questions for this cargo
      const existingQuestionsCount = await prisma.question.count({
        where: { cargoId: cargo.id }
      });

      if (existingQuestionsCount === 0) {
        for (const q of areaData.perguntas) {
          await prisma.question.create({
            data: {
              cargoId: cargo.id,
              pergunta: q.pergunta,
              opcoes: q.opcoes,
              correta: q.correta
            }
          });
        }
        console.log(`    Perguntas técnicas criadas para o cargo: ${cargo.nome}`);
      }
    }
  }

  // Seed admin user
  const adminEmail = "delciofarias04@gmail.com";
  const hashedPassword = await bcrypt.hash("Gv*g3.Wca@_8Jbb", 10);
  
  // Clear other admin users to keep only the requested one
  await prisma.adminUser.deleteMany({
    where: {
      email: {
        not: adminEmail
      }
    }
  });

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { password: hashedPassword, nome: "Administrador" },
    create: {
      email: adminEmail,
      password: hashedPassword,
      nome: "Administrador"
    }
  });
  console.log(`Usuário administrativo semeado: ${adminEmail}`);

  console.log("Semeadura realista concluída com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
