# Project Changelog

## Recent Updates

### Deployment

- Deployed backend to **Render**:
  URL: [https://chat-room-backend-9ude.onrender.com](https://chat-room-backend-9ude.onrender.com)
- Resolved initial build issues related to missing `ts-node`, TypeScript types, and Prisma errors.
- Updated frontend to connect to the deployed backend using Socket.IO.

---

## Backend Updates

### Environment & Tooling

- Added `.env` for storing environment variables.
- Installed and configured **Prisma** ORM.
- Installed and configured **Mongoose** for MongoDB integration.

### Architecture

- Created a modular controller structure for:

  - `joinRoom`
  - `leaveRoom`
  - `sendMessage`
  - `getMessages`
  - `createRoom`
  - `joinRoom`
  - `userJoined`
  - `ownerChanged`
  - `userLeft`
  - `getUserRooms`
  - `typing`
  - `stopTyping`
  - `newMessage`
  - `getRoomMessages`
  - `removeUserFromRoom`
  - `userRemoved`
  - `checkRooms`

- Updated `registerSocketHandlers` to delegate socket events to controller functions.

### Logic Improvements

- Implemented user join/leave with room-based socket broadcasting.
- Added typing indicators: `typing`, `stopTyping`.
- Implemented real-time message creation and emission with Prisma persistence.
- Enabled room admin reassignment when the current owner leaves.
- Added error handling and validation throughout socket event handlers.

### 🔐 Security & Stability

- Configured **CORS** to allow frontend-origin requests.
- Fallbacks and error logging for better backend resilience.

---

## 🎨 Frontend Updates

### 🔧 Services

- Created `config/` directory for centralized **Backend URL** instance.
- Added request interceptors for global error/success handling.

### 🧪 UX Improvements

- Implemented **button loading spinners** for asynchronous actions.
- Disabled actions (e.g., create room, send message) when form data is incomplete.
- Fixed **toast notifications** to display accurate request outcomes.

---

## ✅ Summary

This update establishes a fully functional real-time chat system with a clear separation between frontend/backend responsibilities, persistent messaging, and real-time collaboration features using Socket.IO and Prisma/MongoDB.
