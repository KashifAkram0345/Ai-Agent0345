import type { MessageDocument } from "@/lib/models/Message";

type AgentMessage = { role: "system" | "user" | "assistant"; content: string };

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
  const baseUrl = (process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/$/, "");
  const model = process.env.OLLAMA_MODEL || "llama3.2";
  const tool = toolResult(input, history);
  const conversation: AgentMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-12).map((message) => ({ role: message.role, content: message.content })),
    ...(tool ? [{ role: "system" as const, content: `[Safe tool result]\n${tool}` }] : []),
    { role: "user", content: input },
  ];
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: conversation, stream: false }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!response.ok) throw new Error(`Ollama returned ${response.status}. Check OLLAMA_BASE_URL and model availability.`);
  const data = await response.json() as { message?: { content?: string } };
  const content = data.message?.content?.trim();
  if (!content) throw new Error("Ollama returned an empty response.");
  return content;
}