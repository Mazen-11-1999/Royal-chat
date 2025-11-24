# 📱 إعداد إرسال SMS عبر Twilio - دليل كامل

## ✅ تم التعديل!

تم تعديل الكود لإرسال كود التحقق عبر **SMS** بدلاً من البريد الإلكتروني.

---

## 🔧 إعداد Twilio (خطوة بخطوة)

### الخطوة 1: إنشاء حساب Twilio

1. اذهب إلى: https://www.twilio.com
2. اضغط **"Sign Up"** (مجاني)
3. املأ البيانات:
   - الاسم
   - البريد الإلكتروني
   - كلمة المرور
   - رقم الهاتف (للتحقق)
4. اضغط **"Start your free trial"**

---

### الخطوة 2: الحصول على Account SID و Auth Token

1. بعد تسجيل الدخول، ستظهر Dashboard
2. في الصفحة الرئيسية، ستجد:
   - **Account SID** (مثل: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
   - **Auth Token** (اضغط "View" لإظهاره)
3. انسخهما (ستحتاجهما لاحقاً)

---

### الخطوة 3: الحصول على Phone Number

1. في Twilio Dashboard، اضغط **"Phone Numbers"** → **"Manage"** → **"Buy a number"**
2. اختر:
   - **Country**: حسب رغبتك (للاختبار، اختر أي دولة)
   - **Capabilities**: SMS ✓
3. اضغط **"Search"**
4. اختر رقم و اضغط **"Buy"**
5. انسخ الرقم (مثل: `+1234567890`)

**ملاحظة**: في الحساب المجاني، يمكنك إرسال SMS فقط للأرقام التي تم التحقق منها.

---

### الخطوة 4: التحقق من رقم هاتفك (للاختبار)

1. في Twilio Dashboard، اضغط **"Phone Numbers"** → **"Verified Caller IDs"**
2. اضغط **"Add a new Caller ID"**
3. أدخل رقم هاتفك
4. ستتلقى رسالة SMS برمز التحقق
5. أدخل الرمز للتحقق

**ملاحظة**: في الحساب المجاني، يمكنك إرسال SMS فقط للأرقام الم verified.

---

## 🔑 إضافة Environment Variables في Vercel

### في Vercel Dashboard:

1. اذهب إلى Project → Settings → Environment Variables
2. أضف المتغيرات التالية:

#### 1. TWILIO_ACCOUNT_SID:
```
Name: TWILIO_ACCOUNT_SID
Value: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Environment: Production, Preview, Development
```

#### 2. TWILIO_AUTH_TOKEN:
```
Name: TWILIO_AUTH_TOKEN
Value: your_auth_token_here
Environment: Production, Preview, Development
```

#### 3. TWILIO_PHONE_NUMBER:
```
Name: TWILIO_PHONE_NUMBER
Value: +1234567890
Environment: Production, Preview, Development
```

**ملاحظة**: استبدل القيم بقيمك من Twilio.

---

## 🧪 اختبار الإرسال

### في وضع التطوير (بدون Twilio):

إذا لم تكن متغيرات Twilio موجودة، سيظهر الكود في Console:
```
[DEV MODE] OTP Code for 05xxxxxxxx: 123456
```

### في الإنتاج (مع Twilio):

سيتم إرسال SMS فعلي إلى رقم الهاتف.

---

## 📝 ملاحظات مهمة

### 1. حساب Twilio المجاني:
- ✅ $15.50 رصيد مجاني
- ✅ يمكن إرسال SMS فقط للأرقام الم verified
- ✅ مناسب للاختبار والتطوير

### 2. حساب Twilio المدفوع:
- ✅ يمكن إرسال SMS لأي رقم
- ✅ تكلفة: ~$0.0075 لكل رسالة
- ✅ مناسب للإنتاج

### 3. تنسيق رقم الهاتف:
- الكود يضيف `+967` تلقائياً إذا لم يكن موجوداً
- مثال: `0501234567` → `+9670501234567`

---

## 🔄 بعد إضافة المتغيرات

1. **Redeploy** في Vercel:
   - Project → Deployments → Redeploy
2. **اختبر**:
   - افتح التطبيق
   - أدخل رقم هاتف
   - اضغط "إرسال كود التحقق"
   - تحقق من وصول SMS

---

## 🆘 حل المشاكل

### المشكلة: SMS لا يصل

**الحلول:**
1. تحقق من متغيرات Twilio في Vercel
2. تحقق من أن الرقم في Twilio verified (للحساب المجاني)
3. تحقق من Logs في Vercel
4. تحقق من رصيد Twilio

### المشكلة: "رقم الهاتف غير مدعوم"

**الحل**: في الحساب المجاني، يجب أن يكون الرقم verified في Twilio.

---

## ✅ الخلاصة

1. ✅ تم تثبيت Twilio
2. ✅ تم تعديل الكود لإرسال SMS
3. ✅ تم إزالة حقل البريد الإلكتروني
4. ⏳ يحتاج إعداد Twilio وإضافة Environment Variables

**بعد إضافة متغيرات Twilio في Vercel، سيتم إرسال كود التحقق عبر SMS فعلياً!** 📱
