import { prisma } from "./prisma.js";

interface SendEmailParams {
  candidatoId: string;
  to: string;
  subject: string;
  content: string;
}

export const emailService = {
  async send({ candidatoId, to, subject, content }: SendEmailParams) {
    console.log("=========================================");
    console.log(`[SIMULAÇÃO DE E-MAIL ENVIADO]`);
    console.log(`Para: ${to}`);
    console.log(`Assunto: ${subject}`);
    console.log(`Conteúdo: \n${content}`);
    console.log("=========================================");

    try {
      await prisma.emailLog.create({
        data: {
          candidatoId,
          para: to,
          assunto: subject,
          conteudo: content,
        },
      });
    } catch (error) {
      console.error("Erro ao registrar log de e-mail no banco:", error);
    }
  },
};
