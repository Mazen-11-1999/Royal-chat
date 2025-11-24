import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import crypto from 'crypto';
import { connectDatabase, User, Conversation, Message, Contact, PushSubscription, Admin, FreeSubscription } from './database.js';
import { sendOTP, verifyOTP, findUsersByPhoneNumbers } from './auth.js';
import { sendMessageNotification } from './pushNotifications.js';

// Use CommonJS approach for __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Type declaration for process.env
declare const process: {
  env: {
    PORT?: string;
    [key: string]: string | undefined;
  };
};

const app = express();
const server = http.createServer(app);
// Get allowed origins from environment or use defaults
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ["http://localhost:4000", "http://localhost:4001", "http://localhost:3000", "http://localhost:3003"];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Connect to database
connectDatabase().catch(console.error);

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Authentication Routes
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { phoneNumber, email } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'رقم الهاتف مطلوب' });
    }

    const result = await sendOTP(phoneNumber, email);

    if (result.success) {
      res.json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error: any) {
    console.error('Error in send-otp:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({ success: false, message: 'رقم الهاتف وكود التحقق مطلوبان' });
    }

    const result = await verifyOTP(phoneNumber, code);

    if (result.success) {
      res.json({ success: true, user: result.user, message: result.message });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error: any) {
    console.error('Error in verify-otp:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
});

// Find registered users by phone numbers (for contact sync)
app.post('/api/users/find-by-phones', async (req, res) => {
  try {
    const { phoneNumbers } = req.body;

    if (!phoneNumbers || !Array.isArray(phoneNumbers)) {
      return res.status(400).json({ success: false, message: 'قائمة أرقام الهواتف مطلوبة' });
    }

    const users = await findUsersByPhoneNumbers(phoneNumbers);
    res.json({ success: true, users });
  } catch (error: any) {
    console.error('Error in find-by-phones:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
});

// Push Notification Routes
// Subscribe to push notifications
app.post('/api/notifications/subscribe', async (req, res) => {
  try {
    const { userId, subscription, userAgent, deviceInfo } = req.body;

    if (!userId || !subscription || !subscription.endpoint) {
      return res.status(400).json({ success: false, message: 'بيانات الاشتراك مطلوبة' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    // Check if subscription already exists
    const existingSubscription = await PushSubscription.findOne({ endpoint: subscription.endpoint });

    if (existingSubscription) {
      // Update existing subscription
      existingSubscription.userId = userId;
      existingSubscription.keys = subscription.keys;
      existingSubscription.userAgent = userAgent || '';
      existingSubscription.deviceInfo = deviceInfo || {};
      existingSubscription.isActive = true;
      existingSubscription.updatedAt = new Date();
      existingSubscription.lastUsed = new Date();
      await existingSubscription.save();

      return res.json({ success: true, message: 'تم تحديث الاشتراك بنجاح', subscription: existingSubscription });
    }

    // Create new subscription
    const newSubscription = new PushSubscription({
      userId: userId,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      userAgent: userAgent || '',
      deviceInfo: deviceInfo || {},
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastUsed: new Date()
    });

    await newSubscription.save();

    console.log(`✅ Push subscription registered for user ${userId}`);
    res.json({ success: true, message: 'تم تسجيل الاشتراك بنجاح', subscription: newSubscription });
  } catch (error: any) {
    console.error('Error in subscribe:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
});

// Unsubscribe from push notifications
app.post('/api/notifications/unsubscribe', async (req, res) => {
  try {
    const { userId, endpoint } = req.body;

    if (!userId || !endpoint) {
      return res.status(400).json({ success: false, message: 'بيانات إلغاء الاشتراك مطلوبة' });
    }

    // Find and deactivate subscription
    const subscription = await PushSubscription.findOne({ userId, endpoint });

    if (subscription) {
      subscription.isActive = false;
      subscription.updatedAt = new Date();
      await subscription.save();

      console.log(`✅ Push subscription unsubscribed for user ${userId}`);
      res.json({ success: true, message: 'تم إلغاء الاشتراك بنجاح' });
    } else {
      res.status(404).json({ success: false, message: 'الاشتراك غير موجود' });
    }
  } catch (error: any) {
    console.error('Error in unsubscribe:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
});

// Get user's push subscriptions
app.get('/api/notifications/subscriptions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const subscriptions = await PushSubscription.find({ userId, isActive: true });

    res.json({ success: true, subscriptions });
  } catch (error: any) {
    console.error('Error getting subscriptions:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
});

// Admin Management Routes
// Helper function to hash password
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Admin Authentication
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'اسم المستخدم وكلمة المرور مطلوبان' });
    }

    const admin = await Admin.findOne({ username, isActive: true });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
    }

    const hashedPassword = hashPassword(password);
    if (admin.password !== hashedPassword) {
      return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Get user info
    const user = await User.findById(admin.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    res.json({
      success: true,
      admin: {
        id: admin._id.toString(),
        userId: admin.userId.toString(),
        username: admin.username,
        name: admin.name,
        role: admin.role,
        permissions: admin.permissions,
        user: {
          id: user._id.toString(),
          name: user.name,
          avatar: user.avatar,
          phoneNumber: user.phoneNumber,
          email: user.email
        }
      }
    });
  } catch (error: any) {
    console.error('Error in admin login:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
});

// Get all admins (owner only)
app.get('/api/admin/admins', async (req, res) => {
  try {
    const { ownerId } = req.query;

    // Verify owner
    const owner = await Admin.findOne({ userId: ownerId, role: 'owner' });
    if (!owner) {
      return res.status(403).json({ success: false, message: 'غير مصرح لك' });
    }

    const admins = await Admin.find({ isActive: true }).populate('userId', 'name avatar phoneNumber email');

    res.json({
      success: true,
      admins: admins.map(admin => ({
        id: admin._id.toString(),
        userId: admin.userId.toString(),
        username: admin.username,
        name: admin.name,
        role: admin.role,
        permissions: admin.permissions,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
        lastLogin: admin.lastLogin,
        user: admin.userId
      }))
    });
  } catch (error: any) {
    console.error('Error getting admins:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
});

// Create admin (owner only)
app.post('/api/admin/create', async (req, res) => {
  try {
    const { ownerId, username, password, name, userId, permissions } = req.body;

    if (!ownerId || !username || !password || !name || !userId) {
      return res.status(400).json({ success: false, message: 'جميع الحقول مطلوبة' });
    }

    // Verify owner
    const owner = await Admin.findOne({ userId: ownerId, role: 'owner' });
    if (!owner) {
      return res.status(403).json({ success: false, message: 'غير مصرح لك' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    // Check if username already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'اسم المستخدم موجود بالفعل' });
    }

    // Check if user is already an admin
    const existingUserAdmin = await Admin.findOne({ userId });
    if (existingUserAdmin) {
      return res.status(400).json({ success: false, message: 'المستخدم أدمن بالفعل' });
    }

    const hashedPassword = hashPassword(password);
    const newAdmin = new Admin({
      userId,
      username,
      password: hashedPassword,
      name,
      role: 'admin',
      permissions: permissions || {
        canManageUsers: false,
        canManageAdmins: false,
        canAccessPremiumChat: true,
        canViewStatistics: false,
        canManageSettings: false,
        canAccessDatabase: false,
        canGrantFreeSubscription: false
      },
      isActive: true
    });

    await newAdmin.save();

    res.json({
      success: true,
      message: 'تم إنشاء الأدمن بنجاح',
      admin: {
        id: newAdmin._id.toString(),
        userId: newAdmin.userId.toString(),
        username: newAdmin.username,
        name: newAdmin.name,
        role: newAdmin.role,
        permissions: newAdmin.permissions
      }
    });
  } catch (error: any) {
    console.error('Error creating admin:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
});

// Update admin permissions (owner only)
app.put('/api/admin/:adminId/permissions', async (req, res) => {
  try {
    const { adminId } = req.params;
    const { ownerId, permissions } = req.body;

    if (!ownerId || !permissions) {
      return res.status(400).json({ success: false, message: 'البيانات مطلوبة' });
    }

    // Verify owner
    const owner = await Admin.findOne({ userId: ownerId, role: 'owner' });
    if (!owner) {
      return res.status(403).json({ success: false, message: 'غير مصرح لك' });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'الأدمن غير موجود' });
    }

    admin.permissions = { ...admin.permissions, ...permissions };
    admin.updatedAt = new Date();
    await admin.save();

    res.json({
      success: true,
      message: 'تم تحديث الصلاحيات بنجاح',
      admin: {
        id: admin._id.toString(),
        permissions: admin.permissions
      }
    });
  } catch (error: any) {
    console.error('Error updating admin permissions:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
});

// Delete admin (owner only)
app.delete('/api/admin/:adminId', async (req, res) => {
  try {
    const { adminId } = req.params;
    const { ownerId } = req.body;

    if (!ownerId) {
      return res.status(400).json({ success: false, message: 'معرف المالك مطلوب' });
    }

    // Verify owner
    const owner = await Admin.findOne({ userId: ownerId, role: 'owner' });
    if (!owner) {
      return res.status(403).json({ success: false, message: 'غير مصرح لك' });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'الأدمن غير موجود' });
    }

    // Don't allow deleting owner
    if (admin.role === 'owner') {
      return res.status(400).json({ success: false, message: 'لا يمكن حذف المالك' });
    }

    admin.isActive = false;
    admin.updatedAt = new Date();
    await admin.save();

    res.json({ success: true, message: 'تم حذف الأدمن بنجاح' });
  } catch (error: any) {
    console.error('Error deleting admin:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
});

// Grant free subscription to user
app.post('/api/admin/grant-free-subscription', async (req, res) => {
  try {
    const { adminId, userId, reason, expiresAt } = req.body;

    if (!adminId || !userId) {
      return res.status(400).json({ success: false, message: 'معرف الأدمن والمستخدم مطلوبان' });
    }

    // Verify admin and check permission
    const admin = await Admin.findById(adminId);
    if (!admin || !admin.isActive) {
      return res.status(403).json({ success: false, message: 'غير مصرح لك' });
    }

    if (!admin.permissions.canGrantFreeSubscription && admin.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'ليس لديك صلاحية منح الاشتراك المجاني' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    // Check if user already has free subscription
    const existingSubscription = await FreeSubscription.findOne({ userId, status: 'active' });
    if (existingSubscription) {
      return res.status(400).json({ success: false, message: 'المستخدم لديه اشتراك مجاني نشط بالفعل' });
    }

    const freeSubscription = new FreeSubscription({
      userId,
      grantedBy: adminId,
      reason: reason || '',
      status: 'active',
      expiresAt: expiresAt ? new Date(expiresAt) : null // null means lifetime
    });

    await freeSubscription.save();

    res.json({
      success: true,
      message: 'تم منح الاشتراك المجاني بنجاح',
      subscription: {
        id: freeSubscription._id.toString(),
        userId: freeSubscription.userId.toString(),
        status: freeSubscription.status,
        expiresAt: freeSubscription.expiresAt
      }
    });
  } catch (error: any) {
    console.error('Error granting free subscription:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
});

// Revoke free subscription
app.post('/api/admin/revoke-free-subscription', async (req, res) => {
  try {
    const { adminId, userId } = req.body;

    if (!adminId || !userId) {
      return res.status(400).json({ success: false, message: 'معرف الأدمن والمستخدم مطلوبان' });
    }

    // Verify admin and check permission
    const admin = await Admin.findById(adminId);
    if (!admin || !admin.isActive) {
      return res.status(403).json({ success: false, message: 'غير مصرح لك' });
    }

    if (!admin.permissions.canGrantFreeSubscription && admin.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'ليس لديك صلاحية إلغاء الاشتراك المجاني' });
    }

    const subscription = await FreeSubscription.findOne({ userId, status: 'active' });
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'لا يوجد اشتراك مجاني نشط' });
    }

    subscription.status = 'revoked';
    subscription.updatedAt = new Date();
    await subscription.save();

    res.json({ success: true, message: 'تم إلغاء الاشتراك المجاني بنجاح' });
  } catch (error: any) {
    console.error('Error revoking free subscription:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
});

// Check if user has free subscription
app.get('/api/subscription/free/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const subscription = await FreeSubscription.findOne({ userId, status: 'active' });

    if (!subscription) {
      return res.json({ success: true, hasFreeSubscription: false });
    }

    // Check if expired
    if (subscription.expiresAt && new Date(subscription.expiresAt) < new Date()) {
      subscription.status = 'expired';
      await subscription.save();
      return res.json({ success: true, hasFreeSubscription: false });
    }

    res.json({
      success: true,
      hasFreeSubscription: true,
      subscription: {
        id: subscription._id.toString(),
        expiresAt: subscription.expiresAt,
        reason: subscription.reason
      }
    });
  } catch (error: any) {
    console.error('Error checking free subscription:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
});

// Get all users (for admin management)
app.get('/api/admin/users', async (req, res) => {
  try {
    const { adminId, page = 1, limit = 50, search = '' } = req.query;

    if (!adminId) {
      return res.status(400).json({ success: false, message: 'معرف الأدمن مطلوب' });
    }

    // Verify admin
    const admin = await Admin.findById(adminId);
    if (!admin || !admin.isActive) {
      return res.status(403).json({ success: false, message: 'غير مصرح لك' });
    }

    if (!admin.permissions.canManageUsers && admin.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'ليس لديك صلاحية إدارة المستخدمين' });
    }

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const users = await User.find(query)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    // Check free subscriptions for each user
    const usersWithSubscriptions = await Promise.all(
      users.map(async (user) => {
        const freeSubscription = await FreeSubscription.findOne({ userId: user._id, status: 'active' });
        return {
          id: user._id.toString(),
          name: user.name,
          avatar: user.avatar,
          phoneNumber: user.phoneNumber,
          email: user.email,
          status: user.status,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          hasFreeSubscription: !!freeSubscription,
          freeSubscription: freeSubscription ? {
            id: freeSubscription._id.toString(),
            expiresAt: freeSubscription.expiresAt,
            reason: freeSubscription.reason
          } : null
        };
      })
    );

    res.json({
      success: true,
      users: usersWithSubscriptions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Error getting users:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
});

// Get VAPID public key (for client-side subscription)
app.get('/api/notifications/vapid-key', async (req, res) => {
  try {
    const { getVAPIDPublicKey } = await import('./pushNotifications.js');
    const publicKey = getVAPIDPublicKey();
    res.json({ success: true, publicKey });
  } catch (error: any) {
    console.error('Error getting VAPID key:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// Store all registered users (in-memory, in production use database)
const registeredUsers = new Map<string, {
  id: string;
  phoneNumber: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: Date;
  socketId?: string;
  createdAt: Date;
}>();

// Store user contacts (in-memory, in production use database)
const userContacts = new Map<string, Set<string>>(); // userId -> Set of contactIds

// Store messages for each conversation (in-memory, in production use database)
const conversationMessages = new Map<string, Array<{
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  replyTo?: string | null;
  reactions?: Array<{ emoji: string; userIds: string[]; userNames?: string[] }>;
  edited?: boolean;
  attachments?: Array<{
    id: string;
    type: string;
    url: string;
    name?: string;
    size?: number;
    data?: any;
  }>;
}>>(); // conversationId -> Array of messages

// WebSocket Connection
io.on('connection', (socket) => {
  console.log('A user connected');

  // Store active users
  const activeUsers = new Map<string, { userId: string; userName: string; socketId: string; joinedAt: Date }>();

  // Store user data in room
  const roomUserData = new Map<string, Map<string, any>>(); // conversationId -> userId -> userData

  // Get conversations for a user
  socket.on('get_conversations', async (data: { userId: string }) => {
    try {
      const { userId } = data;
      console.log(`📋 Requesting conversations for user: ${userId}`);

      // Get conversations from database where user is a participant
      const userConversations = await Conversation.find({
        participants: { $in: [userId] }
      })
      .populate({
        path: 'participants',
        select: 'id name avatar status lastSeen',
        model: 'User'
      })
      .populate({
        path: 'lastMessage',
        model: 'Message'
      })
      .sort({ lastMessageTime: -1, updatedAt: -1 })
      .limit(100);

      // Convert to format expected by client
      const conversationsList = userConversations.map(conv => {
        const participants = Array.isArray(conv.participants)
          ? conv.participants.map((p: any) => ({
              id: p._id?.toString() || p.id || p.toString(),
              name: p.name || 'Unknown',
              avatar: p.avatar || '',
              status: p.status || 'offline',
              lastSeen: p.lastSeen || new Date()
            }))
          : [];

        return {
          id: conv._id?.toString() || conv.id,
          name: conv.name || '',
          isGroup: conv.isGroup || false,
          avatar: conv.avatar || '',
          participants: participants,
          lastMessage: conv.lastMessage ? {
            id: conv.lastMessage._id?.toString() || conv.lastMessage.id,
            content: conv.lastMessage.content || '',
            timestamp: conv.lastMessage.timestamp || new Date(),
            senderId: conv.lastMessage.senderId?.toString() || conv.lastMessage.senderId,
            status: conv.lastMessage.status || 'sent'
          } : null,
          lastMessageTime: conv.lastMessageTime || conv.updatedAt || conv.createdAt,
          isPinned: conv.isPinned || false,
          isArchived: conv.isArchived || false,
          createdAt: conv.createdAt || new Date(),
          updatedAt: conv.updatedAt || new Date()
        };
      });

      socket.emit('conversations_list', conversationsList);
      console.log(`✅ Sent ${conversationsList.length} conversations to user ${userId}`);
    } catch (error: any) {
      console.error('Error getting conversations:', error);
      socket.emit('conversations_list', []);
    }
  });

  // Get messages for a conversation
  socket.on('get_messages', async (data: { conversationId: string; userId: string; limit?: number }) => {
    try {
      const { conversationId, userId, limit = 100 } = data;
      console.log(`📨 Requesting messages for conversation: ${conversationId}`);

      // Get messages from database
      const dbMessages = await Message.find({
        conversationId: conversationId
      })
      .populate({
        path: 'senderId',
        select: 'id name avatar',
        model: 'User'
      })
      .sort({ timestamp: 1 }) // Sort ascending (oldest first)
      .limit(limit);

      // Convert to format expected by client
      const messagesList = dbMessages.map(msg => {
        const sender = msg.senderId as any;
        const senderId = sender?._id?.toString() || sender?.id || msg.senderId?.toString() || msg.senderId;

        return {
          id: msg._id?.toString() || msg.id,
          conversationId: msg.conversationId?.toString() || msg.conversationId,
          senderId: senderId,
          senderName: sender?.name || 'Unknown',
          senderAvatar: sender?.avatar || '',
          content: msg.content || '',
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          status: (msg.status || 'sent') as 'sending' | 'sent' | 'delivered' | 'read',
          replyTo: msg.replyTo?.toString() || msg.replyTo || null,
          reactions: (msg.reactions || []).map((r: any) => ({
            emoji: r.emoji,
            userIds: r.userIds || [],
            userNames: r.userNames || []
          })),
          edited: msg.edited || false,
          attachments: msg.attachments || []
        };
      });

      socket.emit('messages_list', messagesList);
      console.log(`✅ Sent ${messagesList.length} messages for conversation ${conversationId}`);
    } catch (error: any) {
      console.error('Error getting messages:', error);
      socket.emit('messages_list', []);
    }
  });

  // Join a conversation
  socket.on('join_conversation', (data) => {
    const conversationId = typeof data === 'string' ? data : data.conversationId;
    const userId = typeof data === 'object' ? data.userId : undefined;
    const userName = typeof data === 'object' ? data.userName : undefined;
    const userAvatar = typeof data === 'object' ? data.userAvatar : undefined;
    const userFrame = typeof data === 'object' ? data.userFrame : undefined;
    const userNameEffect = typeof data === 'object' ? data.userNameEffect : undefined;
    const userStatus = typeof data === 'object' ? data.userStatus : 'online';
    const isPremiumSubscriber = typeof data === 'object' ? data.isPremiumSubscriber : false;

    socket.join(conversationId);

    if (userId && userName) {
      // Store user data for this room
      if (!roomUserData.has(conversationId)) {
        roomUserData.set(conversationId, new Map());
      }
      const userDataMap = roomUserData.get(conversationId)!;
      userDataMap.set(userId, {
        userId,
        userName,
        userAvatar: userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        userFrame: userFrame || null,
        userNameEffect: userNameEffect || null,
        userStatus: userStatus || 'online',
        isPremiumSubscriber: isPremiumSubscriber || false,
        socketId: socket.id,
        joinedAt: new Date()
      });

      activeUsers.set(socket.id, { userId, userName, socketId: socket.id, joinedAt: new Date() });

      // Notify others that user joined with complete info (real-time)
      socket.to(conversationId).emit('user_joined', {
        userId,
        userName,
        userAvatar: userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        userFrame: userFrame || null,
        userNameEffect: userNameEffect || null,
        userStatus: userStatus || 'online',
        isPremiumSubscriber: isPremiumSubscriber || false,
        timestamp: new Date()
      });

             // Send current active users to the new user with complete info
             const usersInRoom = Array.from(io.sockets.adapter.rooms.get(conversationId) || [])
               .map(socketId => {
                 const userInfo = activeUsers.get(socketId);
                 if (!userInfo) return null;
                 const userData = userDataMap.get(userInfo.userId);
                 return userData ? {
                   userId: userData.userId,
                   userName: userData.userName,
                   userAvatar: userData.userAvatar,
                   userFrame: userData.userFrame,
                   userNameEffect: userData.userNameEffect,
                   userStatus: userData.userStatus,
                   isPremiumSubscriber: userData.isPremiumSubscriber
                 } : {
                   userId: userInfo.userId,
                   userName: userInfo.userName,
                   userAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userInfo.userId}`,
                   userFrame: null,
                   userNameEffect: null,
                   userStatus: 'online',
                   isPremiumSubscriber: false
                 };
               })
               .filter((u): u is any => u !== null);

             socket.emit('active_users', usersInRoom);

             // Send conversation message history to the new user (real-time sync)
             const messages = conversationMessages.get(conversationId) || [];
             if (messages.length > 0) {
               // Send last 100 messages to the new user
               const recentMessages = messages.slice(-100);
               socket.emit('conversation_history', {
                 conversationId,
                 messages: recentMessages
               });
               console.log(`📨 Sent ${recentMessages.length} messages from conversation ${conversationId} to user ${userName}`);
             }
           }

    console.log(`User ${userName || userId || 'unknown'} joined conversation: ${conversationId} with avatar: ${userAvatar || 'default'}`);
  });

  // Send and receive messages - Real-time messaging
  socket.on('send_message', async (message) => {
    // Use the timestamp from the message (actual time when sent), or current time if not provided
    const messageTimestamp = message.timestamp
      ? (typeof message.timestamp === 'string' ? new Date(message.timestamp) : message.timestamp)
      : new Date();

    // Update timestamp and ensure all required fields
    const messageWithTimestamp = {
      ...message,
      timestamp: messageTimestamp, // Use actual timestamp from message
      status: 'sent' as const, // Update status from 'sending' to 'sent'
      // Ensure reactions array exists
      reactions: message.reactions || [],
      // Ensure replyTo is null if not provided
      replyTo: message.replyTo || null,
      // Include sender info for display
      senderName: message.senderName || 'Unknown',
      senderAvatar: message.senderAvatar,
      // Ensure attachments are included
      attachments: message.attachments || []
    };

    // Store the message in conversation history
    const conversationId = message.conversationId;
    if (!conversationMessages.has(conversationId)) {
      conversationMessages.set(conversationId, []);
    }
    const messages = conversationMessages.get(conversationId)!;
    // Check if message already exists (avoid duplicates)
    const existingIndex = messages.findIndex(m => m.id === messageWithTimestamp.id);
    if (existingIndex >= 0) {
      // Update existing message
      messages[existingIndex] = messageWithTimestamp;
    } else {
      // Add new message
      messages.push(messageWithTimestamp);
    }
    // Keep only last 1000 messages per conversation (to prevent memory issues)
    if (messages.length > 1000) {
      messages.splice(0, messages.length - 1000);
    }

    // Broadcast the message to everyone in the conversation room (including sender)
    // This ensures all users see the message in real-time with updated status
    io.to(conversationId).emit('receive_message', messageWithTimestamp);

    console.log(`✅ Message sent in conversation ${conversationId} by user ${message.senderId || message.senderName}: "${message.content.substring(0, 50)}..."`);
    console.log(`   Broadcasting to all users in room: ${conversationId}`);
    console.log(`   Total messages in conversation: ${messages.length}`);

    // Send push notifications to users who are not currently viewing the conversation
    // Get all participants in the conversation (excluding sender)
    try {
      const conversation = await Conversation.findById(conversationId).populate('participants');
      if (conversation && conversation.participants) {
        const participants = Array.isArray(conversation.participants)
          ? conversation.participants
          : [conversation.participants];

        // Get users currently in the conversation room (online and viewing)
        const socketsInRoom = await io.in(conversationId).fetchSockets();
        const onlineUserIds = new Set(
          socketsInRoom.map(socket => {
            const userInfo = activeUsers.get(socket.id);
            return userInfo?.userId;
          }).filter(Boolean)
        );

        // Send push notifications to offline users or users not viewing this conversation
        for (const participant of participants) {
          const participantId = participant._id?.toString() || participant.toString();

          // Skip sender
          if (participantId === message.senderId) continue;

          // Skip if user is online and viewing this conversation
          if (onlineUserIds.has(participantId)) continue;

          // Get sender info
          const sender = await User.findById(message.senderId);
          const senderName = sender?.name || message.senderName || 'Unknown';
          const senderAvatar = sender?.avatar || message.senderAvatar;

          // Get message content
          let messageContent = message.content || '';
          if (message.attachments && message.attachments.length > 0) {
            const attachment = message.attachments[0];
            if (attachment.type === 'image') {
              messageContent = '📷 صورة';
            } else if (attachment.type === 'voice' || attachment.type === 'audio') {
              messageContent = '🎤 رسالة صوتية';
            } else if (attachment.type === 'file') {
              messageContent = '📎 ملف';
            } else if (attachment.type === 'location') {
              messageContent = '📍 موقع';
            }
          }

          // Send push notification
          await sendMessageNotification(
            participantId,
            senderName,
            messageContent,
            conversationId,
            senderAvatar,
            'rtl'
          );
        }
      }
    } catch (error) {
      console.error('Error sending push notifications:', error);
    }
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    socket.broadcast.to(data.conversationId).emit('user_typing', {
      userId: data.userId,
      isTyping: data.isTyping
    });
  });

  // Handle message reactions
  socket.on('react_to_message', (data) => {
    const { messageId, emoji, userId, userName, conversationId } = data;

    // Broadcast reaction to everyone in the conversation
    io.to(conversationId).emit('reaction_received', {
      messageId,
      emoji,
      userId,
      userName,
      timestamp: new Date()
    });

    console.log(`User ${userName} (${userId}) reacted ${emoji} to message ${messageId} in conversation ${conversationId}`);
  });

  // Handle message edit
  socket.on('edit_message', (data) => {
    const { messageId, content, conversationId } = data;

    // Update message in conversation history
    const messages = conversationMessages.get(conversationId);
    if (messages) {
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex >= 0) {
        messages[messageIndex] = {
          ...messages[messageIndex],
          content,
          edited: true
        };
      }
    }

    // Broadcast edited message to everyone in the conversation
    io.to(conversationId).emit('message_edited', {
      messageId,
      content,
      timestamp: new Date()
    });

    console.log(`Message ${messageId} edited in conversation ${conversationId}`);
  });

  // Handle message delete
  socket.on('delete_message', (data) => {
    const { messageId, conversationId } = data;

    // Remove message from conversation history
    const messages = conversationMessages.get(conversationId);
    if (messages) {
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex >= 0) {
        messages.splice(messageIndex, 1);
      }
    }

    // Broadcast message deletion to everyone in the conversation
    io.to(conversationId).emit('message_deleted', {
      messageId,
      timestamp: new Date()
    });

    console.log(`Message ${messageId} deleted in conversation ${conversationId}`);
  });

  // Handle user leaving conversation
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(conversationId);
    const userInfo = activeUsers.get(socket.id);
    if (userInfo) {
      socket.to(conversationId).emit('user_left', {
        userId: userInfo.userId,
        timestamp: new Date()
      });
      activeUsers.delete(socket.id);
    }
    console.log(`User left conversation: ${conversationId}`);
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    socket.broadcast.to(data.conversationId).emit('user_typing', {
      userId: data.userId,
      userName: data.userName,
      isTyping: data.isTyping,
      timestamp: new Date()
    });
  });

  // Handle pin/unpin conversation
  socket.on('pin_conversation', async (data: { conversationId: string; userId: string; isPinned: boolean }) => {
    try {
      const { Conversation } = await import('./database.js');
      const conversation = await Conversation.findById(data.conversationId);

      if (conversation) {
        conversation.isPinned = data.isPinned;
        conversation.updatedAt = new Date();
        await conversation.save();

        // Notify all participants
        socket.to(data.conversationId).emit('conversation_pinned', {
          conversationId: data.conversationId,
          isPinned: data.isPinned,
          userId: data.userId
        });

        socket.emit('conversation_pinned', {
          conversationId: data.conversationId,
          isPinned: data.isPinned,
          userId: data.userId
        });

        console.log(`✅ Conversation ${data.conversationId} ${data.isPinned ? 'pinned' : 'unpinned'}`);
      }
    } catch (error: any) {
      console.error('Error pinning conversation:', error);
    }
  });

  // Handle archive/unarchive conversation
  socket.on('archive_conversation', async (data: { conversationId: string; userId: string; isArchived: boolean }) => {
    try {
      const { Conversation } = await import('./database.js');
      const conversation = await Conversation.findById(data.conversationId);

      if (conversation) {
        conversation.isArchived = data.isArchived;
        conversation.updatedAt = new Date();
        await conversation.save();

        // Notify all participants
        socket.to(data.conversationId).emit('conversation_archived', {
          conversationId: data.conversationId,
          isArchived: data.isArchived,
          userId: data.userId
        });

        socket.emit('conversation_archived', {
          conversationId: data.conversationId,
          isArchived: data.isArchived,
          userId: data.userId
        });

        console.log(`✅ Conversation ${data.conversationId} ${data.isArchived ? 'archived' : 'unarchived'}`);
      }
    } catch (error: any) {
      console.error('Error archiving conversation:', error);
    }
  });

  // Handle create group
  socket.on('create_group', async (data: { name: string; description: string; memberIds: string[]; creatorId: string }) => {
    try {
      const { Conversation, User } = await import('./database.js');

      // Get all participants including creator
      const allMemberIds = [data.creatorId, ...data.memberIds];
      const participants = await User.find({ _id: { $in: allMemberIds } });

      if (participants.length < 2) {
        socket.emit('group_created', { success: false, error: 'At least 2 members required' });
        return;
      }

      const conversation = new Conversation({
        isGroup: true,
        name: data.name,
        avatar: '', // Can be set later
        participants: participants.map(p => p._id),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await conversation.save();
      await conversation.populate('participants');

      // Notify all members
      const groupData = {
        id: conversation._id.toString(),
        name: conversation.name,
        isGroup: true,
        participants: participants.map(p => ({
          id: p._id.toString(),
          name: p.name,
          avatar: p.avatar,
          status: p.status
        })),
        createdAt: conversation.createdAt
      };

      // Emit to all members
      allMemberIds.forEach(memberId => {
        io.to(memberId).emit('group_created', { success: true, conversation: groupData });
      });

      console.log(`✅ Group "${data.name}" created with ${participants.length} members`);
    } catch (error: any) {
      console.error('Error creating group:', error);
      socket.emit('group_created', { success: false, error: error.message });
    }
  });

  // Handle disappearing messages timer
  socket.on('set_disappearing_timer', async (data: { conversationId: string; timer: number | null }) => {
    try {
      const { Conversation } = await import('./database.js');
      const conversation = await Conversation.findById(data.conversationId);

      if (conversation) {
        conversation.disappearingMessagesTimer = data.timer || 0;
        conversation.updatedAt = new Date();
        await conversation.save();

        // Notify all participants
        socket.to(data.conversationId).emit('disappearing_timer_updated', {
          conversationId: data.conversationId,
          timer: data.timer
        });

        socket.emit('disappearing_timer_updated', {
          conversationId: data.conversationId,
          timer: data.timer
        });

        console.log(`✅ Disappearing timer set to ${data.timer || 0}s for conversation ${data.conversationId}`);
      }
    } catch (error: any) {
      console.error('Error setting disappearing timer:', error);
    }
  });

  // Handle scheduled message
  socket.on('schedule_message', async (data: {
    conversationId: string;
    senderId: string;
    content: string;
    scheduledFor: Date;
    attachments?: any[];
  }) => {
    try {
      const { Message } = await import('./database.js');

      const message = new Message({
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content,
        scheduledFor: new Date(data.scheduledFor),
        isScheduled: true,
        status: 'sent',
        timestamp: new Date(),
        attachments: data.attachments || []
      });

      await message.save();

      socket.emit('message_scheduled', {
        success: true,
        messageId: message._id.toString(),
        scheduledFor: message.scheduledFor
      });

      console.log(`✅ Message scheduled for ${data.scheduledFor} in conversation ${data.conversationId}`);
    } catch (error: any) {
      console.error('Error scheduling message:', error);
      socket.emit('message_scheduled', { success: false, error: error.message });
    }
  });

  // Handle speaking (voice chat)
  socket.on('speaking', (data) => {
    socket.broadcast.to(data.conversationId).emit('user_speaking', {
      userId: data.userId,
      isSpeaking: data.isSpeaking,
      timestamp: new Date()
    });
  });

  // Handle voice chat join
  socket.on('join_voice_chat', (data: { userId: string; userName: string; conversationId: string }) => {
    const { userId, userName, conversationId } = data;
    socket.join(`voice_${conversationId}`);

    // Notify others in voice chat
    socket.to(`voice_${conversationId}`).emit('voice_chat_joined', {
      userId,
      userName,
      timestamp: new Date()
    });

    console.log(`User ${userName} (${userId}) joined voice chat in conversation ${conversationId}`);
  });

  // Handle voice chat leave
  socket.on('leave_voice_chat', (data: { userId: string; conversationId: string }) => {
    const { userId, conversationId } = data;
    socket.leave(`voice_${conversationId}`);

    // Notify others in voice chat
    socket.to(`voice_${conversationId}`).emit('voice_chat_left', {
      userId,
      timestamp: new Date()
    });

    console.log(`User ${userId} left voice chat in conversation ${conversationId}`);
  });

  // Handle voice audio chunks (real-time voice streaming)
  socket.on('voice_audio_chunk', (data: {
    userId: string;
    userName: string;
    conversationId: string;
    audioData: string;
    timestamp: Date;
  }) => {
    const { userId, userName, conversationId, audioData } = data;

    // Broadcast audio chunk to all other users in the voice chat room (except sender)
    socket.to(`voice_${conversationId}`).emit('voice_audio_chunk', {
      userId,
      userName,
      audioData,
      timestamp: new Date()
    });

    // Log for debugging (only first few chunks to avoid spam)
    if (Math.random() < 0.01) { // Log 1% of chunks
      console.log(`🎤 Audio chunk from ${userName} (${userId}) in conversation ${conversationId}`);
    }
  });

  // Handle points update
  socket.on('update_points', (data) => {
    // Broadcast points update (for leaderboard, etc.)
    io.to(data.conversationId).emit('points_updated', {
      userId: data.userId,
      points: data.points,
      level: data.level,
      rank: data.rank,
      timestamp: new Date()
    });
  });

  // Register user
  socket.on('register_user', (data: { userId: string; phoneNumber: string; name: string; avatar: string }) => {
    const { userId, phoneNumber, name, avatar } = data;

    // Update or create user
    const existingUser = registeredUsers.get(userId);
    registeredUsers.set(userId, {
      id: userId,
      phoneNumber,
      name,
      avatar,
      status: 'online',
      socketId: socket.id,
      lastSeen: new Date(),
      createdAt: existingUser?.createdAt || new Date()
    });

    // Broadcast user status update
    io.emit('user_status_update', {
      userId,
      status: 'online',
      lastSeen: new Date()
    });

    console.log(`User registered: ${name} (${phoneNumber})`);
  });

  // Search user by phone number
  socket.on('search_user', (data: { phoneNumber: string }, callback) => {
    const { phoneNumber } = data;

    // Find user by phone number
    const foundUser = Array.from(registeredUsers.values()).find(
      u => u.phoneNumber === phoneNumber
    );

    if (foundUser) {
      callback({
        user: {
          id: foundUser.id,
          phoneNumber: foundUser.phoneNumber,
          name: foundUser.name,
          avatar: foundUser.avatar,
          status: foundUser.status,
          lastSeen: foundUser.lastSeen,
          isContact: false
        }
      });
    } else {
      callback({ user: null });
    }
  });

  // Get all registered users
  socket.on('get_all_users', () => {
    const allUsers = Array.from(registeredUsers.values()).map(u => ({
      id: u.id,
      phoneNumber: u.phoneNumber,
      name: u.name,
      avatar: u.avatar,
      status: u.status,
      lastSeen: u.lastSeen,
      isContact: false
    }));

    socket.emit('all_users', allUsers);
  });

  // Add contact
  socket.on('add_contact', (data: { userId: string; contactId: string }) => {
    const { userId, contactId } = data;

    if (!userContacts.has(userId)) {
      userContacts.set(userId, new Set());
    }
    userContacts.get(userId)!.add(contactId);

    console.log(`User ${userId} added contact ${contactId}`);
  });

  // Remove contact
  socket.on('remove_contact', (data: { userId: string; contactId: string }) => {
    const { userId, contactId } = data;

    if (userContacts.has(userId)) {
      userContacts.get(userId)!.delete(contactId);
    }

    console.log(`User ${userId} removed contact ${contactId}`);
  });

  // Send invitation to contact
  socket.on('send_invitation', (data: {
    fromUserId: string;
    fromUserName: string;
    fromUserPhone: string;
    toPhoneNumber: string;
    toName: string;
    timestamp: Date;
  }) => {
    const { fromUserId, fromUserName, fromUserPhone, toPhoneNumber, toName } = data;

    // Check if the invited user is registered
    const invitedUser = Array.from(registeredUsers.values()).find(
      u => u.phoneNumber === toPhoneNumber || u.phoneNumber.replace(/[\s\-()]/g, '') === toPhoneNumber.replace(/[\s\-()]/g, '')
    );

    if (invitedUser) {
      // User is already registered - notify them about the invitation
      if (invitedUser.socketId) {
        io.to(invitedUser.socketId).emit('invitation_received', {
          fromUserId,
          fromUserName,
          fromUserPhone,
          toPhoneNumber,
          toName,
          timestamp: new Date()
        });
      }
      console.log(`Invitation sent to registered user ${toName} (${toPhoneNumber}) from ${fromUserName}`);
    } else {
      // User is not registered - store invitation for when they register
      // In production, you would store this in a database
      console.log(`Invitation sent to unregistered user ${toName} (${toPhoneNumber}) from ${fromUserName}`);
      console.log(`   User will receive invitation when they register with this phone number`);
    }

    // Broadcast invitation event (for logging/analytics)
    io.emit('invitation_sent', {
      fromUserId,
      fromUserName,
      fromUserPhone,
      toPhoneNumber,
      toName,
      timestamp: new Date()
    });
  });

  // Update user profile (name, avatar)
  socket.on('update_user_profile', (data: { userId: string; name?: string; avatar?: string }) => {
    const { userId, name, avatar } = data;
    const user = registeredUsers.get(userId);

    if (user) {
      if (name) user.name = name;
      if (avatar) user.avatar = avatar;
      registeredUsers.set(userId, user);

      // Broadcast profile update to all users
      io.emit('user_profile_update', {
        userId,
        name,
        avatar
      });

      console.log(`User ${userId} updated profile: name=${name}, avatar=${avatar}`);
    }
  });

  // Update user frame (for premium chat)
  socket.on('update_user_frame', (data: { userId: string; userName: string; frameConfig: any; conversationId: string }) => {
    const { userId, userName, frameConfig, conversationId } = data;

    // Update stored user data in room
    if (roomUserData.has(conversationId)) {
      const userDataMap = roomUserData.get(conversationId)!;
      const userData = userDataMap.get(userId);
      if (userData) {
        userData.userFrame = frameConfig;
        userDataMap.set(userId, userData);
      }
    }

    // Broadcast frame update to all users in the conversation (real-time)
    io.to(conversationId).emit('user_frame_updated', {
      userId,
      userName,
      frameConfig,
      timestamp: new Date()
    });

    console.log(`User ${userName} (${userId}) updated frame in conversation ${conversationId}`);
  });

  // Update user name effect (for premium chat)
  socket.on('update_user_name_effect', (data: { userId: string; userName: string; nameEffect: any; conversationId: string }) => {
    const { userId, userName, nameEffect, conversationId } = data;

    // Update stored user data in room
    if (roomUserData.has(conversationId)) {
      const userDataMap = roomUserData.get(conversationId)!;
      const userData = userDataMap.get(userId);
      if (userData) {
        userData.userNameEffect = nameEffect;
        userDataMap.set(userId, userData);
      }
    }

    // Broadcast name effect update to all users in the conversation (real-time)
    io.to(conversationId).emit('user_name_effect_updated', {
      userId,
      userName,
      nameEffect,
      timestamp: new Date()
    });

    console.log(`User ${userName} (${userId}) updated name effect in conversation ${conversationId}`);
  });

  // Handle user leaving conversation
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(conversationId);
    const userInfo = activeUsers.get(socket.id);

    // Remove user data from room
    if (roomUserData.has(conversationId)) {
      if (userInfo) {
        roomUserData.get(conversationId)!.delete(userInfo.userId);
      }
    }

    if (userInfo) {
      socket.to(conversationId).emit('user_left', {
        userId: userInfo.userId,
        timestamp: new Date()
      });
    }
    console.log(`User left conversation: ${conversationId}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const userInfo = activeUsers.get(socket.id);

    // Update user status to offline
    const user = Array.from(registeredUsers.values()).find(u => u.socketId === socket.id);
    if (user) {
      user.status = 'offline';
      user.lastSeen = new Date();
      user.socketId = undefined;
      registeredUsers.set(user.id, user);

      // Broadcast status update
      io.emit('user_status_update', {
        userId: user.id,
        status: 'offline',
        lastSeen: user.lastSeen
      });
    }

    if (userInfo) {
      // Notify all rooms that user left and clean up room data
      socket.rooms.forEach(room => {
        socket.to(room).emit('user_left', {
          userId: userInfo.userId,
          timestamp: new Date()
        });

        // Clean up room user data
        if (roomUserData.has(room)) {
          roomUserData.get(room)!.delete(userInfo.userId);
        }
      });
      activeUsers.delete(socket.id);
    }
    console.log('User disconnected');
  });
});

// Use PORT from environment, or default to 4002 for local development
// In Railway, we'll use a different port for WebSocket server
const WS_PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT, 10) : (process.env.PORT ? parseInt(process.env.PORT, 10) + 1 : 4002);
const HTTP_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

// In Railway, if PORT is set, we need to run WebSocket on a different port
// But Railway only exposes one port, so we'll use the same port for both
// The Next.js app will handle HTTP, and Socket.IO will handle WebSocket on the same port
if (process.env.RAILWAY_ENVIRONMENT || process.env.PORT) {
  // In Railway, use the same port (Socket.IO will handle WebSocket upgrade)
  server.listen(HTTP_PORT, '0.0.0.0', () => {
    console.log(`WebSocket server is running on port ${HTTP_PORT} (Railway mode)`);
  });
} else {
  // Local development: use separate port
  server.listen(WS_PORT, '0.0.0.0', () => {
    console.log(`WebSocket server is running on port ${WS_PORT} (local mode)`);
  });
}
