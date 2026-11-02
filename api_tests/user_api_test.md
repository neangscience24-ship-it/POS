# 👤 User API Testing Guide (`user_api_test.md`)

Comprehensive testing instructions, HTTP specifications, cURL commands, and request/response payloads for the **User Management & Authentication** endpoints in the POS System.

---

## 🌐 Environment & Base Configuration

- **Base URL**: `http://localhost:5000`
- **Prefix Path**: `/api/v1/user`
- **Default Headers**:
  ```http
  Content-Type: application/json
  Accept: application/json
  ```

---

## 📋 Endpoints Overview

| # | Action | Method | Endpoint Path | Auth Required | Description |
|---|---|---|---|---|---|
| 1 | Create User | `POST` | `/api/v1/user/create` | No | Register a new POS user account with hashed password |
| 2 | Get All Users | `GET` | `/api/v1/user/getall` | No | List users with search, role, store, & status filters |
| 3 | Get Single User | `GET` | `/api/v1/user/getone/:id` | No | Fetch a single user by User ID |
| 4 | Update User | `PUT` | `/api/v1/user/update/:id` | No | Update user details, role, store, or password |
| 5 | Delete User | `DELETE` | `/api/v1/user/delete/:id` | No | Permanently delete a user account |
| 6 | Login User | `POST` | `/api/v1/user/login` | No | Authenticate user & receive JWT token |

---

## 🧪 Detailed Test Cases & Requests

### 1. Create User

Creates a new user in `tbl_user` with hashed password using bcrypt.

- **Method**: `POST`
- **URL**: `http://localhost:5000/api/v1/user/create`
- **Headers**:
  ```http
  Content-Type: application/json
  ```

#### Request Body Schema:
| Field | Type | Required | Description | Example |
|---|---|---|---|---|
| `username` | `string` | **Yes** | Unique username | `"john_cashier"` |
| `password` | `string` | **Yes** | Plaintext password (will be hashed) | `"Password123@"` |
| `email` | `string` | **Yes** | Unique email address | `"john.cashier@pos.com"` |
| `full_name` | `string` | No | User's full name | `"John Doe"` |
| `role` | `string` | **Yes** | Role (`"admin"`, `"manager"`, `"supervisor"`, `"cashier"`, `"staff"`) | `"cashier"` |
| `store_id` | `number` | No | Associated store ID | `1` |
| `active` | `number` / `boolean` | No | Status (1 = Active, 0 = Inactive, Default: 1) | `1` |

#### Request Body (JSON):
```json
{
  "username": "john_cashier",
  "password": "Password123@",
  "email": "john.cashier@pos.com",
  "full_name": "John Doe",
  "role": "staff",
  "store_id": 1,
  "active": 1
}
```

#### Expected Responses:

- **`201 Created` - Success Response:**
  ```json
  {
    "success": true,
    "message": "User created successfully",
    "data": {
      "user_id": 1,
      "username": "john_cashier",
      "email": "john.cashier@pos.com",
      "full_name": "John Doe",
      "role": "cashier",
      "store_id": 1,
      "active": 1,
      "created_date": "2026-10-06T13:58:00.000Z",
      "updated_date": "2026-10-06T13:58:00.000Z"
    }
  }
  ```

- **`400 Bad Request` - Missing Required Field:**
  ```json
  {
    "success": false,
    "message": "username is required"
  }
  ```

- **`400 Bad Request` - Duplicate Username / Email:**
  ```json
  {
    "success": false,
    "message": "Username 'john_cashier' already exists"
  }
  ```

#### cURL Command:
```bash
curl -X POST http://localhost:5000/api/v1/user/create \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_cashier",
    "password": "Password123@",
    "email": "john.cashier@pos.com",
    "full_name": "John Doe",
    "role": "cashier",
    "store_id": 1,
    "active": 1
  }'
```

---

### 2. Get All Users

Retrieves all users with optional search keywords, role, store ID, and active status filters. Passwords are automatically excluded.

- **Method**: `GET`
- **URL**: `http://localhost:5000/api/v1/user/getall`
- **Headers**:
  ```http
  Accept: application/json
  ```

