# 📦 Category API Testing Guide (`category_api_test.md`)

Comprehensive testing instructions, HTTP specifications, cURL commands, and request/response payloads for the **Category** feature in the POS System.

---

## 🌐 Environment & Base Configuration

- **Base URL**: `http://localhost:3000`
- **Prefix Path**: `/api/v1/category`
- **Default Headers**:
  ```http
  Content-Type: application/json
  Accept: application/json
  ```

---

## 📋 Endpoints Overview

| # | Action | Method | Endpoint Path | Auth Required | Description |
|---|---|---|---|---|---|
| 1 | Create Category | `POST` | `/api/v1/category/create` | No | Create a new product category |
| 2 | Get All Categories | `GET` | `/api/v1/category/getall` | No | List categories with search & status filters |
| 3 | Update Category | `PUT` | `/api/v1/category/update/:id` | No | Update category name, description, or status |
| 4 | Delete Category | `DELETE` | `/api/v1/category/delete/:id` | No | Delete a category by ID |

---

## 🧪 Detailed Test Cases & Requests

### 1. Create Category

Creates a new category record.

- **Method**: `POST`
- **URL**: `http://localhost:3000/api/v1/category/create`
- **Headers**:
  ```http
  Content-Type: application/json
  ```

#### Request Body Schema:
| Field | Type | Required | Description | Example |
|---|---|---|---|---|
| `category_name` | `string` | **Yes** | Unique category name | `"Hot Coffee"` |
| `description` | `string` | No | Optional description | `"Espresso, Americano, Latte, Cappuccino"` |
| `active` | `number` / `boolean` | No | Status (1 = Active, 0 = Inactive, Default: 1) | `1` |

#### Request Body (JSON):
```json
{
  "category_name": "Hot Coffee",
  "description": "Espresso, Americano, Latte, Cappuccino",
  "active": 1
}
```

#### Expected Responses:

- **`201 Created` - Success Response:**
  ```json
  {
    "success": true,
    "message": "Category created successfully",
    "data": {
      "category_id": 1,
      "category_name": "Hot Coffee",
      "description": "Espresso, Americano, Latte, Cappuccino",
      "active": 1,
      "created_date": "2026-09-30T13:58:00.000Z",
      "updated_date": "2026-09-30T13:58:00.000Z"
    }
  }
  ```

- **`400 Bad Request` - Missing Required Field:**
  ```json
  {
    "success": false,
    "message": "category_name is required"
  }
  ```

- **`400 Bad Request` - Duplicate Category Name:**
  ```json
  {
    "success": false,
    "message": "Category 'Hot Coffee' already exists"
  }
  ```

#### cURL Command:
```bash
curl -X POST http://localhost:3000/api/v1/category/create \
  -H "Content-Type: application/json" \
  -d '{
    "category_name": "Hot Coffee",
    "description": "Espresso, Americano, Latte, Cappuccino",
    "active": 1
  }'
```

---

### 2. Get All Categories

Retrieves all categories with optional search queries and status filtering.

- **Method**: `GET`
- **URL**: `http://localhost:3000/api/v1/category/getall`
- **Headers**:
  ```http
  Accept: application/json
  ```

#### Query Parameters:
| Parameter | Type | Required | Description | Example |
|---|---|---|---|---|
| `search` | `string` | No | Search substring in `category_name` | `?search=Coffee` |
| `active` | `number` / `string` | No | Filter status (`1`, `0`, `true`, `false`) | `?active=1` |

#### Example URLs:
1. **Get all without filter**: `http://localhost:3000/api/v1/category/getall`
2. **Search by keyword**: `http://localhost:3000/api/v1/category/getall?search=Coffee`
3. **Filter active only**: `http://localhost:3000/api/v1/category/getall?active=1`
4. **Combined search & filter**: `http://localhost:3000/api/v1/category/getall?search=Coffee&active=1`

#### Expected Response (`200 OK`):
```json
{
  "success": true,
  "total": 2,
  "list": [
    {
      "category_id": 2,
      "category_name": "Iced Tea",
      "description": "Fresh brewed iced tea & fruit infusions",
      "active": 1,
      "created_date": "2026-09-30T14:00:00.000Z",
      "updated_date": "2026-09-30T14:00:00.000Z"
    },
    {
      "category_id": 1,
      "category_name": "Hot Coffee",
      "description": "Espresso, Americano, Latte, Cappuccino",
      "active": 1,
      "created_date": "2026-09-30T13:58:00.000Z",
      "updated_date": "2026-09-30T13:58:00.000Z"
    }
  ]
}
```

#### cURL Command:
```bash
curl -X GET "http://localhost:3000/api/v1/category/getall?search=Coffee&active=1" \
  -H "Accept: application/json"
```

---

### 3. Update Category

Updates an existing category by its ID. ID can be passed in URL parameters (`:id`) or request body (`category_id`).

- **Method**: `PUT`
- **URL**: `http://localhost:3000/api/v1/category/update/1`
- **Headers**:
  ```http
  Content-Type: application/json
  ```

#### Request Body (JSON):
```json
{
  "category_name": "Hot & Iced Coffee",
  "description": "Premium hot and iced coffee drinks",
  "active": 1
}
```

#### Expected Responses:

- **`200 OK` - Success Response:**
  ```json
  {
    "success": true,
    "message": "Category updated successfully",
    "data": {
      "category_id": 1,
      "category_name": "Hot & Iced Coffee",
      "description": "Premium hot and iced coffee drinks",
      "active": 1,
      "created_date": "2026-09-30T13:58:00.000Z",
      "updated_date": "2026-09-30T14:05:00.000Z"
    }
  }
  ```

- **`400 Bad Request` - Name Conflict:**
  ```json
  {
    "success": false,
    "message": "Category name 'Hot & Iced Coffee' is already in use"
  }
  ```

- **`404 Not Found` - Category Does Not Exist:**
  ```json
  {
    "success": false,
    "message": "Category with ID 999 not found"
  }
  ```

#### cURL Command:
```bash
curl -X PUT http://localhost:3000/api/v1/category/update/1 \
  -H "Content-Type: application/json" \
  -d '{
    "category_name": "Hot & Iced Coffee",
    "description": "Premium hot and iced coffee drinks",
    "active": 1
  }'
```

---

### 4. Delete Category

Deletes a category permanently by ID.

- **Method**: `DELETE`
- **URL**: `http://localhost:3000/api/v1/category/delete/1`
- **Headers**:
  ```http
  Accept: application/json
  ```

#### Expected Responses:

- **`200 OK` - Success Response:**
  ```json
  {
    "success": true,
    "message": "Category with ID 1 deleted successfully"
  }
  ```

- **`404 Not Found` - Category Does Not Exist:**
  ```json
  {
    "success": false,
    "message": "Category with ID 999 not found"
  }
  ```

#### cURL Command:
```bash
curl -X DELETE http://localhost:3000/api/v1/category/delete/1 \
  -H "Accept: application/json"
```

---

## ⚡ Postman / Thunder Client Testing Workflow

1. **Step 1: Create Category** -> Call `POST /api/v1/category/create` with `"category_name": "Beverages"`. Note the returned `category_id`.
2. **Step 2: Verify List** -> Call `GET /api/v1/category/getall?search=Beverages` to verify it appears in the list.
3. **Step 3: Update Category** -> Call `PUT /api/v1/category/update/:id` to rename it to `"Cold Beverages"`.
4. **Step 4: Delete Category** -> Call `DELETE /api/v1/category/delete/:id` to remove the category.
5. **Step 5: Verify Deletion** -> Call `GET /api/v1/category/getall?search=Cold` to confirm it is no longer returned.
