/** OpenAI-compatible chat endpoint owned by the operator, not a hosted builder. */
export function aiGatewayConfig(): { url: string; key: string; model: string } {
  const url = Deno.env.get("AI_GATEWAY_URL") || "";
  const key = Deno.env.get("AI_GATEWAY_API_KEY") || "";
  const model = Deno.env.get("AI_GATEWAY_MODEL") || "gpt-4o-mini";
  if (!url || !key) {
    throw new Error("AI_GATEWAY_URL and AI_GATEWAY_API_KEY must be set");
  }
  return { url, key, model };
}
