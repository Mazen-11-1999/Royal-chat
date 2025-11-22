# إعداد الإشعارات الفورية (Push Notifications)

تم إضافة نظام إشعارات فورية كامل للتطبيق. هذا النظام يسمح بإرسال الإشعارات للمستخدمين حتى عندما يكون التطبيق مغلقاً.

## ما تم إضافته:

### 1. Service Worker (`public/sw.js`)
- يعمل في الخلفية حتى عند إغلاق التطبيق
- يتلقى الإشعارات من الخادم
- يعرض الإشعارات للمستخدم
- يتعامل مع النقر على الإشعارات

### 2. PWA Manifest (`public/manifest.json`)
- يجعل التطبيق قابلاً للتثبيت كتطبيق PWA
- يضيف أيقونات التطبيق
- يضيف اختصارات سريعة

### 3. NotificationService محدث (`app/services/NotificationService.ts`)
- دعم كامل لـ Push Notifications
- تسجيل تلقائي في Service Worker
- إدارة الاشتراكات
- دعم الإشعارات في الخلفية

### 4. قاعدة البيانات
- نموذج `PushSubscription` لحفظ اشتراكات المستخدمين
- تتبع الأجهزة المتعددة لكل مستخدم

### 5. API Endpoints
- `POST /api/notifications/subscribe` - تسجيل اشتراك جديد
- `POST /api/notifications/unsubscribe` - إلغاء الاشتراك
- `GET /api/notifications/subscriptions/:userId` - الحصول على اشتراكات المستخدم
- `GET /api/notifications/vapid-key` - الحصول على VAPID Public Key

### 6. إرسال الإشعارات من الخادم
- يتم إرسال الإشعارات تلقائياً عند وصول رسالة جديدة
- يتم إرسالها فقط للمستخدمين غير المتصلين حالياً
- دعم الأجهزة المتعددة

## الإعداد المطلوب:

### 1. تثبيت الحزم المطلوبة:
```bash
npm install web-push
npm install --save-dev @types/web-push
```

### 2. إنشاء VAPID Keys:

يمكنك إنشاء VAPID keys باستخدام:

```bash
npx web-push generate-vapid-keys
```

أو استخدام أداة online: https://web-push-codelab.glitch.me/

### 3. إضافة Environment Variables:

أضف هذه المتغيرات إلى ملف `.env` أو متغيرات البيئة:

```env
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:your-email@example.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
```

### 4. إنشاء الأيقونات:

يحتاج التطبيق إلى أيقونات في مجلد `public`:
- `icon-192x192.png` - أيقونة 192x192
- `icon-512x512.png` - أيقونة 512x512

يمكنك استخدام أي صورة PNG بحجم مناسب.

## كيفية العمل:

1. **عند تسجيل الدخول:**
   - يتم تهيئة Service Worker تلقائياً
   - يتم طلب إذن الإشعارات من المستخدم
   - يتم تسجيل الاشتراك في قاعدة البيانات

2. **عند وصول رسالة جديدة:**
   - يتحقق الخادم من المستخدمين المتصلين
   - يرسل إشعارات Push للمستخدمين غير المتصلين
   - يعرض Service Worker الإشعارات

3. **عند النقر على الإشعار:**
   - يفتح التطبيق
   - ينتقل مباشرة إلى المحادثة

## الميزات:

✅ إشعارات في الخلفية (حتى عند إغلاق التطبيق)
✅ دعم الأجهزة المتعددة
✅ إشعارات ذكية (لا ترسل للمستخدمين المتصلين)
✅ دعم RTL/LTR
✅ صوت واهتزاز
✅ إدارة الاشتراكات
✅ PWA Support

## ملاحظات مهمة:

1. **HTTPS مطلوب:** Push Notifications تعمل فقط على HTTPS (أو localhost للتطوير)

2. **VAPID Keys:** يجب أن تكون VAPID keys صحيحة وإلا لن تعمل الإشعارات

3. **الأيقونات:** تأكد من وجود الأيقونات في مجلد `public`

4. **Service Worker:** يجب أن يكون Service Worker في مجلد `public` وليس `app`

5. **Browser Support:** 
   - Chrome/Edge: ✅ كامل الدعم
   - Firefox: ✅ كامل الدعم
   - Safari: ⚠️ يحتاج إعدادات إضافية
   - Mobile Browsers: ✅ يعمل على Chrome Mobile و Firefox Mobile

## الاختبار:

1. افتح التطبيق في المتصفح
2. سجل الدخول
3. افتح Developer Tools > Application > Service Workers
4. تأكد من تسجيل Service Worker
5. افتح Application > Notifications
6. تأكد من تسجيل الاشتراك
7. أرسل رسالة من حساب آخر
8. يجب أن تظهر الإشعارات حتى عند إغلاق التطبيق

## استكشاف الأخطاء:

- إذا لم تظهر الإشعارات:
  1. تحقق من VAPID keys
  2. تحقق من تسجيل Service Worker
  3. تحقق من إذن الإشعارات في المتصفح
  4. تحقق من Console للأخطاء

- إذا لم يتم تسجيل Service Worker:
  1. تأكد من أن الملف موجود في `public/sw.js`
  2. تأكد من أن HTTPS مفعّل (أو localhost)
  3. تحقق من Console للأخطاء

## الخطوات التالية:

1. إنشاء VAPID keys
2. إضافة Environment Variables
3. إنشاء الأيقونات
4. تثبيت الحزم: `npm install`
5. اختبار الإشعارات


