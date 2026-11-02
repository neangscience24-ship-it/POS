# ☕ Product Master API Testing Guide (`product_master_api_test.md`)

Comprehensive testing instructions, HTTP specifications, cURL commands, and request/response payloads for the **Product Master** feature in the POS System.

---

## 🌐 Environment & Base Configuration

- **Base URL**: `http://localhost:3000`
- **Prefix Path**: `/api/v1/productmaster` (also supports `/api/v1/product-master`)
- **Default Headers**:
  ```http
  Content-Type: application/json
  Accept: application/json
  ```

---

## 📋 Endpoints Overview

| # | Action | Method | Endpoint Path | Auth Required | Description |
|---|---|---|---|---|---|
| 1 | Create Product | `POST` | `/api/v1/productmaster/create` | No | Create a new product with category, brand & attribute |
| 2 | Get All Products | `GET` | `/api/v1/productmaster/getall` | No | List products with relations & advanced filters |
| 3 | Get Product By ID | `GET` | `/api/v1/productmaster/getone/:id` | No | Fetch detailed product by primary key with joined models |
| 4 | Update Product | `PUT` | `/api/v1/productmaster/update/:id` | No | Update product details, prices, or inventory stock |
| 5 | Delete Product | `DELETE` | `/api/v1/productmaster/delete/:id` | No | Delete a product record by ID |

---

## 🧪 Detailed Test Cases & Requests

### 1. Create Product Master

Creates a new product linked with `category_id`, `brand_id`, and optional `attribute_id`.

- **Method**: `POST`
- **URL**: `http://localhost:3000/api/v1/productmaster/create`
- **Headers**:
  ```http
  Content-Type: application/json
  ```

#### Request Body Schema:
| Field | Type | Required | Description | Example |
|---|---|---|---|---|
| `product_name` | `string` | **Yes** | Name of the product | `"Caffe Latte"` |
| `category_id` | `number` | **Yes** | Valid Foreign Key to Category | `1` |
| `brand_id` | `number` | **Yes** | Valid Foreign Key to Brand | `1` |
| `attribute_id` | `number` | No | Optional Foreign Key to Attribute | `1` |
| `sku` | `string` | **Yes** | Unique Stock Keeping Unit | `"LATTE-001"` |
| `barcode` | `string` | No | Unique barcode string | `"8851234567890"` |
| `description` | `string` | No | Product description / notes | `"Rich espresso with steamed milk"` |
| `price` | `number` | **Yes** | Selling price | `3.75` |
| `cost` | `number` | No | Cost price (Default: 0.0) | `1.50` |
| `quantity_stock` | `number` | No | Initial inventory stock (Default: 0) | `50` |
| `active` | `number` / `boolean` | No | Status (1 = Active, 0 = Inactive, Default: 1) | `1` |

#### Request Body (JSON):
```json
{
  "product_name": "Caffe Latte",
  "category_id": 1,
  "brand_id": 1,
  "attribute_id": 1,
  "sku": "LATTE-001",
  "barcode": "8851234567890",
  "description": "Rich espresso with steamed milk",
  "price": 3.75,
  "cost": 1.50,
  "quantity_stock": 50,
  "active": 1
}
```

#### Expected Responses:

- **`201 Created` - Success Response:**
  ```json
  {
    "success": true,
    "message": "Product created successfully",
    "data": {
      "product_id": 1,
      "product_name": "Caffe Latte",
      "category_id": 1,
      "brand_id": 1,
      "attribute_id": 1,
      "sku": "LATTE-001",
      "barcode": "8851234567890",
      "description": "Rich espresso with steamed milk",
      "price": 3.75,
      "cost": 1.5,
      "quantity_stock": 50,
      "active": 1,
      "created_date": "2026-09-30T14:22:00.000Z",
      "updated_date": "2026-09-30T14:22:00.000Z"
    }
  }
  ```

- **`400 Bad Request` - Missing Required Field:**
  ```json
  {
    "success": false,
    "message": "product_name is required"
  }
  ```

- **`400 Bad Request` - Invalid Category ID:**
  ```json
  {
    "success": false,
    "message": "Category with ID 999 does not exist"
  }
  ```

- **`400 Bad Request` - Duplicate SKU:**
  ```json
  {
    "success": false,
    "message": "SKU 'LATTE-001' is already in use"
  }
  ```

#### cURL Command:
```bash
curl -X POST http://localhost:3000/api/v1/productmaster/create \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Caffe Latte",
    "category_id": 1,
    "brand_id": 1,
    "attribute_id": 1,
    "sku": "LATTE-001",
    "barcode": "8851234567890",
    "description": "Rich espresso with steamed milk",
    "price": 3.75,
    "cost": 1.50,
    "quantity_stock": 50,
    "active": 1
  }'
```

---

### 2. Get All Products (with Joined Relations)

Retrieves all products including populated Category, Brand, and Attribute relational models.

- **Method**: `GET`
- **URL**: `http://localhost:3000/api/v1/productmaster/getall`
- **Headers**:
  ```http
  Accept: application/json
  ```

#### Query Parameters:
| Parameter | Type | Required | Description | Example |
|---|---|---|---|---|
| `search` | `string` | No | Search across `product_name`, `sku`, or `barcode` | `?search=Latte` |
| `category_id` | `number` | No | Filter by category | `?category_id=1` |
| `brand_id` | `number` | No | Filter by brand | `?brand_id=1` |
| `attribute_id` | `number` | No | Filter by attribute | `?attribute_id=1` |
| `active` | `number` / `string` | No | Filter by status (`1`, `0`, `true`, `false`) | `?active=1` |

