# 🔧 تحديث WebSocket URL في Vercel

## الرابط من Railway
```
royal-chat-production-f7c7.up.railway.app
```

---

## ✅ الخطوات

### 1️⃣ اذهب إلى Vercel Dashboard
1. افتح: https://vercel.com
2. سجل الدخول
3. اختر Project: **royal-chat**

---

### 2️⃣ افتح Environment Variables
1. اضغط **Settings** (في القائمة الجانبية)
2. اضغط **Environment Variables** (في القائمة الفرعية)

---

### 3️⃣ ابحث عن NEXT_PUBLIC_WS_URL
1. في قائمة Environment Variables، ابحث عن: `NEXT_PUBLIC_WS_URL`
2. إذا وجدته:
   - اضغط على **Edit** (أو أيقونة القلم)
   - انتقل للخطوة 4
3. إذا لم تجده:
   - اضغط على **Add New**
   - في حقل **Key**: اكتب `NEXT_PUBLIC_WS_URL`
   - انتقل للخطوة 4

---

### 4️⃣ الصق القيمة الصحيحة
1. في حقل **Value**:
   - احذف أي قيمة موجودة
   - الصق هذه القيمة **بالضبط**:
   ```
   wss://royal-chat-production-f7c7.up.railway.app
   ```

   ⚠️ **مهم**: يجب أن يبدأ بـ `wss://` (وليس `ws://` أو `https://`)

2. تأكد من أن **Environment** يحتوي على:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

3. اضغط **Save**

---

### 5️⃣ Redeploy التطبيق
1. اذهب إلى **Deployments** (في القائمة الجانبية)
2. اختر آخر deployment
3. اضغط على **...** (ثلاث نقاط) → **Redeploy**
   - أو اضغط على **Redeploy** مباشرة
4. انتظر 2-4 دقائق حتى يكتمل الـ deployment

---

## ✅ التحقق من الحل

### بعد Redeploy:
1. افتح التطبيق: https://royal-chat-eight.vercel.app
2. افتح Developer Tools (F12)
3. اذهب إلى **Console**
4. يجب أن ترى:
   - ✅ `🔌 Connecting to WebSocket: wss://royal-chat-production-f7c7.up.railway.app`
   - ✅ `✅ WebSocket connected` (بعد بضع ثوانٍ)

5. يجب ألا ترى أخطاء WebSocket ❌

---

## 🔍 إذا استمرت المشكلة

### تحقق من:

1. **Railway Service Status**:
   - اذهب إلى Railway Dashboard
   - تأكد من أن Service يعمل (Status: Running)
   - تحقق من Logs للتأكد من عدم وجود أخطاء

2. **Railway Environment Variables**:
   - تأكد من أن `MONGODB_URI` موجود في Railway
   - تأكد من أن `PORT` مضبوط (عادة 8080)

3. **Vercel Environment Variables**:
   - تأكد من أن `NEXT_PUBLIC_WS_URL` يبدأ بـ `wss://`
   - تأكد من عدم وجود مسافات إضافية في البداية أو النهاية
   - تأكد من أنه موجود في **جميع** Environments

---

## 📝 ملاحظات مهمة

- ⚠️ **يجب أن يبدأ الرابط بـ `wss://`** (للاتصال الآمن عبر HTTPS)
- ✅ بعد تحديث Environment Variables، يجب عمل **Redeploy**
- ✅ Vercel يحتاج إلى 2-4 دقائق لتطبيق التغييرات
- ✅ Railway يحتاج إلى بضع ثوانٍ لبدء Service

---

## 🆘 إذا لم يعمل بعد

1. تحقق من **Railway Logs**:
   - اذهب إلى Railway → Service → **Logs**
   - ابحث عن أي أخطاء متعلقة بـ MongoDB أو Socket.io

2. تحقق من **Vercel Build Logs**:
   - اذهب إلى Vercel → Deployments → آخر deployment → **Build Logs**
   - ابحث عن أي أخطاء

3. أرسل لي:
   - لقطة شاشة من Vercel Environment Variables (مع إخفاء القيم الحساسة)
   - لقطة شاشة من Railway Service Status
   - لقطة شاشة من Console (أخطاء WebSocket إن وجدت)
