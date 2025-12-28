# PRD: Admin Panel & Security

**Filename**: `docs/prd/01_admin_panel.md`
**Authoritative System**: Admin Panel (Filament/Laravel)

## Purpose

To provide secure access control, system-wide monitoring, and auditability for the platform owners. This system acts as the gatekeeper for who can access the **Visual Editor**.

## In Scope

1.  **Authentication**: Secure login/logout for Administrators.
2.  **User Management**: CRUD operations for Admin users.
    -   _Fields_: Name, Email, Role (Super Admin, Editor), Password.
3.  **Dashboard Statistics**: High-level metrics view.
    -   Total published Scenes/Areas.
    -   Total "Dirty" (Unpublished) nodes.
    -   Recent Activity Logs.
4.  **Activity Logging**: Read-only view of `activity_log` table (who did what, when).

## Out of Scope

1.  **Public User Accounts**: No sign-up/login for public visitors.
2.  **Content Editing**: The Admin Panel listing does NOT edit Scene/Area names or positions. It only links to the Visual Editor.
3.  **Visualization**: No maps or panoramas rendered here.

## Data Ownership

-   **Write**: `users` table.
-   **Read-Only**: `activity_logs`, `areas` (count only), `scenes` (count only).

## Hard Constraints

-   **MUST** use the existing Authentication system (Laravel Breeze/Jetstream/Filament default).
-   **MUST NOT** allow deletion of the last remaining Super Admin.
-   **MUST** link Activity Logs to specific `user_id`.

## Non-Goals

-   A "User Profile" page for public visitors.
-   Complex analytics (heatmap, dwell time) - simple counts only.