#### Query Parameters:
| Parameter | Type | Required | Description | Example |
|---|---|---|---|---|
| `search` | `string` | No | Search in `username`, `email`, or `full_name` | `?search=john` |
| `role` | `string` | No | Filter by role (`admin`, `cashier`, `manager`) | `?role=cashier` |
| `store_id` | `number` | No | Filter by store ID | `?store_id=1` |
| `active` | `number` / `string` | No | Filter status (`1`, `0`, `true`, `false`) | `?active=1` |

#### Example URLs:
1. **Get all users**: `http://localhost:5000/api/v1/user/getall`
2. **Search by keyword**: `http://localhost:5000/api/v1/user/getall?search=john`
3. **Filter by role**: `http://localhost:5000/api/v1/user/getall?role=cashier`
4. **Filter active only**: `http://localhost:5000/api/v1/user/getall?active=1`
5. **Combined search & filter**: `http://localhost:5000/api/v1/user/getall?search=john&role=cashier&active=1`

#### Expected Response (`200 OK`):
```json
{
  "success": true,
  "total": 1,
  "list": [
    {
      "user_id": 1,
      "username": "john_cashier",
      "email": "john.cashier@pos.com",
      "full_name": "John Doe",
      "role": "cashier",
      "store_id": 1,
      "active": 1,
      "created_date": "2026-10-06T13:58:00.000Z",
      "updated_date": "2026-10-06T13:58:00.000Z"
    }
  ]
}
```

#### cURL Command:
```bash
curl -X GET "http://localhost:5000/api/v1/user/getall?search=john&role=cashier" \
  -H "Accept: application/json"
```

---

### 3. Get Single User by ID

Retrieves a single user's profile by their user ID.

- **Method**: `GET`
- **URL**: `http://localhost:5000/api/v1/user/getone/1`
- **Headers**:
  ```http
  Accept: application/json
  ```

#### Expected Responses:

- **`200 OK` - Success Response:**
  ```json
  {
    "success": true,
    "data": {
      "user_id": 1,
      "username": "john_cashier",
      "email": "john.cashier@pos.com",
      "full_name": "John Doe",
      "role": "cashier",
      "store_id": 1,
      "active": 1,
      "created_date": "2026-10-06T13:58:00.000Z",
      "updated_date": "2026-10-06T13:58:00.000Z"
    }
  }
  ```

- **`404 Not Found` - User Does Not Exist:**
  ```json
  {
    "success": false,
    "message": "User with ID 999 not found"
  }
  ```

#### cURL Command:
```bash
curl -X GET http://localhost:5000/api/v1/user/getone/1 \
  -H "Accept: application/json"
```

---

### 4. Update User

Updates an existing user. Password is only updated and re-hashed if provided in the body.

- **Method**: `PUT`
- **URL**: `http://localhost:5000/api/v1/user/update/1`
- **Headers**:
  ```http
  Content-Type: application/json
  ```

#### Request Body (JSON):
```json
{
  "username": "john_updated",
  "email": "john.doe@pos.com",
  "full_name": "Johnathan Doe",
  "role": "manager",
  "store_id": 1,
  "active": 1
}
```

*(Optional password update example: pass `"password": "NewSecretPass456@"` inside the body)*

#### Expected Responses:

- **`200 OK` - Success Response:**
  ```json
  {
    "success": true,
    "message": "User updated successfully",
    "data": {
      "user_id": 1,
      "username": "john_updated",
      "email": "john.doe@pos.com",
      "full_name": "Johnathan Doe",
      "role": "manager",
      "store_id": 1,
      "active": 1,
      "created_date": "2026-10-06T13:58:00.000Z",
      "updated_date": "2026-10-06T14:10:00.000Z"
    }
  }
  ```

- **`400 Bad Request` - Username / Email Conflict:**
  ```json
  {
    "success": false,
    "message": "Email 'john.doe@pos.com' is already in use"
  }
  ```

- **`404 Not Found` - User Does Not Exist:**
  ```json
  {
    "success": false,
    "message": "User with ID 999 not found"
  }
  ```

