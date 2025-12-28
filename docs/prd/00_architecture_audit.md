# Executive Diagnosis & Architecture Audit

## 1. Executive Diagnosis

The original monolithic PRD presents significant risks for long-term maintenance and AI-assisted development due to **Context Contamination** and **Ambiguous Data Ownership**.

### Top Risks:

1.  **Context Contamination**: Combining "Visual Editor" (Write-heavy, Complex State) with "Public Viewer" (Read-only, High Performance) in one document encourages coupling. An AI developer might mistakenly reuse complex Editor components in the Viewer, bloating the client-side bundle.
2.  **Ambiguous Data Ownership**: The PRD mentions "Auto-Linking" and "GPS" in both Editor and Dashboard sections. It is unclear if the _Viewer_ calculates links on the fly or if the _Editor_ hard-persists them. This risks split-brain logic where the viewer behaves differently than the editor preview.
3.  **State Management Leaks**: "Draft & Publish" is mentioned but not rigorously defined as a boundary. There is a risk of the Viewer accidentally accessing "Modified" (Draft) data if the query logic isn't explicitly constrained to `published_id` only.
4.  **Imprecise "User" Definition**: "User Management" (Admin users) and "User Scenarios" (Public visitors) use the term "User" interchangeably. This risks security flaws where public visitors might be architected into the standard `users` table or auth system unnecessarily.

## 2. System Boundaries Contract

To mitigate these risks, the system is strictly divided into three bounded contexts.

### A. Admin Context (`01_admin_panel`)

-   **Responsibility**: User Authentication, Role Management, High-level System Stats, Audit Logging.
-   **Data Access**: Read/Write to `users`, `activity_logs`. Read-Only to `areas`, `scenes` (for stats only).
-   **Forbidden**: Direct manipulation of Scene/Hotspot visual data (must delegate to Visual Editor).

### B. Editor Context (`02_visual_editor`)

-   **Responsibility**: The **Authoritative Source of Truth** for the Facility Structure. Handles Uploads, GPS Extraction, Hotspot placement, Hierarchy manipulation, and the "Draft" state.
-   **Data Access**: Read/Write to `areas`, `scenes`, `hotspots`.
-   **Input**: Raw Images, Admin Actions.
-   **Output**: Persisted, structured data in the Database (Draft & Published versions).
-   **Forbidden**: Rendering the "User Experience" (Tour). The Editor should use its own preview components, not reuse the public Viewer which has different performance constraints.

### C. Viewer Context (`03_public_viewer`)

-   **Responsibility**: High-performance, read-only presentation of the _Published_ state.
-   **Data Access**: **Strictly Read-Only** access to `areas`, `scenes`, `hotspots`. MUST filter by `published_at != null`.
-   **Forbidden**: Any write operations. Calculations regarding "Auto-linking" (links must be pre-calculated/persisted by Editor).

## 3. AI-Safety Notes

-   **Do not infer "smart" features**: If the PRD says "Auto-link based on GPS", do NOT implement a real-time client-side calculation in the Viewer. Implement it as a server-side action in the Editor that _persists_ the links. usage of CPU/Battery on client devices must be minimized.
-   **Strict Separation of Drafts**: When writing queries for the Viewer, **ALWAYS** force a `whereNotNull('published_at')` (or equivalent) clause. Never assume the default query scopes handle this unless verified.
-   **Asset Optimization**: The Viewer PRD specifies "WebP". AI must ensure the Editor's upload pipeline _produces_ these WebP files. The Viewer should never accept raw uploads.

## 4. Scope Decomposition

The project requirements are split into these atomic documents:

1.  `docs/prd/01_admin_panel.md`: General Administration & Security.
2.  `docs/prd/02_visual_editor.md`: Content Creation & Management.
3.  `docs/prd/03_public_viewer.md`: Public Consumption & Navigation.
