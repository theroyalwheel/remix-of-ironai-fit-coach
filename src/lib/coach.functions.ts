import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Remote Coach Bolt provider.
 *
 * This is the single place a real AI model is wired in. The key never leaves
 * the server. When no key is configured the function reports `available: false`
 * and the client transparently uses the local rule-based coach instead — no
 * fake network calls, no fabricated responses.
 */

const AskInput = z.object({
  message: z.string().min(1).max(2000),
  systemPrompt: z.string().min(1).max(6000),
  history: z
    .array(z.object({ role: z.enum(["user", "coach"]), content: z.string().max(4000) }))
    .max(12)
    .default([]),
});

export type CoachReply =
  | { available: true; content: string }
  | { available: false; reason: string };

export const askCoachRemote = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AskInput.parse(input))
  .handler(async ({ data }): Promise<CoachReply> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return { available: false, reason: "No AI provider configured" };
    }

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": apiKey,
        },
        body: JSON.stringify({
          model: "google/gemini-3.6-flash",
          messages: [
            { role: "system", content: data.systemPrompt },
            ...data.history.map((m) => ({
              role: m.role === "coach" ? "assistant" : "user",
              content: m.content,
            })),
            { role: "user", content: data.message },
          ],
        }),
      });

      if (!res.ok) {
        if (res.status === 429)
          return { available: false, reason: "Coach Bolt is rate limited right now" };
        if (res.status === 402)
          return { available: false, reason: "AI credits are exhausted for this workspace" };
        return { available: false, reason: `AI provider error (${res.status})` };
      }

      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = json.choices?.[0]?.message?.content?.trim();
      if (!content) return { available: false, reason: "Empty response from AI provider" };
      return { available: true, content };
    } catch {
      return { available: false, reason: "Could not reach the AI provider" };
    }
  });
