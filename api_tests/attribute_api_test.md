# 🎨 Attribute API Testing Guide (`attribute_api_test.md`)

Comprehensive testing instructions, HTTP specifications, cURL commands, and request/response payloads for the **Attribute** feature in the POS System.

---

## 🌐 Environment & Base Configuration

- **Base URL**: `http://localhost:5000`
- **Prefix Path**: `/api/v1/attribute`
- **Default Headers**:
  ```http
  Content-Type: application/json
  Accept: application/json
  ```

---

## 📋 Endpoints Overview

| # | Action | Method | Endpoint Path | Auth Required | Description |
|---|---|---|---|---|---|
| 1 | Create Attribute | `POST` | `/api/v1/attribute/create` | No | Create a new product attribute (e.g., Size, Sugar Level, Ice) |
| 2 | Get All Attributes | `GET` | `/api/v1/attribute/getall` | No | List attributes with search & status filters |
| 3 | Update Attribute | `PUT` | `/api/v1/attribute/update/:id` | No | Update attribute name, value, or status |
| 4 | Delete Attribute | `DELETE` | `/api/v1/attribute/delete/:id` | No | Delete an attribute by ID |

---

## 🧪 Detailed Test Cases & Requests

### 1. Create Attribute

Creates a new attribute definition and value.

- **Method**: `POST`
- **URL**: `http://localhost:5000/api/v1/attribute/create`
- **Headers**:
  ```http
  Content-Type: application/json
  ```

#### Request Body Schema:
| Field | Type | Required | Description | Example |
|---|---|---|---|---|
| `attribute_name` | `string` | **Yes** | Name of the attribute category | `"Size"`, `"Sugar Level"`, `"Ice Level"` |
| `attribute_value` | `string` | **Yes** | Specific value / option | `"Grande (16oz)"`, `"50% Less Sweet"` |
| `active` | `number` / `boolean` | No | Status (1 = Active, 0 = Inactive, Default: 1) | `1` |

#### Request Body (JSON):
```json
{
  "attribute_name": "Size",
  "attribute_value": "Grande (16oz)",
  "active": 1
}
```

#### Expected Responses:

- **`201 Created` - Success Response:**
  ```json
  {
    "success": true,
    "message": "Attribute created successfully",
    "data": {
      "attribute_id": 1,
      "attribute_name": "Size",
      "attribute_value": "Grande (16oz)",
      "active": 1,
      "created_date": "2026-09-30T14:20:00.000Z",
      "updated_date": "2026-09-30T14:20:00.000Z"
    }
  }
  ```

- **`400 Bad Request` - Missing Required Fields:**
  ```json
  {
    "success": false,
    "message": "attribute_name and attribute_value are required"
  }
  ```

#### cURL Command:
```bash
curl -X POST http://localhost:5000/api/v1/attribute/create \
  -H "Content-Type: application/json" \
  -d '{
    "attribute_name": "Size",
    "attribute_value": "Grande (16oz)",
    "active": 1
  }'
```

---

### 2. Get All Attributes

Retrieves all attributes with optional search across `attribute_name` & `attribute_value`, and active status filtering.

- **Method**: `GET`
- **URL**: `http://localhost:5000/api/v1/attribute/getall`
- **Headers**:
  ```http
  Accept: application/json
  ```

#### Query Parameters:
| Parameter | Type | Required | Description | Example |
|---|---|---|---|---|
| `search` | `string` | No | Search query matching name or value | `?search=Size` or `?search=Grande` |
| `active` | `number` / `string` | No | Filter active status (`1`, `0`, `true`, `false`) | `?active=1` |

#### Example URLs:
1. **Get all without filter**: `http://localhost:5000/api/v1/attribute/getall`
2. **Search by keyword**: `http://localhost:5000/api/v1/attribute/getall?search=Size`
3. **Filter active only**: `http://localhost:5000/api/v1/attribute/getall?active=1`
4. **Combined search & filter**: `http://localhost:5000/api/v1/attribute/getall?search=Sugar&active=1`

