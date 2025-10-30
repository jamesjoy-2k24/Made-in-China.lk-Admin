import { ZodError } from "zod";

export const parseOrThrow = <T>(schema: any, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (e) {
    if (e instanceof ZodError) {
      const details = e.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
      const err: any = new Error(`Validation failed: ${details}`);
      err.statusCode = 400;
      throw err;
    }
    throw e;
  }
};
