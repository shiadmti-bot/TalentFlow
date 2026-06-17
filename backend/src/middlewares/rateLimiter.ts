import { Request, Response, NextFunction } from "express";

const rateLimits = new Map<string, Map<string, { count: number; resetTime: number }>>();

export const createRateLimiter = (key: string, limit: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction): any => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();

    if (!rateLimits.has(key)) {
      rateLimits.set(key, new Map());
    }

    const keyLimits = rateLimits.get(key)!;
    const record = keyLimits.get(ip);

    if (!record) {
      keyLimits.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (now > record.resetTime) {
      keyLimits.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    record.count++;
    if (record.count > limit) {
      const remainingTime = Math.ceil((record.resetTime - now) / 1000);
      return res.status(429).json({
        error: `Muitas solicitações. Tente novamente em ${remainingTime} segundos.`,
      });
    }

    next();
  };
};

export const loginRateLimiter = createRateLimiter("login", 5, 60 * 1000); // 5 attempts per minute
export const candidateRateLimiter = createRateLimiter("candidate", 3, 60 * 1000); // 3 attempts per minute
