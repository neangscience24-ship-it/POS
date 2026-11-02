# 🧪 POS API Test Suite Directory

Welcome to the modular API testing directory. All API endpoints and test requests are organized by feature modules for easy reference, testing, and Postman / Thunder Client execution.

---

## 📁 Feature API Test Files

| Feature Module | Test Guide File | Primary Endpoints | Description |
|---|---|---|---|
| 📦 **Category** | [category_api_test.md](file:///d:/TRANING/Web%20Frontend%2019/FullStack/POS/node-api/api_tests/category_api_test.md) | `/api/v1/category/*` | Create, filter search, update, and delete product categories |
| 🏷️ **Brand** | [brand_api_test.md](file:///d:/TRANING/Web%20Frontend%2019/FullStack/POS/node-api/api_tests/brand_api_test.md) | `/api/v1/brand/*` | Create, search, update, and delete product brands |
| 🎨 **Attribute** | [attribute_api_test.md](file:///d:/TRANING/Web%20Frontend%2019/FullStack/POS/node-api/api_tests/attribute_api_test.md) | `/api/v1/attribute/*` | Size, sugar, ice variations and product attributes |
| ☕ **Product Master** | [product_master_api_test.md](file:///d:/TRANING/Web%20Frontend%2019/FullStack/POS/node-api/api_tests/product_master_api_test.md) | `/api/v1/productmaster/*` | Products with joins (category, brand, attribute), SKU & stock |
| 👤 **User & Auth** | [user_api_test.md](file:///d:/TRANING/Web%20Frontend%2019/FullStack/POS/node-api/api_tests/user_api_test.md) | `/api/v1/user/*` | Register, login (JWT), protected users list, OTP email flow |

---

## 🌐 Common Configuration

- **Server Base URL**: `http://localhost:5000`
- **Default Headers**:
  ```http
  Content-Type: application/json
  Accept: application/json
  ```
- **Authentication**:
  ```http
  Authorization: Bearer <YOUR_JWT_TOKEN>
  ```

---

## 🚀 Recommended Testing Sequence

When testing the POS system from scratch or with a fresh database:

1. **Step 1: User & Auth** ([user_api_test.md](file:///d:/TRANING/Web%20Frontend%2019/FullStack/pos-system-gen7/node-api/api_tests/user_api_test.md) / [user_api_test.http](file:///d:/TRANING/Web%20Frontend%2019/FullStack/pos-system-gen7/node-api/api_tests/user_api_test.http))
   - Create user, test CRUD, & login to get JWT token.
2. **Step 2: Category** ([category_api_test.md](file:///d:/TRANING/Web%20Frontend%2019/FullStack/pos-system-gen7/node-api/api_tests/category_api_test.md))
   - Create categories (e.g. `Hot Coffee`, `Iced Tea`). Note `category_id`.
3. **Step 3: Brand** ([brand_api_test.md](file:///d:/TRANING/Web%20Frontend%2019/FullStack/pos-system-gen7/node-api/api_tests/brand_api_test.md))
   - Create brands (e.g. `Starbucks`, `Amazon Cafe`). Note `brand_id`.
4. **Step 4: Attribute** ([attribute_api_test.md](file:///d:/TRANING/Web%20Frontend%2019/FullStack/pos-system-gen7/node-api/api_tests/attribute_api_test.md))
   - Create attributes (e.g. `Size: Grande`, `Sugar: 50%`). Note `attribute_id`.
5. **Step 5: Product Master** ([product_master_api_test.md](file:///d:/TRANING/Web%20Frontend%2019/FullStack/pos-system-gen7/node-api/api_tests/product_master_api_test.md))
   - Create products referencing `category_id`, `brand_id`, and `attribute_id`.
   - Verify joined models with `GET /api/v1/productmaster/getall`.
