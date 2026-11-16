const ALLOWED_MODELS = new Set([
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "groq/compound",
  "groq/compound-mini"
]);

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const key = process.env.GROQ_API_KEY;
  if (!key) return res.status(500).json({ error: "Server is missing GROQ_API_KEY" });
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (!ALLOWED_MODELS.has(body?.model)) return res.status(400).json({ error: "Unsupported model" });
    if (!Array.isArray(body?.messages) || body.messages.length < 1 || body.messages.length > 40) {
      return res.status(400).json({ error: "Messages must contain between 1 and 40 items" });
    }
    const messages = body.messages.map((m) => {
      if (!m || !["user", "assistant"].includes(m.role) || typeof m.content !== "string" || m.content.length > 12000) {
        throw new Error("Invalid message format");
      }
      return { role: m.role, content: m.content };
    });
    const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ model: body.model, messages, temperature: 0.7, max_tokens: 2048 })
    });
    const result = await upstream.json();
    if (!upstream.ok) return res.status(upstream.status).json({ error: result?.error?.message || "AI provider request failed" });
    return res.status(200).json(result);
  } catch (e) {
    return res.status(400).json({ error: e.message === "Invalid message format" ? e.message : "Invalid request" });
  }
};
