import { Request, Response, NextFunction } from "express";

export const notFound = (req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  const code = err.statusCode || 500;
  const msg = err.message || "Internal Server Error";
  if (process.env.NODE_ENV !== "test") {
    console.error("Error:", err);
  }
  res.status(code).json({ message: msg });
};
