import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + ext);
  },
});

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const fileFilter = (req: any, file: any, cb: any) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Formato inválido. Apenas PDF, DOC ou DOCX são permitidos."), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter,
});

// POST upload resume for candidate
router.post("/upload/:candidatoId", (req: Request, res: Response): any => {
  const { candidatoId } = req.params;

  upload.single("resume")(req, res, async (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "Arquivo muito grande. Limite máximo de 5MB." });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado." });
    }

    try {
      const candidate = await prisma.candidate.findUnique({
        where: { id: candidatoId },
      });

      if (!candidate) {
        // Delete uploaded file if candidate doesn't exist
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: "Candidato não encontrado." });
      }

      // Public URL of the uploaded resume on our server
      const fileUrl = `/uploads/${req.file.filename}`;

      // Delete existing resumes for this candidate to keep it clean (one resume per candidate)
      const existingResumes = await prisma.resume.findMany({
        where: { candidatoId },
      });

      for (const res of existingResumes) {
        const oldPath = path.join(uploadDir, path.basename(res.arquivoUrl));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      await prisma.resume.deleteMany({
        where: { candidatoId },
      });

      // Save new resume
      const resume = await prisma.resume.create({
        data: {
          candidatoId,
          arquivoUrl: fileUrl,
        },
      });

      res.status(201).json({
        message: "Currículo enviado com sucesso.",
        resume,
      });
    } catch (error: any) {
      // Cleanup file in case of DB error
      if (req.file) fs.unlinkSync(req.file.path);
      res.status(500).json({ error: error.message });
    }
  });
});

export default router;