#### cURL Command:
```bash
curl -X PUT http://localhost:5000/api/v1/user/update/1 \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_updated",
    "email": "john.doe@pos.com",
    "full_name": "Johnathan Doe",
    "role": "manager",
    "store_id": 1,
    "active": 1
  }'
```

---

### 5. Delete User

Deletes a user permanently by ID.

- **Method**: `DELETE`
- **URL**: `http://localhost:5000/api/v1/user/delete/1`
- **Headers**:
  ```http
  Accept: application/json
  ```

#### Expected Responses:

- **`200 OK` - Success Response:**
  ```json
  {
    "success": true,
    "message": "User with ID 1 deleted successfully"
  }
  ```

- **`404 Not Found` - User Does Not Exist:**
  ```json
  {
    "success": false,
    "message": "User with ID 999 not found"
  }
  ```

#### cURL Command:
```bash
curl -X DELETE http://localhost:5000/api/v1/user/delete/1 \
  -H "Accept: application/json"
```

---

### 6. Login User

Authenticates user credentials using email address and password, returning a signed JWT token and user profile.

- **Method**: `POST`
- **URL**: `http://localhost:5000/api/v1/user/login`
- **Headers**:
  ```http
  Content-Type: application/json
  ```

#### Request Body Schema:
| Field | Type | Required | Description | Example |
|---|---|---|---|---|
| `email` | `string` | **Yes** | User's registered email | `"pkhouch97@gmail.com"` |
| `password` | `string` | **Yes** | Plaintext user password | `"123"` |

#### Request Body (JSON):
```json
{
  "email": "pkhouch97@gmail.com",
  "password": "123"
}
```

#### Expected Responses:

- **`200 OK` - Success Response:**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "user_id": 1,
      "username": "khouch_phorn",
      "email": "pkhouch97@gmail.com",
      "full_name": "Phorn Khouch",
      "image": "photo_2026-03-03_09-58-18-1791296192625-923590.jpg",
      "role": "admin",
      "store_id": null,
      "active": 1,
      "created_date": "2026-10-06T14:11:24.000Z",
      "updated_date": "2026-10-13T13:52:34.000Z"
    }
  }
  ```

- **`400 Bad Request` - Missing Email:**
  ```json
  {
    "success": false,
    "message": "Email is required"
  }
  ```

- **`400 Bad Request` - Missing Password:**
  ```json
  {
    "success": false,
    "message": "Password is required"
  }
  ```

- **`401 Unauthorized` - Incorrect Password:**
  ```json
  {
    "success": false,
    "message": "Incorrect password"
  }
  ```

- **`404 Not Found` - User Not Found:**
  ```json
  {
    "success": false,
    "message": "User not found"
  }
  ```

- **`403 Forbidden` - User Inactive/Disabled:**
  ```json
  {
    "success": false,
    "message": "User account is disabled"
  }
  ```

#### cURL Command:
```bash
curl -X POST http://localhost:5000/api/v1/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "pkhouch97@gmail.com",
    "password": "123"
  }'
```

---

## ⚡ Testing Workflow (CRUD Test Sequence)

1. **Step 1: Create User** -> Call `POST /api/v1/user/create` with username `test_user`, email `test@pos.com`, and password `Password123@`. Note the generated `user_id`.
2. **Step 2: Login** -> Call `POST /api/v1/user/login` with `test@pos.com` / `Password123@` to verify authentication & token generation.
3. **Step 3: Get All Users** -> Call `GET /api/v1/user/getall?search=test` to verify user is listed without password leak.
4. **Step 4: Get Single User** -> Call `GET /api/v1/user/getone/:id` to verify individual user retrieval.
5. **Step 5: Update User** -> Call `PUT /api/v1/user/update/:id` to modify `full_name` or `role`.
6. **Step 6: Delete User** -> Call `DELETE /api/v1/user/delete/:id` to remove the test user.
7. **Step 7: Confirm Deletion** -> Call `GET /api/v1/user/getone/:id` &rarr; returns `404 Not Found`.
