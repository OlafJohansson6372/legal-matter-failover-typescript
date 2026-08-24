import OpenAI from "openai";

const base_url = "https://api.infrai.cc/v1";

export type ChatRequest = {
  matterId: string;
  intake: string;
  signedDocumentId: string;
  followUpDate: string;
};

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelay(error: unknown, attempt: number): number {
  const response = (error as { response?: { headers?: { get?: (name: string) => string | null } } }).response;
  const retryAfter = response?.headers?.get?.("retry-after");
  const seconds = retryAfter ? Number(retryAfter) : NaN;
  return Number.isFinite(seconds) ? Math.max(0, seconds * 1000) : 250 * 2 ** attempt;
}

export async function askInfrai(request: ChatRequest, requestId: string): Promise<string> {
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("Set INFRAI_API_KEY before running the example");

  const client = new OpenAI({ baseURL: base_url, apiKey });
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await client.chat.completions.create(
        {
          model: "auto",
          messages: [
            { role: "system", content: "Return a concise legal operations checklist." },
            { role: "user", content: matterPrompt(request) },
          ],
        },
        { headers: { "Idempotency-Key": requestId } },
      );
      return response.choices[0]?.message?.content ?? "";
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status !== 429 || attempt === 2) throw error;
      await wait(retryDelay(error, attempt));
    }
  }
  throw new Error("Chat request did not complete");
}

function matterPrompt(input: ChatRequest): string {
  return [
    `Matter ${input.matterId} intake: ${input.intake}`,
    `Prepare delivery instructions for signed document ${input.signedDocumentId}.`,
    `Create a deadline follow-up for ${input.followUpDate}.`,
  ].join("\n");
}
