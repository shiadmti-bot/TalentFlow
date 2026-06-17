import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET não está definida nas variáveis de ambiente!");
}

export interface CandidateAuthRequest extends Request {
  candidate?: any;
}

export const candidateAuthMiddleware = (req: CandidateAuthRequest, res: Response, next: NextFunction): any => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Acesso negado. Token de candidato não fornecido." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== "candidate") {
      return res.status(403).json({ error: "Acesso negado. Este token não pertence a um candidato." });
    }
    req.candidate = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Sessão expirada ou token inválido. Faça login novamente." });
  }
};
