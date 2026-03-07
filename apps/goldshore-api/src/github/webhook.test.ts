import { describe, it, expect } from "vitest";
import { verifyGitHubWebhook } from "./webhook";

const encoder = new TextEncoder();

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

describe("verifyGitHubWebhook", () => {
  const secret = "test-secret-key";
  const payload = JSON.stringify({ event: "push", ref: "refs/heads/main" });

  it("should return true for a valid signature", async () => {
    const signature = await hmacSha256Hex(secret, payload);
    const signatureHeader = `sha256=${signature}`;

    // verifyGitHubWebhook(secret, signature, payload)
    const result = await verifyGitHubWebhook(secret, signatureHeader, payload);
    expect(result).toBe(true);
  });

  it("should return false for an invalid signature", async () => {
    const signatureHeader = "sha256=invalid-signature-value";

    const result = await verifyGitHubWebhook(secret, signatureHeader, payload);
    expect(result).toBe(false);
  });

  it("should return false if the signature header is empty", async () => {
    const result = await verifyGitHubWebhook(secret, "", payload);
    expect(result).toBe(false);
  });

  it("should return false if the signature does not have the sha256 prefix", async () => {
    const signature = await hmacSha256Hex(secret, payload);
    const result = await verifyGitHubWebhook(secret, signature, payload);
    expect(result).toBe(false);
  });

  it("should throw an error if the secret is missing", async () => {
    await expect(verifyGitHubWebhook("", "sha256=xxx", payload)).rejects.toThrow(
      "Missing GITHUB_WEBHOOK_SECRET environment variable"
    );
  });

  it("should correctly verify an empty payload", async () => {
    const emptyPayload = "";
    const signature = await hmacSha256Hex(secret, emptyPayload);
    const signatureHeader = `sha256=${signature}`;

    const result = await verifyGitHubWebhook(secret, signatureHeader, emptyPayload);
    expect(result).toBe(true);
  });

  it("should return false for a signature from a different secret", async () => {
    const differentSecret = "wrong-secret";
    const signature = await hmacSha256Hex(differentSecret, payload);
    const signatureHeader = `sha256=${signature}`;

    const result = await verifyGitHubWebhook(secret, signatureHeader, payload);
    expect(result).toBe(false);
  });

  it("should return false if the payload is slightly different", async () => {
    const signature = await hmacSha256Hex(secret, payload);
    const signatureHeader = `sha256=${signature}`;
    const modifiedPayload = `${payload} `;

    const result = await verifyGitHubWebhook(secret, signatureHeader, modifiedPayload);
    expect(result).toBe(false);
  });
});