#### Expected Response (`200 OK`):
```json
{
  "success": true,
  "total": 3,
  "list": [
    {
      "attribute_id": 3,
      "attribute_name": "Sugar Level",
      "attribute_value": "50% Normal",
      "active": 1,
      "created_date": "2026-09-30T14:21:00.000Z",
      "updated_date": "2026-09-30T14:21:00.000Z"
    },
    {
      "attribute_id": 2,
      "attribute_name": "Size",
      "attribute_value": "Venti (24oz)",
      "active": 1,
      "created_date": "2026-09-30T14:20:30.000Z",
      "updated_date": "2026-09-30T14:20:30.000Z"
    },
    {
      "attribute_id": 1,
      "attribute_name": "Size",
      "attribute_value": "Grande (16oz)",
      "active": 1,
      "created_date": "2026-09-30T14:20:00.000Z",
      "updated_date": "2026-09-30T14:20:00.000Z"
    }
  ]
}
```

#### cURL Command:
```bash
curl -X GET "http://localhost:5000/api/v1/attribute/getall?search=Size&active=1" \
  -H "Accept: application/json"
```

---

### 3. Update Attribute

Updates an existing attribute record by ID.

- **Method**: `PUT`
- **URL**: `http://localhost:5000/api/v1/attribute/update/1`
- **Headers**:
  ```http
  Content-Type: application/json
  ```

#### Request Body (JSON):
```json
{
  "attribute_name": "Cup Size",
  "attribute_value": "Grande (16oz / 473ml)",
  "active": 1
}
```

#### Expected Responses:

- **`200 OK` - Success Response:**
  ```json
  {
    "success": true,
    "message": "Attribute updated successfully",
    "data": {
      "attribute_id": 1,
      "attribute_name": "Cup Size",
      "attribute_value": "Grande (16oz / 473ml)",
      "active": 1,
      "created_date": "2026-09-30T14:20:00.000Z",
      "updated_date": "2026-09-30T14:25:00.000Z"
    }
  }
  ```

- **`404 Not Found` - Attribute Does Not Exist:**
  ```json
  {
    "success": false,
    "message": "Attribute with ID 999 not found"
  }
  ```

#### cURL Command:
```bash
curl -X PUT http://localhost:5000/api/v1/attribute/update/1 \
  -H "Content-Type: application/json" \
  -d '{
    "attribute_name": "Cup Size",
    "attribute_value": "Grande (16oz / 473ml)",
    "active": 1
  }'
```

---

### 4. Delete Attribute

Deletes an attribute record permanently by ID.

- **Method**: `DELETE`
- **URL**: `http://localhost:5000/api/v1/attribute/delete/1`
- **Headers**:
  ```http
  Accept: application/json
  ```

#### Expected Responses:

- **`200 OK` - Success Response:**
  ```json
  {
    "success": true,
    "message": "Attribute with ID 1 deleted successfully"
  }
  ```

- **`404 Not Found` - Attribute Does Not Exist:**
  ```json
  {
    "success": false,
    "message": "Attribute with ID 999 not found"
  }
  ```

#### cURL Command:
```bash
curl -X DELETE http://localhost:5000/api/v1/attribute/delete/1 \
  -H "Accept: application/json"
```

---

## ⚡ Postman / Thunder Client Testing Workflow

1. **Step 1: Create Attribute** -> Call `POST /api/v1/attribute/create` with `attribute_name: "Ice Level"`, `attribute_value: "Normal Ice (100%)"`.
2. **Step 2: Verify List** -> Call `GET /api/v1/attribute/getall?search=Ice` to confirm creation.
3. **Step 3: Update Attribute** -> Call `PUT /api/v1/attribute/update/:id` to rename value to `"Extra Ice (120%)"`.
4. **Step 4: Delete Attribute** -> Call `DELETE /api/v1/attribute/delete/:id` to delete the attribute.
5. **Step 5: Verify Deletion** -> Call `GET /api/v1/attribute/getall?search=Ice` to verify removal.
