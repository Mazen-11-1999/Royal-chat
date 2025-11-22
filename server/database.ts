import mongoose from 'mongoose';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/royal-chat';

export async function connectDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

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

// OTP Schema
const OTPSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true, index: true },
  email: { type: String, required: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Conversation Schema
const ConversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isGroup: { type: Boolean, default: false },
  name: { type: String, default: '' },
  avatar: { type: String, default: '' },
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  lastMessageTime: { type: Date },
  isPinned: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  isMuted: { type: Boolean, default: false },
  disappearingMessagesTimer: { type: Number, default: 0 }, // in seconds, 0 = disabled
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Message Schema
const MessageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, default: '' },
  status: { type: String, enum: ['sending', 'sent', 'delivered', 'read'], default: 'sent' },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  reactions: [{
    emoji: String,
    userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    userNames: [String]
  }],
  edited: { type: Boolean, default: false },
  attachments: [{
    id: String,
    type: String,
    url: String,
    name: String,
    size: Number,
    data: mongoose.Schema.Types.Mixed
  }],
  timestamp: { type: Date, default: Date.now, index: true },
  scheduledFor: { type: Date }, // For scheduled messages
  isScheduled: { type: Boolean, default: false },
  disappearingAt: { type: Date } // When message should disappear
});

// Contact Schema (for syncing contacts)
const ContactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  phoneNumber: { type: String, required: true },
  name: { type: String, required: true },
  registeredUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // If this contact is registered
  isInvited: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Push Subscription Schema (for Web Push Notifications)
const PushSubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  endpoint: { type: String, required: true, unique: true, index: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  },
  userAgent: { type: String, default: '' },
  deviceInfo: {
    type: { type: String, enum: ['desktop', 'mobile', 'tablet'], default: 'desktop' },
    os: { type: String, default: '' },
    browser: { type: String, default: '' }
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastUsed: { type: Date, default: Date.now }
});

// Admin Schema (for admin users with permissions)
const AdminSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  username: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true }, // Hashed password
  name: { type: String, required: true },
  role: { type: String, enum: ['owner', 'admin'], default: 'admin' },
  permissions: {
    canManageUsers: { type: Boolean, default: false },
    canManageAdmins: { type: Boolean, default: false },
    canAccessPremiumChat: { type: Boolean, default: true },
    canViewStatistics: { type: Boolean, default: false },
    canManageSettings: { type: Boolean, default: false },
    canAccessDatabase: { type: Boolean, default: false },
    canGrantFreeSubscription: { type: Boolean, default: false }
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});

// Free Subscription Schema (for users who get free premium access)
const FreeSubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  reason: { type: String, default: '' },
  status: { type: String, enum: ['active', 'revoked', 'expired'], default: 'active' },
  expiresAt: { type: Date }, // null means lifetime
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const OTP = mongoose.models.OTP || mongoose.model('OTP', OTPSchema);
export const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
export const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);
export const Contact = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);
export const PushSubscription = mongoose.models.PushSubscription || mongoose.model('PushSubscription', PushSubscriptionSchema);
export const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
export const FreeSubscription = mongoose.models.FreeSubscription || mongoose.model('FreeSubscription', FreeSubscriptionSchema);

