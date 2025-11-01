# 🖥️ Local Development Setup Guide

This guide will help you set up the POD N BEYOND website on your local machine for development.

---

## 📋 Prerequisites

### Required Software

1. **Node.js** (v18.x or higher)
   ```bash
   node --version  # Should be v18.x or higher
   ```
   Download from: https://nodejs.org/

2. **PostgreSQL** (v14 or higher)
   ```bash
   postgres --version  # Should be v14 or higher
   ```
   Download from: https://www.postgresql.org/download/

3. **Git**
   ```bash
   git --version
   ```

4. **Code Editor** - VS Code recommended
   Download from: https://code.visualstudio.com/

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Clone the Repository

```bash
# Navigate to your projects folder
cd ~/projects  # or wherever you keep your code

# Clone the repository
git clone https://github.com/geek-baba/podnbeyond.com.git
cd podnbeyond.com

# Checkout main branch
git checkout main
```

### Step 2: Create PostgreSQL Database

```bash
# Start PostgreSQL (if not running)
# macOS (if installed via Homebrew):
brew services start postgresql@14

# Or use the PostgreSQL app if you installed it that way

# Create database and user
psql postgres
```

In the PostgreSQL prompt, run:
```sql
-- Create database
CREATE DATABASE podnbeyond_dev;

-- Create user
CREATE USER podnbeyond_dev WITH PASSWORD 'dev_password_123';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE podnbeyond_dev TO podnbeyond_dev;
ALTER USER podnbeyond_dev CREATEDB;

-- Grant schema permissions
\c podnbeyond_dev
GRANT ALL ON SCHEMA public TO podnbeyond_dev;
ALTER SCHEMA public OWNER TO podnbeyond_dev;

-- Exit
\q
```

### Step 3: Setup Backend Environment

```bash
# Navigate to backend folder
cd backend

# Copy environment template
cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://podnbeyond_dev:dev_password_123@localhost:5432/podnbeyond_dev"

# Razorpay (Test Keys - get from https://dashboard.razorpay.com/app/website-app-settings/api-keys)
RAZORPAY_KEY_ID="rzp_test_your_key_here"
RAZORPAY_KEY_SECRET="your_test_secret_here"

# Server
NODE_ENV="development"
PORT=4000

# CORS - Allow frontend to access backend
CORS_ORIGIN="http://localhost:3000"

# JWT Secret (for development)
JWT_SECRET="dev-secret-key-change-in-production-12345"

# File Uploads
UPLOAD_PATH="./uploads"
EOF

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed CMS data (optional but recommended)
node prisma/seed_cms.js

# Import gallery images (optional)
node scripts/import_gallery_images.js
```

### Step 4: Setup Frontend Environment

```bash
# Navigate to frontend folder (from project root)
cd ../frontend

# Copy environment template
cat > .env.local << 'EOF'
# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:4000"

# Razorpay (Test Key - same as backend)
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_your_key_here"

# Next.js
NODE_ENV="development"
PORT=3000

# Branding
NEXT_PUBLIC_LOGO_URL="https://podnbeyond.com/wp-content/uploads/2024/01/logo.png"
EOF

# Install dependencies
npm install
```

### Step 5: Start Development Servers

You'll need **TWO terminal windows**:

#### Terminal 1 - Backend:
```bash
cd backend
npm run dev
# or
node server.js
```

You should see:
```
🚀 Server is running on http://localhost:4000
✅ Database connected successfully
```

#### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

You should see:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### Step 6: Access the Website

Open your browser:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000/api/health
- **Admin Panel**: http://localhost:3000/admin

---

## 🔑 Get Razorpay Test Keys

1. **Sign up/Login** to Razorpay: https://dashboard.razorpay.com/
2. Go to **Settings** → **API Keys**
3. Switch to **Test Mode** (toggle at top)
4. Click **Generate Test Key**
5. Copy both:
   - **Key ID** (starts with `rzp_test_`)
   - **Key Secret**
6. Update in both:
   - `backend/.env`
   - `frontend/.env.local`

---

## 📁 Project Structure

```
podnbeyond.com/
├── backend/                 # Express.js API server
│   ├── server.js           # Main server file
│   ├── routes/             # API routes
│   ├── controllers/        # Business logic
│   ├── models/             # Prisma models (in schema)
│   ├── prisma/             # Database schema & migrations
│   ├── uploads/            # Uploaded files
│   └── .env                # Backend environment variables
├── frontend/               # Next.js React app
│   ├── pages/             # Next.js pages/routes
│   ├── components/        # React components
│   ├── styles/            # CSS/Tailwind styles
│   └── .env.local         # Frontend environment variables
└── ecosystem.config.js    # PM2 config (production only)
```