#### Example URLs:
1. **Get all products**: `http://localhost:3000/api/v1/productmaster/getall`
2. **Search by SKU / Name**: `http://localhost:3000/api/v1/productmaster/getall?search=LATTE`
3. **Filter by Category & Brand**: `http://localhost:3000/api/v1/productmaster/getall?category_id=1&brand_id=1`

#### Expected Response (`200 OK`):
```json
{
  "success": true,
  "total": 1,
  "list": [
    {
      "product_id": 1,
      "product_name": "Caffe Latte",
      "category_id": 1,
      "brand_id": 1,
      "attribute_id": 1,
      "sku": "LATTE-001",
      "barcode": "8851234567890",
      "description": "Rich espresso with steamed milk",
      "price": "3.75",
      "cost": "1.50",
      "quantity_stock": 50,
      "active": 1,
      "created_date": "2026-09-30T14:22:00.000Z",
      "updated_date": "2026-09-30T14:22:00.000Z",
      "category": {
        "category_id": 1,
        "category_name": "Hot Coffee"
      },
      "brand": {
        "brand_id": 1,
        "brand_name": "Starbucks"
      },
      "attribute": {
        "attribute_id": 1,
        "attribute_name": "Size",
        "attribute_value": "Grande (16oz)"
      }
    }
  ]
}
```

#### cURL Command:
```bash
curl -X GET "http://localhost:3000/api/v1/productmaster/getall?search=Latte&active=1" \
  -H "Accept: application/json"
```

---

### 3. Get Product Master By ID

Fetches detailed information for a single product record.

- **Method**: `GET`
- **URL**: `http://localhost:3000/api/v1/productmaster/getone/1`
- **Headers**:
  ```http
  Accept: application/json
  ```

#### Expected Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "product_id": 1,
    "product_name": "Caffe Latte",
    "category_id": 1,
    "brand_id": 1,
    "attribute_id": 1,
    "sku": "LATTE-001",
    "barcode": "8851234567890",
    "description": "Rich espresso with steamed milk",
    "price": "3.75",
    "cost": "1.50",
    "quantity_stock": 50,
    "active": 1,
    "category": {
      "category_id": 1,
      "category_name": "Hot Coffee"
    },
    "brand": {
      "brand_id": 1,
      "brand_name": "Starbucks"
    },
    "attribute": {
      "attribute_id": 1,
      "attribute_name": "Size",
      "attribute_value": "Grande (16oz)"
    }
  }
}
```

#### cURL Command:
```bash
curl -X GET http://localhost:3000/api/v1/productmaster/getone/1 \
  -H "Accept: application/json"
```

---

### 4. Update Product Master

Updates an existing product by ID.

- **Method**: `PUT`
- **URL**: `http://localhost:3000/api/v1/productmaster/update/1`
- **Headers**:
  ```http
  Content-Type: application/json
  ```

#### Request Body (JSON):
```json
{
  "product_name": "Caffe Latte (Caramel)",
  "price": 4.25,
  "cost": 1.80,
  "quantity_stock": 45,
  "active": 1
}
```

#### Expected Responses:

- **`200 OK` - Success Response:**
  ```json
  {
    "success": true,
    "message": "Product updated successfully",
    "data": {
      "product_id": 1,
      "product_name": "Caffe Latte (Caramel)",
      "price": 4.25,
      "cost": 1.8,
      "quantity_stock": 45,
      "active": 1
    }
  }
  ```

- **`404 Not Found` - Product Does Not Exist:**
  ```json
  {
    "success": false,
    "message": "Product with ID 999 not found"
  }
  ```

#### cURL Command:
```bash
curl -X PUT http://localhost:3000/api/v1/productmaster/update/1 \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Caffe Latte (Caramel)",
    "price": 4.25,
    "cost": 1.80,
    "quantity_stock": 45,
    "active": 1
  }'
```

---

### 5. Delete Product Master

Deletes a product permanently by ID.

- **Method**: `DELETE`
- **URL**: `http://localhost:3000/api/v1/productmaster/delete/1`
- **Headers**:
  ```http
  Accept: application/json
  ```

#### Expected Responses:

- **`200 OK` - Success Response:**
  ```json
  {
    "success": true,
    "message": "Product with ID 1 deleted successfully"
  }
  ```

- **`404 Not Found` - Product Does Not Exist:**
  ```json
  {
    "success": false,
    "message": "Product with ID 999 not found"
  }
  ```

#### cURL Command:
```bash
curl -X DELETE http://localhost:3000/api/v1/productmaster/delete/1 \
  -H "Accept: application/json"
```

---

## ⚡ Postman / Thunder Client Testing Workflow

1. **Prerequisite**: Ensure a Category (`id=1`) and Brand (`id=1`) exist first.
2. **Step 1: Create Product** -> Call `POST /api/v1/productmaster/create` with valid foreign keys. Note `product_id`.
3. **Step 2: Get All Products** -> Call `GET /api/v1/productmaster/getall` and verify `category`, `brand`, and `attribute` joins.
4. **Step 3: Get By ID** -> Call `GET /api/v1/productmaster/getone/:id` to inspect single object details.
5. **Step 4: Update Product** -> Call `PUT /api/v1/productmaster/update/:id` with new price or inventory quantity.
6. **Step 5: Delete Product** -> Call `DELETE /api/v1/productmaster/delete/:id`.
