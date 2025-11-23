# 📝 دليل إضافة المتغيرات البيئية في Vercel - خطوة بخطوة

## 🎯 الخطوات بالتفصيل:

### الخطوة 1: اذهب إلى Vercel Dashboard
1. افتح: https://vercel.com
2. سجل دخول بحسابك
3. ستجد قائمة المشاريع

---

### الخطوة 2: اختر مشروعك
1. ابحث عن مشروع `Royal-chat` في القائمة
2. اضغط على اسم المشروع

---

### الخطوة 3: اذهب إلى Settings
1. في أعلى الصفحة، ستجد قائمة:
   - **Overview** | **Deployments** | **Analytics** | **Settings** | **Team**
2. اضغط على **Settings**

---

### الخطوة 4: اذهب إلى Environment Variables
1. في القائمة الجانبية اليسرى، ستجد:
   - General
   - **Environment Variables** ← اضغط هنا
   - Git
   - Domains
   - Functions
   - ... إلخ

---

### الخطوة 5: أضف المتغيرات
1. ستجد زر **Add New** أو **+ Add** في أعلى الصفحة
2. اضغط عليه
3. ستظهر نافذة لإضافة متغير جديد

---

### الخطوة 6: أضف كل متغير (6 متغيرات أساسية)

#### المتغير 1: MONGODB_URI
```
Key: MONGODB_URI
Value: mongodb+srv://mazenjamal19991_db_user:4m49vnFecshgUVCz@royal-chat-cluster.jz1fkos.mongodb.net/royal-chat?retryWrites=true&w=majority
Environment: ☑️ Production ☑️ Preview ☑️ Development
```
- اضغط **Save**

---

#### المتغير 2: VAPID_PUBLIC_KEY
```
Key: VAPID_PUBLIC_KEY
Value: BHgW01VE4r4B2LrclRaxqar0nq4oNQSp3rX-oogWAd4mM8LP4Vi4LAjiuSXwxtuJ8a_OP2bCPCsN-rMENZu-BDM
Environment: ☑️ Production ☑️ Preview ☑️ Development
```
- اضغط **Save**

---

#### المتغير 3: VAPID_PRIVATE_KEY
```
Key: VAPID_PRIVATE_KEY
Value: nbulvES956CiVJi2Ugurcs17MQ99wAyjmmcvpJyz0H0
Environment: ☑️ Production ☑️ Preview ☑️ Development
```
- اضغط **Save**

---

#### المتغير 4: VAPID_SUBJECT
```
Key: VAPID_SUBJECT
Value: mailto:mazenjamal19991@gmail.com
Environment: ☑️ Production ☑️ Preview ☑️ Development
```
- اضغط **Save**

---

#### المتغير 5: NEXT_PUBLIC_VAPID_PUBLIC_KEY
```
Key: NEXT_PUBLIC_VAPID_PUBLIC_KEY
Value: BHgW01VE4r4B2LrclRaxqar0nq4oNQSp3rX-oogWAd4mM8LP4Vi4LAjiuSXwxtuJ8a_OP2bCPCsN-rMENZu-BDM
Environment: ☑️ Production ☑️ Preview ☑️ Development
```
- اضغط **Save**

---

#### المتغير 6: NEXT_PUBLIC_WS_URL
```
Key: NEXT_PUBLIC_WS_URL
Value: wss://royal-chat-production-19b3.up.railway.app
Environment: ☑️ Production ☑️ Preview ☑️ Development
```
- اضغط **Save**

---

## 📍 المسار الكامل في Vercel:

```
Vercel Dashboard
  └── مشروعك (Royal-chat)
      └── Settings (في القائمة العلوية)
          └── Environment Variables (في القائمة الجانبية اليسرى)
              └── Add New (زر في أعلى الصفحة)
                  └── أضف كل متغير واحد تلو الآخر
```

---

## 🖼️ وصف الشاشة:

### بعد الضغط على Settings:
سترى قائمة جانبية مثل:
```
Settings
├── General
├── Environment Variables ← اضغط هنا
├── Git
├── Domains
├── Functions
└── ...
```

### في صفحة Environment Variables:
ستجد:
- قائمة بالمتغيرات الموجودة (إن وجدت)
- زر **Add New** أو **+ Add** في أعلى الصفحة
- جدول يحتوي على:
  - **Key** (اسم المتغير)
  - **Value** (قيمة المتغير - مخفية)
  - **Environment** (Production/Preview/Development)

---

## ✅ بعد إضافة جميع المتغيرات:

1. **تحقق من القائمة:**
   - يجب أن ترى 6 متغيرات في القائمة

2. **أعد النشر:**
   - اذهب إلى **Deployments**
   - اضغط على آخر deployment
   - اضغط **Redeploy** (أو انتظر حتى يتم النشر تلقائياً)

---

## ⚠️ ملاحظات مهمة:

1. **Environment:**
   - اختر **Production** على الأقل (مطلوب)
   - يمكنك اختيار **Preview** و **Development** أيضاً

2. **Value:**
   - انسخ القيمة بالضبط كما هي
   - لا تضيف مسافات إضافية

3. **بعد النشر:**
   - بعد الحصول على رابط Vercel، أضف:
     - `ALLOWED_ORIGINS` = `https://YOUR_VERCEL_LINK.vercel.app`
     - `NEXT_PUBLIC_APP_URL` = `https://YOUR_VERCEL_LINK.vercel.app`

---

## 🔗 الروابط المباشرة:

إذا كان لديك رابط مباشر لمشروعك:
```
https://vercel.com/YOUR_TEAM/Royal-chat/settings/environment-variables
```

---

## 📝 ملخص سريع:

1. ✅ Vercel.com → مشروعك → Settings → Environment Variables
2. ✅ اضغط "Add New"
3. ✅ أضف 6 متغيرات (انسخ من `ALL_ENV_VARIABLES_COMPLETE.txt`)
4. ✅ اختر Environment: Production
5. ✅ احفظ كل متغير
6. ✅ أعد النشر

---

## ✅ تم!

بعد إضافة جميع المتغيرات، سيتم النشر تلقائياً أو يمكنك إعادة النشر يدوياً.
