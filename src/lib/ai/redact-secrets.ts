/** Strip API key fragments from upstream error messages before returning to clients. */
export function redactSecrets(message: string): string {
  return message
    .replace(/sk-proj-[A-Za-z0-9_-]{8,}/g, "sk-proj-[REDACTED]")
    .replace(/[ks]-proj-[A-Za-z0-9_*-]{8,}/gi, "sk-proj-[REDACTED]")
    .replace(/sk-[A-Za-z0-9]{8,}/g, "sk-[REDACTED]")
    .replace(
      /Incorrect API key provided:\s*\S+/gi,
      "Incorrect API key provided: [REDACTED]"
    )
    .replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]");
}
