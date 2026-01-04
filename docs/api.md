# API / Routes Documentation

## 1. Public Routes

Accessible by anyone. No authentication required.

| Method | URI             | Action                 | Description                      |
| :----- | :-------------- | :--------------------- | :------------------------------- |
| `GET`  | `/`             | `TourController@index` | Main landing page + Map.         |
| `GET`  | `/tour/{scene}` | `TourController@show`  | 360 Viewer for a specific scene. |
| `GET`  | `/login`        | `AuthController`       | Login page.                      |

## 2. Admin Routes

**Middleware:** `auth`, `admin` (Custom Middleware).
**Prefix:** `/admin/visual-editor/api`

### Area Management

| Method   | URI          | Action          | Description                                      |
| :------- | :----------- | :-------------- | :----------------------------------------------- |
| `POST`   | `/sub-area`  | `createSubArea` | Create a new draft sub-area.                     |
| `GET`    | `/area/{id}` | `showArea`      | Get details of a draft area.                     |
| `PATCH`  | `/area/{id}` | `updateArea`    | Update name, description, lat/lng of draft area. |
| `DELETE` | `/area/{id}` | `destroyArea`   | Mark draft area for deletion (Tombstone).        |

### Scene Management

| Method   | URI                   | Action             | Description                               |
| :------- | :-------------------- | :----------------- | :---------------------------------------- |
| `POST`   | `/scenes/bulk-upload` | `bulkUploadScenes` | Upload multiple images -> creates scenes. |
| `PATCH`  | `/scene/{id}`         | `updateScene`      | Update heading, name.                     |
| `DELETE` | `/scene/{id}`         | `destroyScene`     | Mark scene for deletion.                  |

### Link Management

| Method   | URI                         | Action       | Description                  |
| :------- | :-------------------------- | :----------- | :--------------------------- |
| `POST`   | `/scene/{id}/link`          | `createLink` | Link two scenes (Draft).     |
| `PATCH`  | `/scene/{id}/link/{linkId}` | `updateLink` | visual position (yaw/pitch). |
| `DELETE` | `/scene/{id}/link/{linkId}` | `deleteLink` | Remove link.                 |

### Publish Workflow

| Method | URI                 | Action              | Description                         |
| :----- | :------------------ | :------------------ | :---------------------------------- |
| `GET`  | `/pending-changes`  | `getPendingChanges` | Returns JSON diff of Draft vs Live. |
| `POST` | `/publish-all`      | `publishAll`        | Commit drafts to live tables.       |
| `POST` | `/discard-all/{id}` | `discardDrafts`     | Delete all drafts, reset to live.   |

## 3. Data Formats

**Response (Standard):**

```json
{
    "success": true,
    "data": { ... },
    "message": "Operation successful"
}
```

**Error (Standard):**

```json
{
    "message": "Validation Error",
    "errors": {
        "field_name": ["Error description"]
    }
}
```
