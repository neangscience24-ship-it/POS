# 🏷️ Brand API Testing Guide (`brand_api_test.md`)

Comprehensive testing instructions, HTTP specifications, cURL commands, and request/response payloads for the **Brand** feature in the POS System.

---

## 🌐 Environment & Base Configuration

- **Base URL**: `http://localhost:3000`
- **Prefix Path**: `/api/v1/brand`
- **Default Headers**:
  ```http
  Content-Type: application/json
  Accept: application/json
  ```

---

## 📋 Endpoints Overview

| # | Action | Method | Endpoint Path | Auth Required | Description |
|---|---|---|---|---|---|
| 1 | Create Brand | `POST` | `/api/v1/brand/create` | No | Create a new brand |
| 2 | Get All Brands | `GET` | `/api/v1/brand/getall` | No | List brands with search & status filters |
| 3 | Update Brand | `PUT` | `/api/v1/brand/update/:id` | No | Update brand name, description, or status |
| 4 | Delete Brand | `DELETE` | `/api/v1/brand/delete/:id` | No | Delete a brand by ID |

---

## 🧪 Detailed Test Cases & Requests

### 1. Create Brand

Creates a new brand record.

- **Method**: `POST`
- **URL**: `http://localhost:3000/api/v1/brand/create`
- **Headers**:
  ```http
  Content-Type: application/json
  ```

#### Request Body Schema:
| Field | Type | Required | Description | Example |
|---|---|---|---|---|
| `brand_name` | `string` | **Yes** | Unique brand name | `"Starbucks"` |
| `description` | `string` | No | Optional brand description | `"Global coffeehouse chain and coffee brand"` |
| `active` | `number` / `boolean` | No | Status (1 = Active, 0 = Inactive, Default: 1) | `1` |

#### Request Body (JSON):
```json
{
  "brand_name": "Starbucks",
  "description": "Global coffeehouse chain and coffee brand",
  "active": 1
}
```

#### Expected Responses:

- **`201 Created` - Success Response:**
  ```json
  {
    "success": true,
    "message": "Brand created successfully",
    "data": {
      "brand_id": 1,
      "brand_name": "Starbucks",
      "description": "Global coffeehouse chain and coffee brand",
      "active": 1,
      "created_date": "2026-09-30T14:10:00.000Z",
      "updated_date": "2026-09-30T14:10:00.000Z"
    }
  }
  ```

- **`400 Bad Request` - Missing Required Field:**
  ```json
  {
    "success": false,
    "message": "brand_name is required"
  }
  ```

- **`400 Bad Request` - Duplicate Brand Name:**
  ```json
  {
    "success": false,
    "message": "Brand 'Starbucks' already exists"
  }
  ```

#### cURL Command:
```bash
curl -X POST http://localhost:3000/api/v1/brand/create \
  -H "Content-Type: application/json" \
  -d '{
    "brand_name": "Starbucks",
    "description": "Global coffeehouse chain and coffee brand",
    "active": 1
  }'
```

---

### 2. Get All Brands

Retrieves all brands with optional search keyword and status filtering.

- **Method**: `GET`
- **URL**: `http://localhost:3000/api/v1/brand/getall`
- **Headers**:
  ```http
  Accept: application/json
  ```

#### Query Parameters:
| Parameter | Type | Required | Description | Example |
|---|---|---|---|---|
| `search` | `string` | No | Search substring in `brand_name` | `?search=Starbucks` |
| `active` | `number` / `string` | No | Filter status (`1`, `0`, `true`, `false`) | `?active=1` |

#### Example URLs:
1. **Get all without filter**: `http://localhost:3000/api/v1/brand/getall`
2. **Search by keyword**: `http://localhost:3000/api/v1/brand/getall?search=Starbucks`
3. **Filter active only**: `http://localhost:3000/api/v1/brand/getall?active=1`
4. **Combined search & filter**: `http://localhost:3000/api/v1/brand/getall?search=Starbucks&active=1`

