// api/chat.js
// هذه الدالة تعمل على سيرفر Vercel فقط، والمفتاح محفوظ كمتغير بيئة
// ولا يظهر أبداً في كود المتصفح أو للمستخدم النهائي.

// قائمة موديلات الإنتاج الحالية على Groq (محدّثة أغسطس 2026)
// راجع القائمة الرسمية دائماً على: https://console.groq.com/docs/models
const ALLOWED_MODELS = new Set([
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'groq/compound',
  'groq/compound-mini',
]);
const DEFAULT_MODEL = 'openai/gpt-oss-120b';

// ── Rate Limiting بسيط (في الذاكرة) ──
// كل IP مسموح له بـ MAX_REQUESTS طلب خلال WINDOW_MS.
// ملاحظة: هذا العداد يعيش داخل "instance" واحدة من الدالة على Vercel،
// فهو تقريبي وليس دقيقاً 100% عبر كل الخوادم، لكنه كافٍ لصد
// الاستخدام العشوائي والبوتات البسيطة. للحماية الدقيقة والدائمة
// (خصوصاً مع زيارات عالية) يُفضّل الترقية لاحقاً إلى Upstash Redis.
const WINDOW_MS = 60 * 1000; // دقيقة واحدة
const MAX_REQUESTS = 10; // 10 طلبات لكل IP في الدقيقة
const requestLog = new Map(); // ip -> [timestamps]

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  requestLog.set(ip, timestamps);

  // تنظيف دوري بسيط لمنع تضخم الذاكرة
  if (requestLog.size > 5000) {
    for (const [key, arr] of requestLog) {
      if (arr.every((t) => now - t >= WINDOW_MS)) requestLog.delete(key);
    }
  }

  return timestamps.length > MAX_REQUESTS;
}

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

module.exports = async function handler(req, res) {
  // السماح فقط بطلبات POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return res.status(429).json({
      error: `تجاوزت الحد المسموح (${MAX_REQUESTS} رسائل في الدقيقة). حاول بعد قليل.`,
    });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY غير مضبوط في إعدادات السيرفر' });
  }

  try {
    const { model, messages, temperature, max_tokens } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages مطلوبة' });
    }

    // تحقق بسيط من صحة النموذج المطلوب لمنع إساءة الاستخدام
    const safeModel = ALLOWED_MODELS.has(model) ? model : DEFAULT_MODEL;

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: safeModel,
        messages,
        temperature: typeof temperature === 'number' ? temperature : 0.8,
        max_tokens: typeof max_tokens === 'number' ? Math.min(max_tokens, 4096) : 2048,
        stream: false,
      }),
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      return res.status(groqRes.status).json({ error: data.error?.message || 'خطأ من مزود الخدمة' });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('chat.js error:', err);
    return res.status(500).json({ error: 'خطأ داخلي في السيرفر' });
  }
};
