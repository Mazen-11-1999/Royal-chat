import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/royal-chat';

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

// Connect to MongoDB with better error handling
async function connectDB() {
  if (mongoose.connections[0].readyState) {
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
    });
    console.log('✅ Connected to MongoDB');
  } catch (error: any) {
    console.error('❌ MongoDB connection error:', error);
    // Provide more helpful error message
    if (error.message?.includes('whitelist') || error.message?.includes('IP')) {
      throw new Error('MongoDB Atlas IP Whitelist Error: يرجى إضافة Vercel IPs إلى MongoDB Atlas Network Access. راجع MONGODB_ATLAS_WHITELIST_FIX.md');
    }
    if (error.message?.includes('authentication') || error.message?.includes('Authenticate')) {
      throw new Error('MongoDB Authentication Error: يرجى التحقق من MONGODB_URI في Vercel Environment Variables. تأكد من أن username و password صحيحين.');
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
    const { phoneNumber, code } = body;

    if (!phoneNumber || !code) {
      return NextResponse.json(
        { success: false, message: 'رقم الهاتف وكود التحقق مطلوبان' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Get models
    const OTP = mongoose.models.OTP || mongoose.model('OTP', OTPSchema);
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    const otp = await OTP.findOne({
      phoneNumber,
      code,
      verified: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otp) {
      return NextResponse.json({
        success: false,
        message: 'كود التحقق غير صحيح أو منتهي الصلاحية'
      }, { status: 400 });
    }

    // Mark OTP as verified
    otp.verified = true;
    await otp.save();

    // Check if user exists
    let user = await User.findOne({ phoneNumber });

    if (!user) {
      // Create new user
      user = await User.create({
        phoneNumber,
        email: otp.email || '',
        name: `User ${phoneNumber}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${phoneNumber}`,
        status: 'online',
        isVerified: true
      });
    } else {
      // Update user
      user.isVerified = true;
      user.status = 'online';
      user.lastSeen = new Date();
      await user.save();
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        phoneNumber: user.phoneNumber,
        name: user.name,
        avatar: user.avatar,
        email: user.email,
        status: user.status,
        isVerified: user.isVerified
      },
      message: 'تم التحقق بنجاح'
    });
  } catch (error: any) {
    console.error('Error in verify-otp API route:', error);

    // Provide more specific error messages
    let errorMessage = error.message || 'حدث خطأ في التحقق';

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