#### Expected Response (`200 OK`):
```json
{
  "success": true,
  "total": 2,
  "list": [
    {
      "brand_id": 2,
      "brand_name": "Nescafe",
      "description": "Instant and ground coffee products",
      "active": 1,
      "created_date": "2026-09-30T14:12:00.000Z",
      "updated_date": "2026-09-30T14:12:00.000Z"
    },
    {
      "brand_id": 1,
      "brand_name": "Starbucks",
      "description": "Global coffeehouse chain and coffee brand",
      "active": 1,
      "created_date": "2026-09-30T14:10:00.000Z",
      "updated_date": "2026-09-30T14:10:00.000Z"
    }
  ]
}
```

#### cURL Command:
```bash
curl -X GET "http://localhost:3000/api/v1/brand/getall?search=Starbucks&active=1" \
  -H "Accept: application/json"
```

---

### 3. Update Brand

Updates an existing brand by ID.

- **Method**: `PUT`
- **URL**: `http://localhost:3000/api/v1/brand/update/1`
- **Headers**:
  ```http
  Content-Type: application/json
  ```

#### Request Body (JSON):
```json
{
  "brand_name": "Starbucks Coffee Co.",
  "description": "Premium roasted coffee & beverages",
  "active": 1
}
```

#### Expected Responses:

- **`200 OK` - Success Response:**
  ```json
  {
    "success": true,
    "message": "Brand updated successfully",
    "data": {
      "brand_id": 1,
      "brand_name": "Starbucks Coffee Co.",
      "description": "Premium roasted coffee & beverages",
      "active": 1,
      "created_date": "2026-09-30T14:10:00.000Z",
      "updated_date": "2026-09-30T14:15:00.000Z"
    }
  }
  ```

- **`400 Bad Request` - Duplicate Name:**
  ```json
  {
    "success": false,
    "message": "Brand name 'Starbucks Coffee Co.' is already in use"
  }
  ```

- **`404 Not Found` - Brand Does Not Exist:**
  ```json
  {
    "success": false,
    "message": "Brand with ID 999 not found"
  }
  ```

#### cURL Command:
```bash
curl -X PUT http://localhost:3000/api/v1/brand/update/1 \
  -H "Content-Type: application/json" \
  -d '{
    "brand_name": "Starbucks Coffee Co.",
    "description": "Premium roasted coffee & beverages",
    "active": 1
  }'
```

---

### 4. Delete Brand

Deletes a brand permanently by ID.

- **Method**: `DELETE`
- **URL**: `http://localhost:3000/api/v1/brand/delete/1`
- **Headers**:
  ```http
  Accept: application/json
  ```

#### Expected Responses:

- **`200 OK` - Success Response:**
  ```json
  {
    "success": true,
    "message": "Brand with ID 1 deleted successfully"
  }
  ```

- **`404 Not Found` - Brand Does Not Exist:**
  ```json
  {
    "success": false,
    "message": "Brand with ID 999 not found"
  }
  ```

#### cURL Command:
```bash
curl -X DELETE http://localhost:3000/api/v1/brand/delete/1 \
  -H "Accept: application/json"
```

---

## ⚡ Postman / Thunder Client Testing Workflow

1. **Step 1: Create Brand** -> Call `POST /api/v1/brand/create` with `"brand_name": "Amazon Cafe"`. Note the returned `brand_id`.
2. **Step 2: Verify List** -> Call `GET /api/v1/brand/getall?search=Amazon` to verify it appears in the list.
3. **Step 3: Update Brand** -> Call `PUT /api/v1/brand/update/:id` to modify details or status.
4. **Step 4: Delete Brand** -> Call `DELETE /api/v1/brand/delete/:id` to remove the brand.
5. **Step 5: Verify Deletion** -> Call `GET /api/v1/brand/getall?search=Amazon` to confirm it has been deleted.
