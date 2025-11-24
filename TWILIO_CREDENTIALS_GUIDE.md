# 🔑 دليل الحصول على Twilio Credentials

## ⚠️ ملاحظة مهمة:

الكود `FM8CYRAB1D9H7MBUK3UYRYEH` هو **رمز التحقق فقط** - لا يُستخدم في الكود!

---

## 📋 ما تحتاجه (3 أشياء):

### 1️⃣ Account SID
- يبدأ بـ `AC...`
- مثال: `AC1234567890abcdef1234567890abcdef`

### 2️⃣ Auth Token
- سلسلة طويلة من الأحرف
- مثال: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

### 3️⃣ Phone Number
- يبدأ بـ `+`
- مثال: `+1234567890`

---

## 🔍 كيفية الحصول عليها:

### الخطوة 1: افتح Twilio Dashboard

1. اذهب إلى: https://console.twilio.com
2. سجّل الدخول بحسابك

---

### الخطوة 2: الحصول على Account SID و Auth Token

1. في **الصفحة الرئيسية** (Dashboard):
   - ستجد **Account SID** في الأعلى
   - مثال: `AC1234567890abcdef1234567890abcdef`
   - **انسخه** ✅

2. للحصول على **Auth Token**:
   - في نفس الصفحة، ستجد **Auth Token**
   - اضغط **"View"** لإظهاره
   - **انسخه** ✅

**موقعها في Dashboard:**
```
┌─────────────────────────────────────┐
│  Account SID: AC1234...            │ ← انسخ هذا
│  Auth Token: [View] [Copy]         │ ← اضغط View ثم انسخ
└─────────────────────────────────────┘
```

---

### الخطوة 3: الحصول على Phone Number

1. في Twilio Dashboard:
   - اضغط **"Phone Numbers"** من القائمة الجانبية
   - أو اذهب إلى: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming

2. إذا كان لديك رقم بالفعل:
   - ستجد قائمة بالأرقام
   - انسخ الرقم (مثل: `+1234567890`)

3. إذا لم يكن لديك رقم:
   - اضغط **"Buy a number"**
   - اختر **Country** (مثل: United States)
   - اختر **Capabilities**: SMS ✓
   - اضغط **"Search"**
   - اختر رقم و اضغط **"Buy"**
   - انسخ الرقم ✅

---

## 📝 مثال على القيم:

```
TWILIO_ACCOUNT_SID=AC1234567890abcdef1234567890abcdef
TWILIO_AUTH_TOKEN=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
TWILIO_PHONE_NUMBER=+1234567890
```

---

## ✅ بعد الحصول على القيم:

### في Vercel:

1. اذهب إلى Project → Settings → Environment Variables
2. أضف المتغيرات التالية:

#### 1. TWILIO_ACCOUNT_SID:
```
Name: TWILIO_ACCOUNT_SID
Value: AC1234567890abcdef1234567890abcdef
Environment: Production, Preview, Development
```

#### 2. TWILIO_AUTH_TOKEN:
```
Name: TWILIO_AUTH_TOKEN
Value: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
Environment: Production, Preview, Development
```

#### 3. TWILIO_PHONE_NUMBER:
```
Name: TWILIO_PHONE_NUMBER
Value: +1234567890
Environment: Production, Preview, Development
```

---

## 🎯 الخلاصة:

1. ✅ الكود `FM8CYRAB1D9H7MBUK3UYRYEH` للتحقق فقط - لا يُستخدم
2. ⏳ احصل على **Account SID** من Dashboard
3. ⏳ احصل على **Auth Token** من Dashboard
4. ⏳ احصل على **Phone Number** من Phone Numbers
5. ✅ أضفهم في Vercel Environment Variables
6. ✅ Redeploy

---

## 🆘 إذا لم تجدها:

- **Account SID**: في الصفحة الرئيسية (Dashboard) في الأعلى
- **Auth Token**: في نفس الصفحة، اضغط "View"
- **Phone Number**: Phone Numbers → Manage → Buy a number

---

## 📸 موقعها في Dashboard:

```
Twilio Console
├── Dashboard (الصفحة الرئيسية)
│   ├── Account SID ← هنا
│   └── Auth Token ← هنا
│
└── Phone Numbers
    └── Manage → Buy a number ← هنا
```

---

**بعد إضافة هذه القيم في Vercel، سيتم إرسال SMS فعلياً!** 📱
