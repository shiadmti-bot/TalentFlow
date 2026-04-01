export interface Question {
  pergunta: string;
  opcoes: string[];
  correta: number; // index of correct answer
}

export const questionsByArea: Record<string, Question[]> = {
  TI: [
    {
      pergunta: "O que é HTML?",
      opcoes: [
        "Uma linguagem de programação",
        "Uma linguagem de marcação para páginas web",
        "Um banco de dados",
        "Um sistema operacional"
      ],
      correta: 1
    },
    {
      pergunta: "O que é uma API?",
      opcoes: [
        "Um tipo de hardware",
        "Uma interface de programação de aplicações",
        "Um protocolo de e-mail",
        "Um sistema de arquivos"
      ],
      correta: 1
    },
    {
      pergunta: "O que é um banco de dados relacional?",
      opcoes: [
        "Um sistema que armazena dados em tabelas relacionadas",
        "Um tipo de rede social",
        "Um software de design",
        "Um protocolo de internet"
      ],
      correta: 0
    },
    {
      pergunta: "O que significa CSS?",
      opcoes: [
        "Computer Style Sheets",
        "Creative Style System",
        "Cascading Style Sheets",
        "Colorful Style Sheets"
      ],
      correta: 2
    },
    {
      pergunta: "O que é Git?",
      opcoes: [
        "Uma linguagem de programação",
        "Um sistema de controle de versão",
        "Um editor de texto",
        "Um framework web"
      ],
      correta: 1
    }
  ],
  RH: [
    {
      pergunta: "O que é recrutamento?",
      opcoes: [
        "Processo de demissão de funcionários",
        "Processo de atrair e selecionar candidatos para vagas",
        "Processo de treinamento",
        "Processo de avaliação de desempenho"
      ],
      correta: 1
    },
    {
      pergunta: "O que é cultura organizacional?",
      opcoes: [
        "O salário dos funcionários",
        "As normas, valores e comportamentos compartilhados em uma empresa",
        "O horário de trabalho",
        "O número de funcionários"
      ],
      correta: 1
    },
    {
      pergunta: "O que é onboarding?",
      opcoes: [
        "Processo de demissão",
        "Processo de integração de novos colaboradores",
        "Processo de promoção",
        "Processo de aposentadoria"
      ],
      correta: 1
    },
    {
      pergunta: "O que é feedback 360 graus?",
      opcoes: [
        "Avaliação feita apenas pelo gestor",
        "Avaliação feita por múltiplas fontes (gestores, colegas, subordinados)",
        "Avaliação de clientes",
        "Avaliação financeira"
      ],
      correta: 1
    },
    {
      pergunta: "O que é turnover?",
      opcoes: [
        "Lucro da empresa",
        "Taxa de rotatividade de funcionários",
        "Índice de satisfação",
        "Meta de vendas"
      ],
      correta: 1
    }
  ],
  Financeiro: [
    {
      pergunta: "O que é fluxo de caixa?",
      opcoes: [
        "O lucro anual da empresa",
        "O controle de entradas e saídas de dinheiro",
        "O valor das ações",
        "O patrimônio líquido"
      ],
      correta: 1
    },
    {
      pergunta: "O que é lucro líquido?",
      opcoes: [
        "Receita total da empresa",
        "Lucro após dedução de todos os custos e impostos",
        "Valor investido",
        "Total de vendas"
      ],
      correta: 1
    },
    {
      pergunta: "O que é balanço patrimonial?",
      opcoes: [
        "Um relatório de vendas",
        "Demonstrativo da situação financeira com ativos, passivos e patrimônio",
        "Um plano de marketing",
        "Um relatório de RH"
      ],
      correta: 1
    },
    {
      pergunta: "O que é ROI?",
      opcoes: [
        "Receita Operacional Interna",
        "Retorno sobre Investimento",
        "Registro de Operações Internas",
        "Relatório de Orçamento Integrado"
      ],
      correta: 1
    },
    {
      pergunta: "O que é DRE?",
      opcoes: [
        "Departamento de Recursos Especiais",
        "Demonstração do Resultado do Exercício",
        "Divisão de Receita Empresarial",
        "Documento de Registro Econômico"
      ],
      correta: 1
    }
  ],
  Marketing: [
    {
      pergunta: "O que é SEO?",
      opcoes: [
        "Sistema Empresarial Online",
        "Otimização para mecanismos de busca",
        "Software de E-mail Oficial",
        "Serviço de Entrega Online"
      ],
      correta: 1
    },
    {
      pergunta: "O que é persona no marketing?",
      opcoes: [
        "O CEO da empresa",
        "Representação fictícia do cliente ideal",
        "O logotipo da marca",
        "Um tipo de anúncio"
      ],
      correta: 1
    },
    {
      pergunta: "O que é funil de vendas?",
      opcoes: [
        "Um equipamento de cozinha",
        "Modelo que representa as etapas da jornada do cliente",
        "Um tipo de gráfico",
        "Uma estratégia de RH"
      ],
      correta: 1
    },
    {
      pergunta: "O que é CRM?",
      opcoes: [
        "Central de Recursos Monetários",
        "Gestão de Relacionamento com o Cliente",
        "Controle de Receita Mensal",
        "Centro de Resultados de Marketing"
      ],
      correta: 1
    },
    {
      pergunta: "O que é marketing de conteúdo?",
      opcoes: [
        "Venda direta de produtos",
        "Estratégia de criar conteúdo relevante para atrair e engajar o público",
        "Propaganda em televisão",
        "Distribuição de folhetos"
      ],
      correta: 1
    }
  ]
};
