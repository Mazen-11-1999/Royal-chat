# 🚀 دليل النشر - Deployment Guide

## 📦 النشر على GitHub

### 1. إنشاء مستودع جديد على GitHub

1. اذهب إلى [GitHub](https://github.com)
2. اضغط على **New Repository**
3. املأ المعلومات:
   - **Repository name**: `Royal-chat`
   - **Description**: `👑 تطبيق دردشة ملكي متقدم - Advanced Royal Chat Application with Real-time Messaging, Push Notifications, and Premium Features`
   - **Visibility**: Public (أو Private حسب رغبتك)
   - **لا** تضع علامة على "Initialize with README" (لأننا أنشأنا README.md بالفعل)

### 2. رفع المشروع إلى GitHub

افتح Terminal في مجلد المشروع وقم بتنفيذ:

```bash
# تهيئة Git (إذا لم تكن مهيأ)
git init

# إضافة جميع الملفات
git add .

# عمل commit أولي
git commit -m "Initial commit: Royal Chat Application"

# إضافة remote repository
git remote add origin https://github.com/Mazen-11-1999/Royal-chat.git

# رفع الملفات
git branch -M main
git push -u origin main
```

**ملاحظة**: استبدل `YOUR_USERNAME` باسم المستخدم الخاص بك على GitHub

---

## 🌐 النشر على منصة مجانية

### الخيار 1: Vercel (موصى به - مجاني) ⭐

**المميزات:**

- ✅ مجاني تماماً
- ✅ سريع جداً
- ✅ دعم Next.js كامل
- ✅ SSL تلقائي
- ✅ CDN عالمي

**⚠️ ملاحظة مهمة:** قد يطلب Vercel التحقق من رقم الهاتف عند التسجيل. إذا واجهت مشكلة "Too many requests"، انتظر فترة الانتظار أو استخدم Railway كبديل (انظر قسم حل المشاكل أدناه).

**الخطوات:**

1. **سجل حساب على [Vercel](https://vercel.com)**

2. **اربط حساب GitHub:**

   - اضغط على "Import Project"
   - اختر مستودع `Royal-chat`
   - اضغط "Import"

3. **إعدادات المشروع:**

   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

4. **إضافة Environment Variables:**

   ```
   MONGODB_URI=your_mongodb_uri
   VAPID_PUBLIC_KEY=your_public_key
   VAPID_PRIVATE_KEY=your_private_key
   VAPID_SUBJECT=mailto:your-email@example.com
   NEXT_PUBLIC_WS_URL=wss://your-socket-server-url
   ```

5. **نشر Socket.io Server منفصل:**

   - استخدم Railway أو Render للنشر (انظر أدناه)

6. **اضغط "Deploy"**

**النتيجة**: ستحصل على رابط مثل `royal-chat.vercel.app`

---

### الخيار 2: Railway (مجاني مع قيود) 🚂

**المميزات:**

- ✅ مجاني (500 ساعة/شهر)
- ✅ دعم MongoDB
- ✅ دعم Socket.io
- ✅ سهل الإعداد

**الخطوات:**

1. **سجل حساب على [Railway](https://railway.app)**

2. **إنشاء مشروع جديد:**

   - اضغط "New Project"
   - اختر "Deploy from GitHub repo"
   - اختر مستودع `Royal-chat`

3. **إضافة MongoDB:**

   - اضغط "New" → "Database" → "MongoDB"
   - ستحصل على `MONGODB_URI` تلقائياً

4. **إعداد Environment Variables:**

   - اضغط على المشروع → "Variables"
   - أضف:
     ```
     MONGODB_URI=${{MongoDB.MONGODB_URI}}
     VAPID_PUBLIC_KEY=your_public_key
     VAPID_PRIVATE_KEY=your_private_key
     VAPID_SUBJECT=mailto:your-email@example.com
     PORT=8080
     ```

5. **إعدادات النشر:**

   - **Start Command**: `npm run start:server`
   - **Healthcheck Path**: `/api/health` (اختياري)

6. **النشر:**
   - Railway سينشر تلقائياً عند push إلى GitHub

**النتيجة**: ستحصل على رابط مثل `royal-chat.railway.app`

---

### الخيار 3: Render (مجاني مع قيود) 🎨

**المميزات:**

- ✅ مجاني (مع قيود)
- ✅ دعم MongoDB
- ✅ SSL تلقائي

**الخطوات:**

1. **سجل حساب على [Render](https://render.com)**

2. **إنشاء Web Service:**

   - اضغط "New" → "Web Service"
   - اختر "Connect GitHub"
   - اختر مستودع `Royal-chat`

3. **إعدادات الخدمة:**

   - **Name**: `royal-chat`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:server`
   - **Plan**: Free

4. **إضافة MongoDB:**

   - اضغط "New" → "MongoDB"
   - اختر "Free" plan
   - انسخ `MONGODB_URI`

5. **إضافة Environment Variables:**

   ```
   MONGODB_URI=your_mongodb_uri_from_render
   VAPID_PUBLIC_KEY=your_public_key
   VAPID_PRIVATE_KEY=your_private_key
   VAPID_SUBJECT=mailto:your-email@example.com
   PORT=8080
   ```

6. **النشر:**
   - اضغط "Create Web Service"

**النتيجة**: ستحصل على رابط مثل `royal-chat.onrender.com`

---

## 🔧 إعداد MongoDB Atlas (مجاني)

1. **سجل حساب على [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)**

2. **إنشاء Cluster:**

   - اختر "Free" (M0)
   - اختر المنطقة الأقرب
   - اضغط "Create"

3. **إعداد Database Access:**

   - اضغط "Database Access"
   - اضغط "Add New Database User"
   - اختر "Password" authentication
   - أنشئ username و password
   - اضغط "Add User"

4. **إعداد Network Access:**

   - اضغط "Network Access"
   - اضغط "Add IP Address"
   - اختر "Allow Access from Anywhere" (0.0.0.0/0)
   - أو أضف IP محدد

5. **الحصول على Connection String:**
   - اضغط "Connect" على Cluster
   - اختر "Connect your application"
   - انسخ Connection String
   - استبدل `<password>` بكلمة المرور التي أنشأتها

**مثال:**

```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/royal-chat?retryWrites=true&w=majority
```

---

## 🔑 توليد VAPID Keys

```bash
# في Terminal
npx web-push generate-vapid-keys
```

ستحصل على:

- **Public Key**: ضعه في `VAPID_PUBLIC_KEY`
- **Private Key**: ضعه في `VAPID_PRIVATE_KEY`
- **Subject**: استخدم `mailto:your-email@example.com`

---

## ✅ التحقق من النشر

بعد النشر، تحقق من:

1. ✅ الموقع يعمل: افتح الرابط
2. ✅ تسجيل الدخول يعمل
3. ✅ WebSocket يعمل: جرب إرسال رسالة
4. ✅ الإشعارات تعمل: أرسل رسالة من حساب آخر
5. ✅ قاعدة البيانات: تحقق من MongoDB Atlas

---

## 🐛 حل المشاكل الشائعة

### المشكلة: Vercel يطلب رقم هاتف ولا يقبله / "Too many requests"

**الأسباب المحتملة:**

- Vercel يطلب التحقق من رقم الهاتف لأسباب أمنية
- تجاوزت عدد المحاولات المسموح (Rate Limit)
- رقم الهاتف غير مدعوم أو غير صحيح

**الحلول:**

1. **انتظر فترة الانتظار:**

   - اترك الصفحة مفتوحة وانتظر حتى ينتهي العد التنازلي (مثل 44 ثانية)
   - لا تحاول إعادة المحاولة قبل انتهاء الوقت

2. **استخدم رقم هاتف صحيح:**

   - تأكد من أن رقم الهاتف صحيح
   - استخدم رقم هاتف نشط يمكنه استقبال رسائل SMS
   - بعض الأرقام الافتراضية أو المؤقتة قد لا تعمل

3. **جرب بدائل:**

   - استخدم حساب GitHub مباشرة للتسجيل (بدلاً من البريد الإلكتروني)
   - جرب حساب Google أو حساب آخر
   - انتظر 24 ساعة ثم حاول مرة أخرى

4. **استخدم منصة بديلة:**

   - **Railway** (موصى به): لا يحتاج تحقق من رقم الهاتف
   - **Render**: خيار جيد آخر
   - **Netlify**: بديل لـ Vercel

5. **اتصل بدعم Vercel:**
   - إذا استمرت المشكلة، راسل دعم Vercel على [support@vercel.com](mailto:support@vercel.com)
   - أو استخدم [Vercel Discord](https://vercel.com/discord)

**نصيحة سريعة:** إذا كنت تريد النشر فوراً، استخدم **Railway** أو **Render** بدلاً من Vercel - لا يحتاجان تحقق من رقم الهاتف.

---

### المشكلة: WebSocket لا يعمل

**الحل**: تأكد من:

- `NEXT_PUBLIC_WS_URL` يشير إلى Socket.io server
- Socket.io server يعمل على نفس المنصة أو منصة أخرى
- CORS مضبوط بشكل صحيح

### المشكلة: Push Notifications لا تعمل

**الحل**: تأكد من:

- VAPID keys صحيحة
- Service Worker مسجل
- HTTPS مفعل (مطلوب للإشعارات)

### المشكلة: MongoDB لا يتصل

**الحل**: تأكد من:

- `MONGODB_URI` صحيح
- Network Access في MongoDB Atlas يسمح بالاتصال
- Username و Password صحيحين

---

## 📞 الدعم

إذا واجهت أي مشاكل، افتح issue على GitHub أو راسلنا.

---

**نصيحة**: ابدأ بـ Vercel للنشر السريع، ثم استخدم Railway أو Render لـ Socket.io server.
