export const log = {
  info: (...a: any[]) => console.log("[INFO]", ...a),
  warn: (...a: any[]) => console.warn("[WARN]", ...a),
  err:  (...a: any[]) => console.error("[ERR ]", ...a),
};
