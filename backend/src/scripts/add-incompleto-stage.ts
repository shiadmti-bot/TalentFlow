import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Adicionando estágio 'Cadastro Incompleto' ao banco de dados...");

  await prisma.pipelineStage.upsert({
    where: { nome: "Cadastro Incompleto" },
    update: { ordem: -1 }, // Mantém ordem -1 para aparecer primeiro
    create: {
      nome: "Cadastro Incompleto",
      ordem: -1,
    },
  });

  console.log("Estágio adicionado com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
