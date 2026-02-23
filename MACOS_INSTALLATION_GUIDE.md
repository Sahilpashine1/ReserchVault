# 🍎 macOS Installation Guide
## Faculty Publications Management System

Follow these steps to install all required software on your MacBook.

---

## ⚙️ What You Need to Install

1. **Homebrew** - Package manager for Mac
2. **Node.js** - JavaScript runtime for backend
3. **MongoDB** - Database system

**Total Time**: ~15-20 minutes

---

## 📋 Step-by-Step Installation

### **Step 1: Install Homebrew** (5 minutes)

Homebrew is the easiest way to install software on Mac.

1. **Open Terminal** (if not already open)
   - Press `Cmd + Space`
   - Type "Terminal"
   - Press Enter

2. **Run this command:**
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

3. **Follow the prompts:**
   - It will ask for your Mac password (the one you use to login)
   - Type your password (you won't see it while typing - this is normal)
   - Press Enter
   - Press Enter again when it asks to continue

4. **Wait for installation** (~5 minutes)
   - You'll see a lot of text scrolling
   - Don't close the terminal!

5. **After installation completes, you'll see instructions to add Homebrew to your PATH**
   
   Run these commands (they'll be shown at the end):
   ```bash
   echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
   eval "$(/opt/homebrew/bin/brew shellenv)"
   ```

6. **Verify Homebrew is installed:**
   ```bash
   brew --version
   ```
   
   ✅ You should see: `Homebrew 4.x.x` or similar

---

### **Step 2: Install Node.js** (3 minutes)

Node.js includes npm (package manager) which you need for the backend.

1. **Install Node.js using Homebrew:**
   ```bash
   brew install node
   ```

2. **Wait for installation** (~2-3 minutes)

3. **Verify installation:**
   ```bash
   node --version
   npm --version
   ```
   
   ✅ You should see version numbers like:
   - `v20.x.x` (Node.js)
   - `10.x.x` (npm)

---

### **Step 3: Install MongoDB** (5 minutes)

MongoDB is the database for your Faculty Publications system.

1. **Tap the MongoDB repository:**
   ```bash
   brew tap mongodb/brew
   ```

2. **Install MongoDB Community Edition:**
   ```bash
   brew install mongodb-community
   ```

3. **Wait for installation** (~3-5 minutes)

4. **Start MongoDB as a service:**
   ```bash
   brew services start mongodb-community
   ```

5. **Verify MongoDB is running:**
   ```bash
   brew services list
   ```
   
   ✅ You should see `mongodb-community` with status `started` (green)

---

### **Step 4: Install Backend Dependencies** (2 minutes)

Now install the Node.js packages for your project.

1. **Navigate to backend folder:**
   ```bash
   cd /Users/jidnyasabharambe/AntigravityProjects/New\ folder/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Wait for installation** (~1-2 minutes)
   
   ✅ You should see: `added XXX packages`

---

## 🚀 Step 5: Test the Application

Now let's see if everything works!

1. **Make sure you're in the backend folder:**
   ```bash
   cd /Users/jidnyasabharambe/AntigravityProjects/New\ folder/backend
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Look for success message:**
   ```
   ✅ MongoDB Connected Successfully
   ╔════════════════════════════════════════════════╗
   ║   Faculty Publications Management System      ║
   ║   Server running on port 5000                 ║
   ╚════════════════════════════════════════════════╝
   ```

4. **Open your browser:**
   - Go to: **http://localhost:5000**
   - You should see the beautiful login page!

---

## ✅ Installation Complete!

You've successfully installed:
- ✅ Homebrew
- ✅ Node.js & npm
- ✅ MongoDB
- ✅ Project dependencies

---

## 🆘 Troubleshooting

### Problem: "command not found: brew"
**After installing Homebrew**, run:
```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```
Then close and reopen Terminal.

---

### Problem: "MongoDB connection failed"
**Make sure MongoDB is running:**
```bash
brew services start mongodb-community
```

Check if it's running:
```bash
brew services list
```

---

### Problem: "Port 5000 is already in use"
**Kill the process using port 5000:**
```bash
lsof -ti:5000 | xargs kill -9
```

Then try `npm start` again.

---

### Problem: "npm install" fails
**Clear cache and try again:**
```bash
npm cache clean --force
npm install
```

---

### Problem: Password prompt during Homebrew install
**This is normal!** Type your Mac login password (you won't see it while typing).

---

## 🎯 Quick Commands Reference

```bash
# Check if software is installed
brew --version
node --version
npm --version

# Start MongoDB
brew services start mongodb-community

# Stop MongoDB
brew services stop mongodb-community

# Restart MongoDB
brew services restart mongodb-community

# Start your application
cd /Users/jidnyasabharambe/AntigravityProjects/New\ folder/backend
npm start

# Stop your application
# Press Ctrl + C in the terminal
```

---

## 📞 Next Steps After Installation

1. ✅ Create your first account
2. ✅ Add some publications
3. ✅ Test the chatbot
4. ✅ Upload Excel files

See **QUICK_START.md** for detailed usage guide!

---

## 🌟 Pro Tips

- **MongoDB will auto-start** on system boot after installation
- **Keep Terminal open** while the server is running
- **Use Ctrl + C** to stop the server (not closing the terminal window)
- **Check MongoDB status** anytime with: `brew services list`

---

**Installation Guide Created**: February 16, 2026
**Estimated Time**: 15-20 minutes
**Status**: Ready to follow!

---

Good luck! 🚀
