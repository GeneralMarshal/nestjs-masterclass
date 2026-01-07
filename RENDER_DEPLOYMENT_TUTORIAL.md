# 🚀 Render Deployment Tutorial for NestJS Task Management App

Complete step-by-step guide to deploy your NestJS app on Render (100% FREE, no credit card required).

---

## 📋 Prerequisites

Before you begin, make sure you have:

- ✅ **GitHub account** (free) - [Sign up here](https://github.com)
- ✅ **Your code pushed to GitHub** - Your NestJS app should be in a GitHub repository
- ✅ **Render account** (free) - [Sign up here](https://render.com) - No credit card required!

---

## 🎯 Step 1: Create PostgreSQL Database on Render

### 1.1 Navigate to Render Dashboard

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Sign in (or create a free account if you haven't)
3. You'll see the main dashboard

### 1.2 Create PostgreSQL Service

1. Click the **"New +"** button (top right)
2. Select **"PostgreSQL"** from the dropdown menu
3. You'll see the PostgreSQL configuration form

### 1.3 Configure Database Settings

Fill in the following:

- **Name**: `nestjs-task-db` (or any name you prefer)
- **Database**: `task_management` (or any database name)
- **User**: `task_user` (or any username)
- **Region**: Choose the region closest to you (e.g., `Oregon (US West)`)
- **PostgreSQL Version**: Select **15** (recommended, latest stable)
- **Plan**: Select **Free** ✅

### 1.4 Create the Database

1. Click **"Create Database"** button
2. Wait 2-3 minutes for Render to provision your database
3. You'll see a loading screen, then the database dashboard

### 1.5 Get Database Connection Details

⚠️ **IMPORTANT**: Copy these values immediately - you'll need them in Step 3!

Once your database is created, you'll see connection information:

1. Go to the **"Connections"** tab in your database service
2. You'll see:
   - **Internal Database URL**: `postgresql://user:password@hostname:5432/database`
   - **Hostname**: Something like `dpg-xxxxx-a.oregon-postgres.render.com`
   - **Port**: `5432`
   - **Database Name**: `task_management` (or what you named it)
   - **Username**: `task_user` (or what you named it)
   - **Password**: A long random string (shown only once!)

**⚠️ CRITICAL**: Copy the password immediately! You won't be able to see it again. If you lose it, you'll need to reset it or create a new database.

**Example of what you'll see:**
```
Hostname: dpg-abc123xyz-a.oregon-postgres.render.com
Port: 5432
Database: task_management
Username: task_user
Password: abc123xyz789securepassword456
```

---

## 🌐 Step 2: Create Web Service on Render

### 2.1 Create New Web Service

1. In Render Dashboard, click **"New +"** button
2. Select **"Web Service"** from the dropdown
3. You'll be asked to connect your GitHub account (if not already connected)

### 2.2 Connect GitHub Repository

1. Click **"Connect account"** or **"Configure account"** if you see it
2. Authorize Render to access your GitHub repositories
3. Select your repository that contains the NestJS app
4. Click **"Connect"**

### 2.3 Configure Web Service Settings

Fill in the configuration form:

**Basic Settings:**
- **Name**: `nestjs-task-app` (or any name you prefer)
- **Region**: Choose the same region as your database (recommended for lower latency)
- **Branch**: `main` (or your default branch name)
- **Root Directory**: Leave empty (or `./` if your app is in a subdirectory)
- **Runtime**: `Node`
- **Plan**: Select **Free** ✅

**Build & Start Commands:**
- **Build Command**: 
  ```
  npm install && npm run build
  ```
- **Start Command**: 
  ```
  npm run start:prod
  ```

**Why these commands?**
- `npm install` - Installs all dependencies
- `npm run build` - Compiles TypeScript to JavaScript (creates `dist/` folder)
- `npm run start:prod` - Starts the production server (uses `node dist/main`)

### 2.4 Create the Service

1. Click **"Create Web Service"** button
2. Render will start cloning your repository
3. **Don't configure environment variables yet** - we'll do that in the next step

---

## ⚙️ Step 3: Configure Environment Variables

### 3.1 Access Environment Variables

1. In your Web Service dashboard, click the **"Environment"** tab
2. You'll see a form to add environment variables

### 3.2 Add Required Environment Variables

Based on your app's configuration (from `src/config.schema.ts`), you need to add these variables:

#### Variable 1: STAGE
- **Key**: `STAGE`
- **Value**: `prod`
- **Why**: Your validation schema requires this, and your start command uses it

#### Variable 2: Database Connection Variables

Get these from your PostgreSQL service (Step 1.5):

- **Key**: `DB_HOST`
  - **Value**: Your database hostname (e.g., `dpg-abc123xyz-a.oregon-postgres.render.com`)

- **Key**: `DB_PORT`
  - **Value**: `5432` (standard PostgreSQL port)

- **Key**: `DB_USERNAME`
  - **Value**: Your database username (e.g., `task_user`)

- **Key**: `DB_PASSWORD`
  - **Value**: Your database password (the one you copied!)

- **Key**: `DB_DATABASE`
  - **Value**: Your database name (e.g., `task_management`)

#### Variable 3: JWT_SECRET

You need to generate a secure random string for JWT token signing.

**Option 1: Online Generator (Easiest)**
1. Go to [RandomKeygen.com](https://randomkeygen.com/)
2. Copy a **"CodeIgniter Encryption Keys"** (64 characters long)
3. Use that as your JWT_SECRET

**Option 2: Terminal/Command Line**
```bash
# On Mac/Linux:
openssl rand -base64 32

# On Windows PowerShell:
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
```

**Option 3: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

- **Key**: `JWT_SECRET`
- **Value**: Your generated 64-character random string

### 3.3 Complete Environment Variables List

Your final environment variables should look like this:

```
STAGE=prod
DB_HOST=dpg-abc123xyz-a.oregon-postgres.render.com
DB_PORT=5432
DB_USERNAME=task_user
DB_PASSWORD=your-actual-password-here
DB_DATABASE=task_management
JWT_SECRET=your-64-character-random-string-here
```

### 3.4 Save Environment Variables

1. After adding each variable, click **"Add"** or **"Save Changes"**
2. Make sure all variables are listed
3. Double-check that values are correct (especially DB_PASSWORD and DB_HOST)

---

## ⏳ Step 4: Deployment Process

### 4.1 Automatic Deployment

Once you save the environment variables, Render will automatically:

1. **Clone your repository** from GitHub
2. **Run the build command**: `npm install && npm run build`
3. **Start your app**: `npm run start:prod`

### 4.2 Monitor the Build Process

1. Go to the **"Logs"** tab in your Web Service dashboard
2. You'll see real-time logs of the deployment process
3. **First deployment takes 5-10 minutes** (subsequent deployments are faster)

### 4.3 What to Look For in Logs

**Successful Build Indicators:**
```
✓ npm install completed
✓ Building...
✓ Compiled successfully
✓ Application listening on port 10000
```

**Common Log Messages:**
- `npm install` - Installing dependencies
- `nest build` - Compiling TypeScript
- `Application listening on port 10000` - ✅ Your app is running!

**⚠️ Note**: Render automatically sets `PORT=10000`. Your app handles this correctly with `process.env.PORT ?? 3000` in `src/main.ts`.

### 4.4 If Build Fails

If you see errors:
1. Check the error message in logs
2. Common issues:
   - Missing dependencies → Check `package.json`
   - TypeScript errors → Fix compilation errors locally first
   - Missing environment variables → Go back to Step 3
3. Fix the issue, commit, and push to GitHub
4. Render will automatically redeploy

---

## ✅ Step 5: Verify Deployment

### 5.1 Check Service Status

1. In your Web Service dashboard, check the status indicator
2. Should show **"Live"** with a green dot ✅
3. Your app URL will be: `https://your-app-name.onrender.com`

### 5.2 Test Your API Endpoints

Use a tool like Postman, curl, or your browser to test:

**Test Signup Endpoint:**
```bash
POST https://your-app-name.onrender.com/auth/signup
Content-Type: application/json

{
  "username": "testuser",
  "password": "TestPassword123!"
}
```

**Test Signin Endpoint:**
```bash
POST https://your-app-name.onrender.com/auth/signin
Content-Type: application/json

{
  "username": "testuser",
  "password": "TestPassword123!"
}
```

**Expected Response:**
- Signup: `201 Created` with user data
- Signin: `200 OK` with access token

### 5.3 Check Logs for Errors

1. Go to **"Logs"** tab
2. Look for any error messages
3. Common errors and solutions in Troubleshooting section below

### 5.4 Verify Database Connection

If your app starts successfully and you can create users, the database connection is working! ✅

---

## 📝 Important Notes

### Free Tier Limitations

**Render Free Tier:**
- ✅ **750 hours/month** - Enough for testing and small projects
- ⚠️ **Spins down after 15 minutes** of inactivity
- ⚠️ **First request after spin-down** takes ~30 seconds (wake-up time)
- ✅ **Auto-deploys** on every git push
- ✅ **Free PostgreSQL** for 90 days, then $7/month (but you can recreate)

**For Production Use:**
- Consider upgrading to paid plan ($7/month) for:
  - Always-on service (no spin-down)
  - Faster response times
  - More resources
  - Better for real users

### Environment Variable Management

- **Never commit `.env` files** to GitHub (already in your `.gitignore`)
- **All secrets** should be in Render's environment variables
- **Update variables**: Go to Environment tab → Edit → Save (auto-restarts service)

### Auto-Deployment

Render automatically deploys when you:
1. Push to your connected GitHub branch
2. Update environment variables
3. Manually trigger a deploy

**Deployment Process:**
```
Git Push → Render Detects → Clones Repo → Builds → Deploys → Live!
```

---

## 🔧 Troubleshooting

### Issue 1: "Unable to connect to the database"

**Symptoms:**
- Logs show: `ECONNREFUSED` or `Connection refused`
- App fails to start

**Solutions:**
1. ✅ Verify database is running (green status in Render dashboard)
2. ✅ Check `DB_HOST` is correct (no typos)
3. ✅ Verify `DB_USERNAME` and `DB_PASSWORD` match database settings
4. ✅ Ensure `DB_PORT` is `5432`
5. ✅ Check database and web service are in the same region

### Issue 2: "JWT_SECRET is required" or Validation Error

**Symptoms:**
- App crashes on startup
- Logs show: `ValidationError` or missing JWT_SECRET

**Solutions:**
1. ✅ Go to Environment tab
2. ✅ Verify `JWT_SECRET` is set
3. ✅ Make sure it's a long random string (64+ characters)
4. ✅ Check `STAGE=prod` is set

### Issue 3: "Port already in use" or Port Errors

**Symptoms:**
- App won't start
- Port-related errors

**Solutions:**
- ✅ Your code already handles this correctly!
- ✅ `src/main.ts` uses `process.env.PORT ?? 3000`
- ✅ Render automatically sets `PORT=10000`
- ✅ Should work automatically - if not, check logs for specific error

### Issue 4: Build Fails - TypeScript Errors

**Symptoms:**
- Build logs show TypeScript compilation errors
- Deployment fails

**Solutions:**
1. ✅ Fix errors locally first: `npm run build`
2. ✅ Make sure all TypeScript errors are resolved
3. ✅ Commit and push fixes
4. ✅ Render will redeploy automatically

### Issue 5: 502 Bad Gateway

**Symptoms:**
- Service shows "Live" but requests fail
- 502 error when accessing URL

**Solutions:**
1. ✅ Service might be spinning up (wait 30 seconds after first request)
2. ✅ Check logs for runtime errors
3. ✅ Verify start command is correct: `npm run start:prod`
4. ✅ Check if app is listening on correct port (should be 10000)

### Issue 6: Environment Variables Not Working

**Symptoms:**
- App starts but can't read env vars
- Validation errors

**Solutions:**
1. ✅ Make sure variables are saved (click "Save Changes")
2. ✅ Check for typos in variable names (case-sensitive!)
3. ✅ Verify all required variables are set (see Step 3)
4. ✅ Service restarts automatically after saving env vars

---

## 🛠️ Optional Code Improvements

These improvements are **optional** - your app will work fine without them, but they make your code more production-ready and easier to deploy.

### Improvement 1: Make .env File Optional for Render

**Current Code** (`src/app.module.ts` line 10):
```typescript
envFilePath: [`.env.stage.${process.env.STAGE}`],
```

**Why This Matters:**
- Render doesn't use `.env` files - it uses environment variables directly
- Current code tries to load a file that doesn't exist on Render
- ConfigModule still works (reads from `process.env` by default), but you'll see a warning

**Improved Code:**
```typescript
envFilePath: process.env.STAGE ? [`.env.stage.${process.env.STAGE}`] : undefined,
```

**Benefits:**
- ✅ No warnings about missing .env file on Render
- ✅ Still works locally with .env files
- ✅ Cleaner deployment logs

**Where to Change:**
- File: `src/app.module.ts`
- Line: ~10 (in `ConfigModule.forRoot()`)

---

### Improvement 2: Disable Synchronize in Production

**Current Code** (`src/app.module.ts` line 20):
```typescript
synchronize: true,
```

**Why This Matters:**
- `synchronize: true` automatically creates/updates database tables
- In production, this can accidentally delete data or change schema unexpectedly
- Fine for development, risky for production

**Improved Code:**
```typescript
synchronize: configService.get('NODE_ENV') !== 'production',
```

**Benefits:**
- ✅ Safe for production (won't auto-modify database)
- ✅ Still convenient for development
- ✅ Prevents accidental data loss

**Where to Change:**
- File: `src/app.module.ts`
- Line: ~20 (in `TypeOrmModule.forRootAsync()` useFactory)

**Note:** For production, you'd use migrations instead of synchronize. But for free tier/testing, current setup is fine.

---

### Improvement 3: Make ConfigModule Global

**Current Code** (`src/app.module.ts` line 9-12):
```typescript
ConfigModule.forRoot({
  envFilePath: [`.env.stage.${process.env.STAGE}`],
  validationSchema: configValidationSchema,
}),
```

**Why This Matters:**
- Currently, if you want to use `ConfigService` in other modules, you need to import `ConfigModule` again
- Makes it less convenient to access environment variables

**Improved Code:**
```typescript
ConfigModule.forRoot({
  envFilePath: [`.env.stage.${process.env.STAGE}`],
  validationSchema: configValidationSchema,
  isGlobal: true, // Makes ConfigService available everywhere
}),
```

**Benefits:**
- ✅ Use `ConfigService` in any module without re-importing `ConfigModule`
- ✅ Cleaner code
- ✅ More convenient

**Where to Change:**
- File: `src/app.module.ts`
- Line: ~9-12 (in `ConfigModule.forRoot()`)

---

### Improvement 4: Make STAGE Optional with Default

**Current Code** (`src/config.schema.ts` line 4):
```typescript
STAGE: Joi.string().required(),
```

**Why This Matters:**
- Currently, `STAGE` must be explicitly set
- If someone forgets to set it, validation fails
- Less flexible

**Improved Code:**
```typescript
STAGE: Joi.string().default('prod'),
```

**Benefits:**
- ✅ More flexible - works even if STAGE isn't set
- ✅ Defaults to 'prod' (production)
- ✅ Still validates that it's a string if provided

**Where to Change:**
- File: `src/config.schema.ts`
- Line: ~4 (in `configValidationSchema`)

**Note:** You'd still want to set `STAGE=prod` on Render, but this makes it more forgiving.

---

## 🎯 Production Considerations

### Current Setup Assessment

Your current code will work fine on Render's free tier! Here's what's good and what could be improved:

**✅ What's Already Good:**
- Port handling (`process.env.PORT ?? 3000`) - works perfectly with Render
- Environment variable configuration - properly set up
- Build process - correct commands
- Database connection - properly configured

**⚠️ Optional Improvements:**
- `synchronize: true` - Fine for free tier/testing, but consider disabling for real production
- `.env` file path - Works but shows warnings (see Improvement 1)
- ConfigModule scope - Works but could be more convenient (see Improvement 3)

### Security Best Practices

1. **JWT_SECRET**: 
   - ✅ Use a long, random string (64+ characters)
   - ✅ Never commit to GitHub
   - ✅ Store only in Render environment variables

2. **Database Password**:
   - ✅ Never commit to GitHub
   - ✅ Use Render's generated password (strong and secure)
   - ✅ Store only in Render environment variables

3. **Environment Variables**:
   - ✅ All secrets in Render, not in code
   - ✅ `.env` files in `.gitignore` (already done ✅)

### JWT_SECRET Generation Methods

**Recommended: 64+ character random string**

**Method 1: Online (Easiest)**
- [RandomKeygen.com](https://randomkeygen.com/) → CodeIgniter Encryption Keys

**Method 2: OpenSSL (Most Secure)**
```bash
openssl rand -base64 32  # Generates 44 characters
openssl rand -base64 48  # Generates 64 characters (recommended)
```

**Method 3: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

---

## 🎉 You're Done!

Your NestJS app is now live on Render! 🚀

**Your App URL:** `https://your-app-name.onrender.com`

### Next Steps

1. ✅ Test all your API endpoints
2. ✅ Share your app URL with others
3. ✅ Monitor logs regularly
4. ✅ Set up custom domain (optional, paid feature)
5. ✅ Consider implementing the optional improvements for better production readiness

### Quick Reference

**Render Dashboard:** https://dashboard.render.com

**Your Services:**
- Web Service: `https://dashboard.render.com/web/your-app-name`
- PostgreSQL: `https://dashboard.render.com/databases/your-db-name`

**Useful Commands:**
- View logs: Render Dashboard → Your Service → Logs tab
- Update env vars: Render Dashboard → Your Service → Environment tab
- Manual deploy: Render Dashboard → Your Service → Manual Deploy

---

## 💡 Pro Tips

1. **Monitor Logs**: Check logs regularly, especially after deployments
2. **Database Backups**: Free tier doesn't include automatic backups - export data regularly if needed
3. **Health Check Endpoint**: Consider adding a `/health` endpoint for monitoring
4. **Rate Limiting**: For production, consider adding rate limiting to prevent abuse
5. **Error Tracking**: Consider adding error tracking (Sentry, etc.) for production

---

## 🆘 Need Help?

- **Render Documentation**: https://render.com/docs
- **Render Community**: Check Render's community forums
- **NestJS Documentation**: https://docs.nestjs.com

**Common Questions:**
- Q: Can I use a custom domain? A: Yes, but it's a paid feature
- Q: How do I update my app? A: Just push to GitHub - auto-deploys!
- Q: Can I have multiple environments? A: Yes, create separate services for dev/staging/prod

---

**Congratulations on deploying your NestJS app! 🎊**

