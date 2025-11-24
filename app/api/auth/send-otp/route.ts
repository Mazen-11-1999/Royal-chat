import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import twilio from 'twilio';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/royal-chat';

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client only if credentials are available
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

// OTP Schema
const OTPSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true, index: true },
  email: { type: String, required: false, default: '' },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// User Schema
const UserSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  avatar: { type: String, default: '' },
  email: { type: String, default: '' },
  status: { type: String, enum: ['online', 'offline', 'away', 'busy', 'invisible'], default: 'offline' },
  lastSeen: { type: Date, default: Date.now },
  bio: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Generate OTP code
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Format phone number (add country code if missing)
function formatPhoneNumber(phoneNumber: string): string {
  // Remove any non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');

  // If it doesn't start with country code, assume it's Yemen (+967)
  if (!cleaned.startsWith('967')) {
    return `+967${cleaned}`;
  }

  return `+${cleaned}`;
}

// Connect to MongoDB with better error handling
async function connectDB() {
  if (mongoose.connections[0].readyState) {
    return;
  }

  // Check if MONGODB_URI is set
  if (!process.env.MONGODB_URI || MONGODB_URI.includes('localhost')) {
    console.error('❌ MONGODB_URI not set or using localhost');
    throw new Error('MONGODB_URI not configured in Vercel Environment Variables');
  }

  // Log connection attempt (without password)
  const uriParts = MONGODB_URI.split('@');
  if (uriParts.length > 1) {
    const userPart = uriParts[0].split('//')[1]?.split(':')[0] || 'unknown';
    console.log(`🔌 Attempting to connect to MongoDB as user: ${userPart}`);
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
    });
    console.log('✅ Connected to MongoDB');
  } catch (error: any) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error name:', error.name);

    // Provide more helpful error message
    if (error.message?.includes('whitelist') || error.message?.includes('IP') || error.code === 'ENOTFOUND') {
      throw new Error('MongoDB Atlas IP Whitelist Error: يرجى إضافة 0.0.0.0/0 إلى MongoDB Atlas Network Access. راجع MONGODB_ATLAS_WHITELIST_FIX.md');
    }
    if (error.message?.includes('authentication') || error.message?.includes('Authenticate') || error.code === 18 || error.code === 8000) {
      throw new Error('MongoDB Authentication Error: يرجى التحقق من MONGODB_URI في Vercel Environment Variables. تأكد من أن username و password صحيحين. القيمة الصحيحة: mongodb+srv://mazenjamal19991_db_user:4m49vnFecshgUVCz@royal-chat-cluster.jz1fkos.mongodb.net/royal-chat?retryWrites=true&w=majority');
    }
    if (error.message?.includes('bad auth') || error.message?.includes('Authentication failed')) {
      throw new Error('MongoDB Authentication Failed: يرجى التحقق من Database User في MongoDB Atlas. تأكد من أن username و password صحيحين في MONGODB_URI.');
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, email } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, message: 'رقم الهاتف مطلوب' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Get models
    const OTP = mongoose.models.OTP || mongoose.model('OTP', OTPSchema);
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    // Check if user exists
    const existingUser = await User.findOne({ phoneNumber });

    // Generate OTP
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete old OTPs for this phone number
    await OTP.deleteMany({ phoneNumber, verified: false });

    // Save new OTP
    await OTP.create({
      phoneNumber,
      email: email || '',
      code,
      expiresAt,
      verified: false
    });

    // Format phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Send SMS via Twilio
    if (!client || !twilioPhoneNumber) {
      console.error('Twilio credentials not configured');
      // For development/testing: log the code instead
      console.log(`[DEV MODE] OTP Code for ${phoneNumber}: ${code}`);
      return NextResponse.json({
        success: true,
        message: 'تم إرسال كود التحقق (وضع التطوير - تحقق من Console)'
      });
    }

    try {
      await client.messages.create({
        body: `كود التحقق الخاص بك في Royal Chat هو: ${code}\n\nهذا الكود صالح لمدة 10 دقائق فقط.`,
        from: twilioPhoneNumber,
        to: formattedPhone
      });

      return NextResponse.json({
        success: true,
        message: 'تم إرسال كود التحقق إلى رقم هاتفك'
      });
    } catch (twilioError: any) {
      console.error('Twilio error:', twilioError);

      // Handle Twilio specific errors
      if (twilioError.code === 21211) {
        return NextResponse.json({
          success: false,
          message: 'رقم الهاتف غير صحيح'
        }, { status: 400 });
      }

      if (twilioError.code === 21608) {
        return NextResponse.json({
          success: false,
          message: 'رقم الهاتف غير مدعوم في حساب Twilio التجريبي'
        }, { status: 400 });
      }

      throw twilioError;
    }
  } catch (error: any) {
    console.error('Error in send-otp API route:', error);

    // Provide more specific error messages
    let errorMessage = error.message || 'حدث خطأ في إرسال كود التحقق';

    if (error.message?.includes('authentication') || error.message?.includes('Authenticate')) {
      errorMessage = 'خطأ في المصادقة مع قاعدة البيانات. يرجى التحقق من MONGODB_URI في Vercel Environment Variables.';
    } else if (error.message?.includes('whitelist') || error.message?.includes('IP')) {
      errorMessage = 'خطأ في IP Whitelist. يرجى إضافة Vercel IPs إلى MongoDB Atlas Network Access.';
    } else if (error.message?.includes('connection')) {
      errorMessage = 'خطأ في الاتصال بقاعدة البيانات. يرجى التحقق من MONGODB_URI.';
    }

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
