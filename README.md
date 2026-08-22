# Omnia AI — دليل النشر على Vercel

## ما الذي تغيّر؟
- مفتاح Groq API **لم يعد موجوداً** داخل `index.html`.
- كل الطلبات تمر الآن عبر دالة سيرفر خفية: `api/chat.js`.
- المفتاح الحقيقي يُخزَّن كمتغير بيئة (Environment Variable) على Vercel، ولا يظهر أبداً في المتصفح أو في كود المصدر.

## ⚠️ خطوة أولى مهمة جداً
المفتاح القديم `gsk_y0Dj4Pm...` كان مكتوباً بشكل مكشوف في الملف الأصلي، لذلك:
1. اذهب إلى https://console.groq.com/keys
2. احذف (Revoke) المفتاح القديم فوراً.
3. أنشئ مفتاحاً جديداً — هذا هو الذي ستستخدمه في الخطوات التالية.

## خطوات النشر على Vercel

### 1. أنشئ حساب Vercel (إن لم يكن لديك)
https://vercel.com/signup

### 2. ارفع المشروع إلى GitHub
```bash
cd omnia-ai
git init
git add .
git commit -m "Omnia AI - initial deploy"
git branch -M main
git remote add origin https://github.com/USERNAME/omnia-ai.git
git push -u origin main
```
(لاحظ أن `.gitignore` يمنع رفع أي ملف `.env` بالخطأ)

### 3. استورد المشروع في Vercel
- افتح https://vercel.com/new
- اختر المستودع (Repository) الذي رفعته
- اضغط **Import**

### 4. أضف متغير البيئة (هذه هي الخطوة الأهم)
في صفحة إعدادات المشروع على Vercel:
- اذهب إلى **Settings → Environment Variables**
- أضف:
  - **Name:** `GROQ_API_KEY`
  - **Value:** المفتاح الجديد الذي أنشأته
  - **Environment:** Production, Preview, Development (اختر الكل)
- احفظ ثم اضغط **Deploy** (أو Redeploy إذا كان قد نُشر مسبقاً)

### 5. انتهى 🎉
موقعك سيكون على رابط مثل: `https://omnia-ai.vercel.app`
والمفتاح لن يكون مرئياً لأي زائر مهما فتح "عرض المصدر" أو أدوات المطور.

## التجربة محلياً (اختياري)
```bash
npm install -g vercel
cp .env.example .env.local
# ضع مفتاحك في .env.local
vercel dev
```

## ⚠️ ملاحظة عن الموديلات
Groq يوقف (Deprecate) بعض الموديلات القديمة بين فترة وأخرى بدون سابق إنذار طويل (مثلاً `llama-3.3-70b-versatile` أصبح متوقفاً). إذا ظهرت رسالة خطأ تقول أن الموديل غير موجود:
1. راجع القائمة الرسمية المحدثة على: https://console.groq.com/docs/models
2. حدّث القيم في `ALLOWED_MODELS` و `DEFAULT_MODEL` داخل `api/chat.js`
3. حدّث خيارات `<select id="modelSelect">` في `index.html` لتطابقها

## ملاحظات أمان إضافية
- الدالة `api/chat.js` تتحقق من أن الـ model المطلوب من ضمن قائمة مسموحة، لمنع إساءة استخدام الـ API.
- **Rate Limiting مفعّل:** كل IP مسموح له بـ 10 رسائل كل دقيقة. من يتجاوز الحد يستقبل رسالة خطأ (429) بدل ما نستهلك رصيدك على Groq. يمكنك تعديل الرقمين `WINDOW_MS` و `MAX_REQUESTS` في أعلى ملف `api/chat.js` حسب حاجتك.
  - هذا الحل "في الذاكرة" (in-memory) وهو تقريبي — كافٍ لصد البوتات البسيطة، لكنه غير دقيق 100% عند وجود زيارات عالية جداً أو عدة نسخ من الدالة تعمل بالتوازي.
  - لو موقعك كبر وصار عليه ضغط حقيقي، الخطوة التالية الموصى بها هي الترقية إلى **Upstash Redis** (له باقة مجانية) للحصول على عداد دقيق ودائم عبر كل الخوادم.
- لا تضع أبداً أي مفتاح API مباشرة داخل ملفات HTML/JS التي تُرسل للمتصفح مستقبلاً.
