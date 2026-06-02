# Realtime Chat App

Realtime multi-room chat built with Node.js, Express, and Socket.io.

## Features
- Multiple chat rooms (General, Tech Talk, Random)
- Realtime messaging with Socket.io
- Typing indicators
- Online users list per room
- Message history (last 50 per room)
- Clean dark UI

## Local Setup

```bash
npm install
npm start
# Open http://localhost:3000
```

## Jenkins CI/CD

1. Create a Pipeline job in Jenkins
2. Set SCM to this Git repo (main branch)
3. Script Path: `Jenkinsfile`
4. Build Triggers: Poll SCM → `H/5 * * * *`
5. Save → Build Now

Jenkins will poll every 5 minutes, detect new commits, and auto-deploy.
