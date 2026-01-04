# Security & Compliance

## 1. Authentication & Authorization

-   **Authentication:** Standard Laravel Auth (Session based).
-   **Authorization:** `EnsureUserIsAdmin` Middleware.
    -   Checks `Auth::user()->role === 'admin'`.
    -   Applied to all `/admin/*` routes.
-   **CSRF Protection:** Laravel's built-in `VerifyCsrfToken` middleware is active globally. Frontend (Axios) automatically handles the X-XSRF-TOKEN.

## 2. Data Validation

-   **Input Validation:** All Controllers use `$request->validate([...])`.
-   **Sanitization:** Eloquent ORM automatically uses prepared statements, preventing SQL Injection.
-   **File Uploads:**
    -   Strictly validated for MIME type (`image/jpeg`, `image/png`).
    -   Stored with hashed filenames to prevent traversal attacks.

## 3. Database Security

-   **Strict Mode:** PostgreSQL is running in standard strict mode.
-   **Transaction Safety:** The Critical "Publish" action is wrapped in `DB::transaction`. If any part fails (e.g., image move fails), the database rolls back completely, preventing data corruption.

## 4. Minimum Testing Strategy

Before major releases, the following manual tests are mandatory:

1.  **Access Control:**
    -   Try to access `/admin/visual-editor` as a guest (Should redirect to Login).
    -   Try to access `/admin/visual-editor` as a 'pegawai' (Should 403 Forbidden).
2.  **Workflow Integrity:**
    -   Create a Draft Area -> Verify it appears in Editor.
    -   Verify it DOES NOT appear in Public Tour (`/`) yet.
    -   Publish -> Verify it APPEARS in Public Tour.
3.  **Data Integrity:**
    -   Delete a Container Area -> Verify verification warning (Cascade Delete check).

## 5. Deployment Security

-   **Debug Mode:** `APP_DEBUG` must be `false` in production.
-   **HTTPS:** Application must run behind Nginx with valid SSL.
-   **Directory Permissions:** `storage/` and `bootstrap/cache` writable. All other directories read-only for the web user.
