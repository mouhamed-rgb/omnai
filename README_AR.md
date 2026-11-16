# OMNIA AI MOBILE

تطبيق Android باستخدام Flutter/Dart مع Backend مستقل على Vercel ومزوّد Groq.

## المجلدات
- flutter_app: تطبيق Flutter.
- backend: واجهة API مستقلة.
- .github/workflows: بناء APK عبر GitHub Actions.

## نشر الخادم
1. أنشئ مشروع Vercel جديداً واربطه بهذا المستودع.
2. اجعل Root Directory هو backend.
3. أضف متغير بيئة باسم GROQ_API_KEY وضع فيه مفتاح Groq الجديد.
4. انشر المشروع، ثم استخدم رابط النشر في إعداد API_BASE_URL أدناه.

لا تضع مفتاح Groq داخل Flutter أو GitHub. إذا سبق كشف مفتاح قديم، ألغِه وأنشئ مفتاحاً جديداً.

## إعداد بناء APK
في GitHub افتح Settings ثم Secrets and variables ثم Actions ثم Variables.
أنشئ متغيراً باسم API_BASE_URL وضع فيه رابط Backend المنشور دون شرطة مائلة في النهاية.
بعدها افتح Actions وشغّل Build OMNIA AI Mobile APK، ثم نزّل Artifact المسمى omnia-ai-mobile-release.

## تشغيل محلي
من مجلد flutter_app:
```bash
flutter pub get
flutter run --dart-define=API_BASE_URL=https://YOUR-BACKEND.vercel.app
```
