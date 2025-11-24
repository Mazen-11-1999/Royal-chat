import twilio from 'twilio';
import { OTP, User } from './database.js';

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client only if credentials are available
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

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

// Send OTP via SMS
export async function sendOTP(phoneNumber: string, email?: string): Promise<{ success: boolean; message: string }> {
  try {
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
      return {
        success: true,
        message: 'تم إرسال كود التحقق (وضع التطوير - تحقق من Console)'
      };
    }

    try {
      await client.messages.create({
        body: `كود التحقق الخاص بك في Royal Chat هو: ${code}\n\nهذا الكود صالح لمدة 10 دقائق فقط.`,
        from: twilioPhoneNumber,
        to: formattedPhone
      });

      return {
        success: true,
        message: 'تم إرسال كود التحقق إلى رقم هاتفك'
      };
    } catch (twilioError: any) {
      console.error('Twilio error:', twilioError);

      // Handle Twilio specific errors
      if (twilioError.code === 21211) {
        return {
          success: false,
          message: 'رقم الهاتف غير صحيح'
        };
      }

      if (twilioError.code === 21608) {
        return {
          success: false,
          message: 'رقم الهاتف غير مدعوم في حساب Twilio التجريبي'
        };
      }

      throw twilioError;
    }
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return {
      success: false,
      message: error.message || 'حدث خطأ في إرسال كود التحقق'
    };
  }
}

// Verify OTP
export async function verifyOTP(phoneNumber: string, code: string): Promise<{ success: boolean; user?: any; message: string }> {
  try {
    const otp = await OTP.findOne({
      phoneNumber,
      code,
      verified: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otp) {
      return {
        success: false,
        message: 'كود التحقق غير صحيح أو منتهي الصلاحية'
      };
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

    return {
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
    };
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      message: error.message || 'حدث خطأ في التحقق'
    };
  }
}

// Find users by phone numbers (for contact sync)
export async function findUsersByPhoneNumbers(phoneNumbers: string[]): Promise<any[]> {
  try {
    const users = await User.find({
      phoneNumber: { $in: phoneNumbers },
      isVerified: true
    }).select('phoneNumber name avatar status lastSeen');

    return users.map(user => ({
      id: user._id.toString(),
      phoneNumber: user.phoneNumber,
      name: user.name,
      avatar: user.avatar,
      status: user.status,
      lastSeen: user.lastSeen
    }));
  } catch (error: any) {
    console.error('Error finding users:', error);
    return [];
  }
}
