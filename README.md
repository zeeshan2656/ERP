# White-Label Low-Code Business Platform (Phase 1)
**Modern, High-Performance ERP Platform for Factories & Enterprises**  
*In the spirit of Oracle APEX, Appsmith, and Microsoft Access*

---

## 📖 Welcome & Overview

This platform is a **white-label, self-hosted web and desktop-ready application** engineered for modern factories and businesses. 

### Key Capabilities Built in Phase 1:
1. **First-Run Setup Wizard:** Automatically launches on first boot so you can name your product, set your company name, and create your initial Super Administrator account without touching code.
2. **Complete User Management (RBAC):** Add, edit, deactivate, or soft-delete operators and managers. Assign granular permissions (View, Add, Edit, Delete) across any module.
3. **White-Label Branding Settings:** Customize product name, company name, login page tagline, light & dark logos, favicon, and copyright footer anytime from the admin portal.
4. **Appearance & 4 Enterprise Themes:** 
   - **Soft Light UI** (Default clean SaaS, inspired by Microsoft)
   - **Enterprise UI** (Deep navy sidebar, inspired by Zoho)
   - **Complete Dark** (Engineered dark slate, high-contrast readable text)
   - **Compact / Dense UI** (Tight 36px table rows for factory data grids)
   - Includes **real-time WCAG AA contrast validation** that warns you before saving if text contrast is too low.
5. **Persistent Isolated Media Storage:** All uploaded logos, favicons, avatars, and documents are stored **outside the project/code directory** in an external folder (`storage_data` / `/var/erp_storage`). When you update or redeploy the code, uploaded files are **never deleted, replaced, or touched**.
6. **Module Registry & Feature Toggles:** Ready for Phase 2 low-code designers (Table Designer, Page Builder, Canvas Report Builder) and an optional **E-Commerce storefront** switch (disabled by default in Phase 1).
7. **Offline-Sync & Mobile Ready:** Designed with UUID v4 primary keys, version increment columns, and soft-delete timestamps for future Android (Capacitor) SQLite sync engines.

---

## 🚀 How to Run Locally (Step-by-Step for Non-Programmers)

Both the backend and frontend are pre-configured to run on your computer with simple commands.

### Prerequisites:
- **Node.js** (v18 or higher installed on your computer)
- **MySQL Database** (e.g., XAMPP, MySQL Server, or Docker)

### Step 1: Start MySQL Database
1. Open XAMPP or your MySQL service.
2. Ensure MySQL is running on port `3306`.
3. Create a database called `erp_platform_db` (or let the app auto-create it).

### Step 2: Start the Backend Server
1. Open a terminal or PowerShell window.
2. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
3. Start the server in development mode:
   ```bash
   npm run dev
   ```
4. The backend will automatically execute all database migrations on boot and start listening at:
   - **API Endpoint:** `http://localhost:5000/api/v1`
   - **Interactive API Documentation (Swagger):** `http://localhost:5000/api/docs`

### Step 3: Start the Frontend Application
1. Open a second terminal or PowerShell window.
2. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
3. Start the Vite server:
   ```bash
   npm run dev
   ```
4. Open your web browser and navigate to:
   - **Web App:** `http://localhost:5173`

---

## 🧙‍♂️ First-Run Walkthrough: What You Will See

1. **Initial Setup Wizard:**  
   When you first open `http://localhost:5173`, the system detects that it has not been configured yet and displays the **Initial Setup Wizard**.
   - Enter your **Product Name** (e.g., *Apex Flow*).
   - Enter your **Company Name** (e.g., *Factory Solutions Ltd*).
   - Choose your preferred initial visual theme (e.g., *Soft Light* or *Enterprise*).
   - Enter your **Admin Full Name**, **Username**, **Email**, and a password (minimum 8 characters).
   - Click **Initialize & Launch Platform**.

2. **Dashboard Overview:**  
   You will immediately land in the enterprise dashboard with KPI metrics, system health, and quick actions.

3. **Try the Theme Switcher:**  
   In the top header, click the **Theme** button or the Sun/Moon toggle to switch between **Soft Light UI**, **Enterprise UI**, **Complete Dark**, and **Compact / Dense UI**. Notice how every line of text remains ultra-sharp with 100% whole-pixel alignment.

