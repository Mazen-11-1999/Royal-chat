# 👑 Royal Chat - تطبيق دردشة ملكي

<div dir="rtl">

## 📱 تطبيق دردشة حديث ومميز

تطبيق دردشة متقدم مبني بـ Next.js و React مع ميزات متقدمة مثل:
- 💬 دردشة في الوقت الفعلي
- 🔔 إشعارات Push حقيقية
- 👥 إدارة المجموعات
- 🎨 واجهة مستخدم حديثة ومتجاوبة
- 🌙 وضع الظلام
- 📎 مشاركة الملفات والوسائط
- 🎤 رسائل صوتية
- ⏰ جدولة الرسائل
- ⏳ رسائل تختفي تلقائياً
- 🔍 بحث متقدم في الرسائل

</div>

## 🚀 Features

- ✅ **Real-time Messaging** - WebSocket based instant messaging
- ✅ **Push Notifications** - Service Worker + Web Push API
- ✅ **Group Chats** - Create and manage groups
- ✅ **Media Gallery** - View all shared media
- ✅ **Message Search** - Search within conversations
- ✅ **Disappearing Messages** - Auto-delete messages after timer
- ✅ **Scheduled Messages** - Schedule messages for later
- ✅ **Pin/Archive Conversations** - Organize your chats
- ✅ **Dark Mode** - Light/Dark/System themes
- ✅ **Voice Messages** - Record and send voice notes
- ✅ **File Attachments** - Share images, files, and locations
- ✅ **Message Reactions** - React with emojis
- ✅ **Read Receipts** - See when messages are read
- ✅ **Typing Indicators** - See when someone is typing
- ✅ **Premium Chat** - Exclusive premium features
- ✅ **Admin Panel** - Full admin control panel

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Node.js, Express, Socket.io
- **Database**: MongoDB with Mongoose
- **Styling**: Tailwind CSS
- **Notifications**: Web Push API, Service Worker
- **Real-time**: WebSocket (Socket.io)

## 📋 Prerequisites

- Node.js 18+
- MongoDB (local or cloud)
- npm, yarn, or bun

## 🔧 Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/Royal-chat.git
cd Royal-chat
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
bun install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/royal-chat
# or use MongoDB Atlas
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/royal-chat

# VAPID Keys for Push Notifications (generate using web-push)
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:your-email@example.com

# Server Port (optional)
PORT=8080

# Next.js (optional)
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

4. **Generate VAPID Keys** (for push notifications)

```bash
npx web-push generate-vapid-keys
```

Copy the public and private keys to your `.env.local` file.

5. **Start MongoDB** (if using local MongoDB)

```bash
# Windows
mongod

# macOS/Linux
sudo systemctl start mongod
```

6. **Run the development server**

```bash
# Start both Next.js and Socket.io server
npm run dev:all

# Or separately:
npm run dev        # Next.js (port 4000)
npm run server     # Socket.io server (port 8080)
```

7. **Open your browser**

Navigate to `http://localhost:4000`

## 📱 Mobile Testing

For Android emulator testing, see `EMULATOR_QUICK_START.md`

## 🌐 Deployment

### Option 1: Vercel (Recommended - Free)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your GitHub repository
4. Add environment variables
5. Deploy!

**Note**: For Socket.io server, you'll need to deploy it separately (see Railway/Render options below)

### Option 2: Railway (Free tier available)

1. Push your code to GitHub
2. Go to [Railway](https://railway.app)
3. New Project → Deploy from GitHub
4. Add MongoDB service
5. Add environment variables
6. Deploy!

### Option 3: Render (Free tier available)

1. Push your code to GitHub
2. Go to [Render](https://render.com)
3. New Web Service → Connect GitHub
4. Add MongoDB database
5. Add environment variables
6. Deploy!

### Environment Variables for Production

Make sure to set these in your hosting platform:

- `MONGODB_URI` - Your MongoDB connection string
- `VAPID_PUBLIC_KEY` - Public VAPID key
- `VAPID_PRIVATE_KEY` - Private VAPID key
- `VAPID_SUBJECT` - Your email (mailto:your-email@example.com)
- `PORT` - Server port (usually auto-set by platform)
- `NEXT_PUBLIC_WS_URL` - WebSocket URL (your production URL)

## 📁 Project Structure

```
Royal-chat/
├── app/                    # Next.js app directory
│   ├── components/         # React components
│   ├── contexts/           # React contexts
│   ├── services/           # Services (notifications, etc.)
│   └── settings/           # Settings pages
├── server/                 # Socket.io server
│   ├── index.ts           # Main server file
│   ├── database.ts        # MongoDB schemas
│   └── pushNotifications.ts # Push notification service
├── public/                # Static files
│   ├── sw.js             # Service Worker
│   └── manifest.json      # PWA manifest
└── package.json           # Dependencies
```

## 🔐 Admin Panel

Access the admin panel at `/admin` (owner only)

Default owner credentials (change after first login):
- Username: `owner`
- Password: `admin123`

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For support, email support@royalchat.com or open an issue on GitHub.

## 🙏 Acknowledgments

- Next.js team
- Socket.io
- MongoDB
- All open-source contributors

---

Made with ❤️ by Royal Chat Team
