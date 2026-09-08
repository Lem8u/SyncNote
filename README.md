# SyncNote 📝

A high-performance, local-first notepad application inspired by the **Windows 11 Notepad** Fluent Design, featuring real-time multi-device synchronization using **CRDTs (Conflict-free Replicated Data Types)**.

---

## ⚡ Tech Stack

- **Frontend**: React 19 (TypeScript) + Vite
- **Styling**: Tailwind CSS v4 (Windows 11 Fluent Design, Mica acrylic effects, dark mode `#202020`/`#1f1f1f`, Segoe UI / Cascadia Code typography)
- **App Shell**: Tauri 2.0 (Desktop Native wrapper)
- **Local State & CRDT Engine**: Yjs + `y-indexeddb` (100% offline-first, zero-latency persistence)
- **Backend Bridge**: Supabase Realtime Channels & Supabase Auth

---

## 🏗️ Core Architecture & CRDT Synchronization

1. **Local-First Zero Latency**:
   - Reads and writes execute immediately against an in-memory `Y.Doc` and are synchronously persisted to **IndexedDB** using `y-indexeddb`.
   - The app functions 100% offline without network dependencies.

2. **CRDT Real-Time Sync**:
   - Uses `Yjs` binary update protocols (`Uint8Array` base64 encoded) broadcasted over **Supabase Realtime WebSockets** (`broadcast` channels).
   - Upon connection, peers exchange state vectors (`yjs-sync-step-1` & `yjs-sync-step-2`) and merge diffs conflict-free.
   - Live presence tracking displays the number of active connected devices.

3. **Windows 11 Fluent UI Layout**:
   - **Title Bar**: Mica acrylic backdrop, sync status badge, device presence indicator, Settings & Cloud Sync modals.
   - **Tab Strip**: Multi-tab document navigation with dirty state indicators and quick creation (`Ctrl+N`).
   - **Collapsible Sidebar**: Real-time note search, category folders (*All Notes*, *Pinned*, *Personal*, *Work*, *Ideas*), and pinned note management.
   - **Canvas**: Clean note editor with word wrap, font scaling, Cascadia Code / Segoe UI toggles, and live updated cursor statistics.
   - **Status Bar**: `Ln`, `Col`, character & word count, zoom controls, and IndexedDB status.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Vite Development Server
```bash
npm run dev
```

### 3. (Optional) Run Tauri Desktop App
```bash
npm run tauri dev
```

---

## 🌐 Supabase Realtime & Cloud Configuration

You can configure Supabase either via environment variables or directly inside the app UI:

### Option A: Via `.env`
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Option B: Via the In-App Modal
1. Click the **Sync Status Pill** in the top right of the Title Bar.
2. Enter your Supabase Project URL, Public Anon Key, and Workspace ID.
3. Click **Save Credentials & Reconnect Provider**.

