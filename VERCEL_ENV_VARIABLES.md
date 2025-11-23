# 🔐 متغيرات البيئة لـ Vercel - Environment Variables

## 📋 قائمة المتغيرات المطلوبة

### ✅ المتغيرات الأساسية (مطلوبة)

#### 1. **MONGODB_URI**
- **الاسم:** `MONGODB_URI`
- **القيمة:** `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/royal-chat?retryWrites=true&w=majority`
- **الوصف:** رابط الاتصال بقاعدة بيانات MongoDB Atlas
- **كيف تحصل عليه:** من [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) → Connect → Connect your application

---

#### 2. **VAPID_PUBLIC_KEY**
- **الاسم:** `VAPID_PUBLIC_KEY`
- **القيمة:** (مفتاح عام - Public Key)
- **الوصف:** المفتاح العام لـ VAPID للإشعارات
- **كيف تحصل عليه:** شغّل `npx web-push generate-vapid-keys` في Terminal

---

#### 3. **VAPID_PRIVATE_KEY**
- **الاسم:** `VAPID_PRIVATE_KEY`
- **القيمة:** (مفتاح خاص - Private Key)
- **الوصف:** المفتاح الخاص لـ VAPID للإشعارات
- **كيف تحصل عليه:** من نفس الأمر السابق `npx web-push generate-vapid-keys`

---

#### 4. **VAPID_SUBJECT**
- **الاسم:** `VAPID_SUBJECT`
- **القيمة:** `mailto:your-email@example.com`
- **الوصف:** البريد الإلكتروني المرتبط بـ VAPID
- **مثال:** `mailto:mazenjamal19991@gmail.com`

---

#### 5. **NEXT_PUBLIC_VAPID_PUBLIC_KEY**
- **الاسم:** `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- **القيمة:** (نفس قيمة `VAPID_PUBLIC_KEY`)
- **الوصف:** المفتاح العام لـ VAPID للعميل (يجب أن يكون نفس `VAPID_PUBLIC_KEY`)
- **ملاحظة:** هذا المتغير مطلوب في الكود للعميل

---

#### 6. **NEXT_PUBLIC_WS_URL**
- **الاسم:** `NEXT_PUBLIC_WS_URL`
- **القيمة:** `wss://your-socket-server-url`
- **الوصف:** رابط WebSocket للدردشة في الوقت الفعلي
- **مثال:** `wss://royal-chat-socket.railway.app` أو `wss://royal-chat-socket.onrender.com`
- **ملاحظة:** يجب أن يبدأ بـ `wss://` (للاتصال الآمن) وليس `ws://`

---

### ⚙️ المتغيرات الاختيارية (مفيدة)

#### 7. **ALLOWED_ORIGINS**
- **الاسم:** `ALLOWED_ORIGINS`
- **القيمة:** `https://your-app.vercel.app,https://www.your-domain.com`
- **الوصف:** قائمة بالأصول المسموحة (مفصولة بفواصل)
- **مثال:** `https://royal-chat.vercel.app`

---

#### 8. **NEXT_PUBLIC_APP_URL**
- **الاسم:** `NEXT_PUBLIC_APP_URL`
- **القيمة:** `https://your-app.vercel.app`
- **الوصف:** رابط التطبيق الرئيسي
- **مثال:** `https://royal-chat.vercel.app`

---

#### 9. **SMTP_HOST** (اختياري - لإرسال البريد)
- **الاسم:** `SMTP_HOST`
- **القيمة:** `smtp.gmail.com`
- **الوصف:** خادم SMTP لإرسال البريد الإلكتروني

---

#### 10. **SMTP_PORT** (اختياري)
- **الاسم:** `SMTP_PORT`
- **القيمة:** `587`
- **الوصف:** منفذ SMTP

---

#### 11. **SMTP_USER** (اختياري)
- **الاسم:** `SMTP_USER`
- **القيمة:** `your-email@gmail.com`
- **الوصف:** بريد SMTP

---

#### 12. **SMTP_PASS** (اختياري)
- **الاسم:** `SMTP_PASS`
- **القيمة:** (كلمة مرور التطبيق من Gmail)
- **الوصف:** كلمة مرور SMTP

---

#### 13. **NEXT_PUBLIC_TURN_SERVER** (اختياري - للمكالمات)
- **الاسم:** `NEXT_PUBLIC_TURN_SERVER`
- **القيمة:** `turn:your-turn-server.com:3478`
- **الوصف:** خادم TURN للمكالمات الصوتية/المرئية

---

#### 14. **NEXT_PUBLIC_TURN_USERNAME** (اختياري)
- **الاسم:** `NEXT_PUBLIC_TURN_USERNAME`
- **القيمة:** (اسم مستخدم TURN)

---

#### 15. **NEXT_PUBLIC_TURN_PASSWORD** (اختياري)
- **الاسم:** `NEXT_PUBLIC_TURN_PASSWORD`
- **القيمة:** (كلمة مرور TURN)

---

## 📝 كيفية إضافة المتغيرات في Vercel

1. اذهب إلى مشروعك على Vercel
2. اضغط على **Settings** → **Environment Variables**
3. أضف كل متغير بالشكل التالي:
   - **Name:** (اسم المتغير)
   - **Value:** (قيمة المتغير)
   - **Environment:** اختر `Production`, `Preview`, `Development` (أو كلها)

---

## 🎯 المتغيرات الأساسية فقط (للبدء السريع)

إذا كنت تريد البدء بسرعة، أضف هذه المتغيرات فقط:

1. `MONGODB_URI`
2. `VAPID_PUBLIC_KEY`
3. `VAPID_PRIVATE_KEY`
4. `VAPID_SUBJECT`
5. `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (نفس قيمة `VAPID_PUBLIC_KEY`)
6. `NEXT_PUBLIC_WS_URL`

---

## ⚠️ ملاحظات مهمة

1. **VAPID Keys:** يجب أن تكون `NEXT_PUBLIC_VAPID_PUBLIC_KEY` نفس قيمة `VAPID_PUBLIC_KEY`
2. **WebSocket URL:** يجب أن يبدأ بـ `wss://` في الإنتاج (ليس `ws://`)
3. **MongoDB URI:** تأكد من استبدال `<password>` بكلمة المرور الفعلية
4. **Environment:** في Vercel، يمكنك اختيار البيئة (Production/Preview/Development) لكل متغير

---

## 🔑 توليد VAPID Keys

```bash
npx web-push generate-vapid-keys
```

ستحصل على:
- **Public Key:** ضعه في `VAPID_PUBLIC_KEY` و `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- **Private Key:** ضعه في `VAPID_PRIVATE_KEY`
- **Subject:** استخدم `mailto:your-email@example.com` في `VAPID_SUBJECT`
