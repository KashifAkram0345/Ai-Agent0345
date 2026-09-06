import type { MessageDocument } from "@/lib/models/Message";

type AgentMessage = { role: "system" | "user" | "assistant"; content: string };

export class OpenRouterError extends Error {
  constructor(public readonly upstreamStatus: number, message: string) {
    super(message);
    this.name = "OpenRouterError";
  }
}

const systemPrompt = `You are NOVA, a thoughtful personal AI agent. Be concise but useful.
You can use three safe tools when needed:
1. calculator — evaluate arithmetic only
2. current_datetime — report the current date and time
3. conversation_history — use the recent conversation supplied by the application
Never claim to have performed actions outside this chat. Never request or execute shell commands, code execution, payments, emails, or destructive actions.
When the application supplies a tool result, use it naturally and do not expose internal tool syntax.`;

function calculate(expression: string): number {
  const tokens = expression.match(/(?:\d+(?:\.\d+)?|[()+\-*/%])/g);
  if (!tokens || tokens.join("") !== expression.replace(/\s+/g, "")) throw new Error("Only arithmetic is allowed.");
  let index = 0;
  const primary = (): number => {
    const token = tokens[index++];
    if (token === "(") {
      const value = additive();
      if (tokens[index++] !== ")") throw new Error("Unbalanced parentheses.");
      return value;
    }
    if (token === "-") return -primary();
    if (!token || !/^\d/.test(token)) throw new Error("Invalid expression.");
    return Number(token);
  };
  const multiplicative = (): number => {
    let value = primary();
    while (["*", "/", "%"].includes(tokens[index])) {
      const operator = tokens[index++];
      const right = primary();
      if (operator === "*") value *= right;
      if (operator === "/") value /= right;
      if (operator === "%") value %= right;
    }
    return value;
  };
  const additive = (): number => {
    let value = multiplicative();
    while (["+", "-"].includes(tokens[index])) {
      const operator = tokens[index++];
      const right = multiplicative();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  };
  const result = additive();
  if (index !== tokens.length || !Number.isFinite(result)) throw new Error("Invalid arithmetic.");
  return result;
}

function toolResult(input: string, history: MessageDocument[]) {
  const lower = input.toLowerCase();
  const calcMatch = input.match(/(?:calculate|what is|compute)\s+([0-9()+\-*/%.\s]+)/i);
  if (calcMatch) {
    try { return `Calculator result: ${calculate(calcMatch[1].trim())}`; }
    catch { return "Calculator could not evaluate that expression safely."; }
  }
  if (/\b(time|date|day|today|now)\b/.test(lower)) {
    return `Current date and time: ${new Intl.DateTimeFormat("en", { dateStyle: "full", timeStyle: "long" }).format(new Date())}`;
  }
  if (/\b(history|earlier|previous|before|remember)\b/.test(lower)) {
    const recent = history.slice(-8).map((message) => `${message.role}: ${message.content}`).join("\n");
    return recent ? `Recent conversation history:\n${recent}` : "There is no earlier conversation history.";
  }
  return null;
}

export async function runAgent(input: string, history: MessageDocument[]) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new OpenRouterError(503, "AI service is not configured. Please try again later.");
  const model = process.env.OPENROUTER_MODEL || "openrouter/free";
  const tool = toolResult(input, history);
  const conversation: AgentMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-12).map((message) => ({ role: message.role, content: message.content })),
    ...(tool ? [{ role: "system" as const, content: `[Safe tool result]\n${tool}` }] : []),
    { role: "user", content: input },
  ];
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(process.env.OPENROUTER_SITE_URL ? { "HTTP-Referer": process.env.OPENROUTER_SITE_URL } : {}),
      "X-Title": "NOVA Personal AI Agent",
    },
    body: JSON.stringify({ model, messages: conversation, stream: false }),
    signal: AbortSignal.timeout(90_000),
  });
  const data = await response.json().catch(() => ({})) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };
  if (!response.ok) {
    if (response.status === 401) {
      throw new OpenRouterError(401, "AI provider authentication failed. Please check the server configuration.");
    }
    if (response.status === 429) {
      throw new OpenRouterError(429, "AI provider is temporarily busy. Please try again shortly.");
    }
    if (response.status >= 500) {
      throw new OpenRouterError(response.status, "AI provider is temporarily unavailable. Please try again.");
    }
    throw new OpenRouterError(400, data.error?.message || "AI provider rejected the request. Please try again.");
  }
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("OpenRouter returned an empty response.");
  return content;
}