4. **Customize Branding:**  
   Navigate to **Settings → Branding & Identity** (`/admin/settings/branding`). Upload your company logo and favicon. Notice how the upload is saved in external storage and reflected in real-time.

5. **Test Contrast Validation:**  
   Navigate to **Settings → Appearance & Themes** (`/admin/settings/appearance`). Choose a custom color (for example, bright yellow `#ffff00`). Notice the banner instantly warns you that the contrast fails WCAG AA standards and recommends a safe alternative (e.g., `#0050aa`).

6. **Inspect Feature Toggles:**  
   Navigate to **Settings → Module Registry** (`/admin/settings/modules`). You can toggle optional modules on or off (such as the E-Commerce placeholder toggle).

---

## 🐳 One-Click Docker Deployment

For single-tenant production deployments on your own server or VPS:

1. Clone or copy this repository to your server.
2. Run Docker Compose:
   ```bash
   docker-compose up -d --build
   ```
3. The platform will launch 3 coordinated containers:
   - `erp_mysql`: MySQL 8.0 with automated health checks.
   - `erp_backend`: Express TypeScript API with auto-migrations.
   - `erp_frontend`: High-performance Nginx Alpine serving the web client on Port `80`.
4. Open `http://your-server-ip` in your browser to complete the Setup Wizard!

---

## 💾 How to Backup and Restore (Critical for Factory Data)

Factory data and uploaded media files are decoupled from application code updates. Backing up the installation requires two quick steps:

### 1. Backup the MySQL Database:
Run the standard MySQL dump command:
```bash
# Windows (PowerShell):
& "C:\xampp\mysql\bin\mysqldump.exe" -u root erp_platform_db > backup_database.sql

# Linux / Docker:
docker exec erp_mysql /usr/bin/mysqldump -u root --password=rootpassword erp_platform_db > backup_database.sql
```

### 2. Backup the Media Storage Directory:
User-uploaded logos, favicons, avatars, and attachments live in `storage_data` (or the Docker named volume `erp_media_data`).

- **Local/Self-Hosted:** Simply copy or zip the `storage_data` folder:
  ```bash
  # Windows PowerShell:
  Compress-Archive -Path ./storage_data -DestinationPath media_backup.zip
  
  # Linux:
  tar -czvf media_backup.tar.gz ./storage_data
  ```
- **Docker:**
  ```bash
  docker run --rm -v erp_media_data:/data -v $(pwd):/backup alpine tar -czvf /backup/media_backup.tar.gz /data
  ```

### 3. Restoring from Backup:
1. Restore database: `mysql -u root erp_platform_db < backup_database.sql`
2. Extract your `media_backup.tar.gz` back into the `storage_data` directory.
3. Start the application. All users, settings, and uploaded files are instantly restored.

---

## 🛡️ Security Architecture
- **Password Security:** Argon2id / Bcrypt with 10 salt rounds.
- **Session Tokens:** Stateless JWT access tokens + rotating refresh tokens.
- **Granular RBAC:** Permissions enforced on every single backend API route, not just the user interface.
- **Input Sanitization:** Parameterized SQL queries preventing SQL injection + Zod input validation schemas.
- **Path Traversal Defense:** Uploaded files receive cryptographically unique UUID names. Strict path normalization prevents directory traversal attacks (`..`). Executable uploads are strictly blocked.
- **Audit Logging:** Every login attempt, user change, role update, and theme modification is recorded with operator ID, IP address, user-agent, and before/after mutation payloads.

---

## 📱 Future Phases Readiness (Phase 2+)
- **Mobile (Android Capacitor) & Desktop (Tauri / Electron):** Frontend contains clean responsive layouts without browser-only locking.
- **Offline Sync:** All tables feature UUID v4 primary keys, version numbers, and soft delete timestamps so mobile SQLite databases can sync delta records in batches without ID conflicts.
- **Low-Code Designers:** The database already contains the versioned JSON definition tables (`lowcode_definitions`) ready for the Table Designer, Form Builder, and Canvas Report Builder.