---

## 🛠️ Common Development Tasks

### Reset Database
```bash
cd backend
npx prisma migrate reset  # WARNING: Deletes all data!
node prisma/seed_cms.js   # Re-seed CMS data
```

### View Database
```bash
npx prisma studio
# Opens GUI at http://localhost:5555
```

### Check Backend Routes
```bash
# Health check
curl http://localhost:4000/api/health

# Get CMS images
curl http://localhost:4000/api/cms/images/GALLERY_IMAGE

# Check all routes in backend/routes/ folder
```

### Run Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Format Code
```bash
# Install Prettier (optional)
npm install -g prettier

# Format all files
prettier --write .
```

---

## 🐛 Troubleshooting

### Backend won't start

**Error**: `Error: connect ECONNREFUSED 127.0.0.1:5432`
```bash
# PostgreSQL is not running
brew services start postgresql@14
# or check PostgreSQL app
```

**Error**: `Error: P1001: Can't reach database server`
```bash
# Check database exists
psql -l | grep podnbeyond_dev

# If not, create it (Step 2)
```

**Error**: `permission denied for schema public`
```bash
# Grant permissions (run in psql)
\c podnbeyond_dev
GRANT ALL ON SCHEMA public TO podnbeyond_dev;
ALTER SCHEMA public OWNER TO podnbeyond_dev;
```

### Frontend won't start

**Error**: `Module not found`
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Error**: `Port 3000 is already in use`
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Can't connect frontend to backend

**Error**: `Network Error` or `CORS error`
```bash
# 1. Check backend is running: http://localhost:4000/api/health
# 2. Check CORS_ORIGIN in backend/.env is "http://localhost:3000"
# 3. Restart backend server
```

### Database schema issues

**Error**: `Prisma schema is out of sync`
```bash
cd backend
npx prisma generate
npx prisma migrate deploy
```

---

## 📝 Development Workflow

### 1. Starting Work
```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
cd backend && npm install
cd ../frontend && npm install

# Start servers (2 terminals)
cd backend && npm run dev
cd frontend && npm run dev
```

### 2. Making Changes
- Edit files in `frontend/` for UI changes
- Edit files in `backend/` for API changes
- Hot reload is enabled - changes appear automatically

### 3. Database Changes
```bash
# Edit backend/prisma/schema.prisma
# Then create migration
cd backend
npx prisma migrate dev --name your_migration_name
```

### 4. Committing Changes
```bash
# Check what changed
git status
git diff

# Stage changes
git add .

# Commit
git commit -m "Description of changes"

# Push to main
git push origin main
```

---

## 🎨 VS Code Extensions (Recommended)

- **Prisma** - Database schema syntax highlighting
- **ESLint** - JavaScript linting
- **Prettier** - Code formatting
- **Tailwind CSS IntelliSense** - CSS class autocomplete
- **ES7+ React/Redux/React-Native snippets** - React snippets

---

## 🔐 Environment Variables Reference

### Backend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@localhost:5432/db` |
| `RAZORPAY_KEY_ID` | Razorpay test key | `rzp_test_xxxxx` |
| `RAZORPAY_KEY_SECRET` | Razorpay test secret | `your_secret` |
| `NODE_ENV` | Environment | `development` |
| `PORT` | Backend port | `4000` |
| `CORS_ORIGIN` | Allowed frontend URL | `http://localhost:3000` |
| `JWT_SECRET` | JWT signing secret | `dev-secret-key` |
| `UPLOAD_PATH` | File upload directory | `./uploads` |

### Frontend (.env.local)
| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:4000` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay test key | `rzp_test_xxxxx` |
| `NODE_ENV` | Environment | `development` |
| `PORT` | Frontend port | `3000` |
| `NEXT_PUBLIC_LOGO_URL` | Logo URL | `https://...` |

---

## 🚀 Ready to Code!

You're all set! Your local development environment is running:

- ✅ PostgreSQL database
- ✅ Backend API (http://localhost:4000)
- ✅ Frontend website (http://localhost:3000)
- ✅ Hot reload enabled
- ✅ Prisma Studio available (npx prisma studio)

**Start building amazing features!** 🎉

---

## 📞 Need Help?

- Check the main [COMPLETE_DEPLOYMENT_GUIDE.md](COMPLETE_DEPLOYMENT_GUIDE.md) for production setup
- Review [DEPLOYMENT_IMPROVEMENTS.md](DEPLOYMENT_IMPROVEMENTS.md) for recent changes
- Open an issue on GitHub for bugs

---

**Last Updated**: November 1, 2025  
**Environment**: Local Development Setup

