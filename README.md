# TASK MANAGEMENT APP

## Techstack

1. Frontend
- React
- Tauri

2. Backend
- Express JS

3. Database
- Mysql

## Prerequisite
- Mysql
- Node + npm
- Rust + cargo

## ✅ 1. Run in Dev Mode (for development)
You want both the backend and frontend running while Tauri wraps it:

**👉 Run Backend**

```bash
cd backend
npm install         # install dependencies
npm run dev         # or: node server.js, depending on your script
```

**👉 Run Frontend + Tauri**
```bash
cd frontend
npm install         # install frontend deps
npm run dev         # start Vite dev server
```
> Vite runs on localhost:5173 by default.

**👉 Run Tauri dev wrapper**
Make sure you’re in frontend dir (since that's the Tauri frontend root):

```bash
npm run tauri dev
```

This launches the native desktop app with live-reloading frontend and backend.

### 🧱 2. Build Production App
This compiles your app for distribution as a native binary.

**Step 1: Build frontend**

```bash
cd frontend
npm run build       # outputs to frontend/dist
```

**Step 2: Ensure backend works standalone**

- Your backend/server.js must be ready to be packaged (e.g., served via localhost or bundled via something like pkg, nexe, or Tauri-side native command).

- Or you may embed static backend features, or call a remote API (like a cloud-deployed backend).

**Step 3: Build Tauri app**
From **frontend**:

```bash
npm run tauri build
```

This will generate a native ``.app``,``.exe``, or ``.deb`` in ``src-tauri/target/release/bundle``.

📦 3. Update Dependencies

**Frontend**:

```bash
cd frontend
npm outdated        # check outdated packages
npm update          # update to latest safe versions
```

**Backend**:

```bash
cd backend
npm outdated
npm update
```

**Tauri (Rust dependencies)**:

```bash
cd src-tauri
cargo update        # update Rust crates
```

If Tauri CLI or Core is outdated:

```bash
cargo install tauri-cli --force
```