# 🚀 POS Backend API — Architecture & System Flow Documentation

Welcome to the **POS (Point of Sale) Backend API** documentation. This service is built using **Node.js**, **Express.js**, and **Sequelize ORM** with **MySQL**, providing high performance, data integrity, and scalable modular architecture.

---

## 📑 Table of Contents

1. [📐 High-Level System Architecture](#-high-level-system-architecture)
2. [🔄 End-to-End Request & Response Flow](#-end-to-end-request--response-flow)
3. [⚙️ Core Process Flows & Workflows](#️-core-process-flows--workflows)
   - [🔐 1. Authentication & JWT Authorization Flow](#1-authentication--jwt-authorization-flow)
   - [🔑 2. Password Reset & OTP Verification Flow](#2-password-reset--otp-verification-flow)
   - [📦 3. Catalog & Product Master Relational Data Flow](#3-catalog--product-master-relational-data-flow)
   - [🌐 4. Google OAuth 2.0 Single Sign-On Flow](#4-google-oauth-20-single-sign-on-flow)
   - [📢 5. Error Handling & Notification Flow (Telegram & Logs)](#5-error-handling--notification-flow-telegram--logs)
4. [📂 Project Structure & Module Responsibilities](#-project-structure--module-responsibilities)
5. [🗄️ Database Relationships (ERD)](#️-database-relationships-erd)
6. [🛠️ Installation & Getting Started](#️-installation--getting-started)
7. [🧪 API Testing Directory & Quick Links](#-api-testing-directory--quick-links)

---

## 📐 High-Level System Architecture

The backend follows a **Layered MVC / Clean Architecture** pattern ensuring separation of concerns:

```mermaid
graph TD
    Client["📱 Client App (React / Postman / Mobile)"]
    
    subgraph Express_Server["🚀 Express.js Web Server (Port 3000)"]
        direction TB
        Middlewares["⚙️ Global Middleware (CORS, Express JSON, URL-Encoded)"]
        RouterLayer["🚦 Routing Layer (/api/v1/*)"]
        AuthMiddleware["🛡️ Auth & Token Middleware (JWT Validator)"]
        Controllers["🧠 Controllers (Business Logic & Validation)"]
        Services["🔧 Services & Helpers (Mail, Telegram, OAuth, Logger)"]
        SequelizeModels["🗂️ Sequelize Models & Associations"]
    end
    
    subgraph External_Services["☁️ External Services & Database"]
        MySQL[("🗄️ MySQL Database")]
        Gmail["📧 Gmail SMTP (Nodemailer)"]
        Telegram["🤖 Telegram Bot API"]
        GoogleAuth["🔑 Google OAuth 2.0"]
        Stripe["💳 Stripe Payment Gateway"]
        Bakong["🇰🇭 Bakong KHQR Open API"]
    end

    Client -->|HTTP / HTTPS Requests| Middlewares
    Middlewares --> RouterLayer
    RouterLayer --> AuthMiddleware
    AuthMiddleware --> Controllers
    Controllers --> Services
    Controllers --> SequelizeModels
    SequelizeModels -->|ORM Queries / Migrations| MySQL
    Services --> Gmail
    Services --> Telegram
    Services --> GoogleAuth
    Services --> Stripe
    Services --> Bakong
    Controllers -->|JSON Response (200 / 201 / 400 / 500)| Client
```

---

## 🔄 End-to-End Request & Response Flow

Every incoming HTTP request traverses standardized pipeline stages:

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 Client (React / Postman)
    participant Server as 🌐 Express Server (index.js)
    participant Route as 🚦 Route Handler
    participant Middleware as 🛡️ Auth / Validate Middleware
    participant Controller as 🧠 Controller
    participant ORM as 🗂️ Sequelize ORM Model
    participant DB as 🗄️ MySQL Database
    participant Notifier as 📢 Telegram / Mail Helper

    User->>Server: HTTP Request (Method + URL + Headers + Body)
    Server->>Server: Parse JSON & Apply CORS
    Server->>Route: Match Endpoint (e.g. /api/v1/productmaster/*)
    
    opt Protected Endpoint
        Route->>Middleware: Verify Authorization Bearer Header
        Middleware-->>User: 401 Unauthorized (If Token Invalid/Expired)
    end
    
    Route->>Controller: Invoke Controller Action
    Controller->>Controller: Validate Input Fields (IsEmpty helper)
    
    alt Validation Failed
        Controller-->>User: 400 Bad Request JSON
    else Validation Succeeded
        Controller->>ORM: Query / Create / Update / Delete
        ORM->>DB: Execute SQL Query with Foreign Keys
        DB-->>ORM: SQL Result Rows
        ORM-->>Controller: Model Instances / Relations
        
        opt On Failure or Critical Event
            Controller->>Notifier: Log to File & Send Alert to Telegram
        end
        
        Controller-->>User: Formatted JSON Response (200 / 201)
    end
```

---

## ⚙️ Core Process Flows & Workflows

### 1. Authentication & JWT Authorization Flow

Handles user registration, credential hashing with bcrypt, JWT token signing, and protecting private routes.

```mermaid
flowchart TD
    StartRegister([User Registration]) --> ValidateReg[Validate email, userid, password]
    ValidateReg --> CheckExist{User or Email Exists?}
    CheckExist -- Yes --> ReturnErr[Return 400 Error: User Already Exists]
    CheckExist -- No --> HashPW[Hash password with bcrypt saltRounds: 10]
    HashPW --> SaveDB[(Insert into tbl_user)]
    SaveDB --> RegSuccess[Return 200: Data inserted successfully]

    StartLogin([User Login]) --> ValidateLogin[Validate email & password input]
    ValidateLogin --> FindUser[(Find user by email in tbl_user)]
    FindUser --> UserFound{User exists?}
    UserFound -- No --> Return404[Return 404: Email not found]
    UserFound -- Yes --> ComparePW{bcrypt.compareSync}
    ComparePW -- No Match --> Return401[Return 401: Incorrect password]
    ComparePW -- Match --> SignJWT[jwt.sign payload with SECRET_KEY expiresIn: 1h]
    SignJWT --> ReturnToken[Return 200: Token & login successfully]

    StartProtected([Access Protected API]) --> ReadHeader[Read Authorization: Bearer token]
    ReadHeader --> VerifyJWT{jwt.verify token}
    VerifyJWT -- Invalid/Expired --> Return403[Return 401/403: Unauthorized]
    VerifyJWT -- Valid --> AllowNext[Proceed to Next Handler / Controller]
```

---

### 2. Password Reset & OTP Verification Flow

A secure 3-step self-service password recovery flow via email OTP codes.

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 User
    participant Controller as 🧠 User Controller
    participant Mailer as 📧 Nodemailer (Gmail SMTP)
    participant Memory as 💾 Temporary OTP Store (10 min TTL)
    participant DB as 🗄️ MySQL Database

    Note over User,DB: Step 1: Send OTP
    User->>Controller: POST /api/v1/user/send-otp { email }
    Controller->>DB: Verify email exists in tbl_user
    alt Email Not Found
        Controller-->>User: { success: false, message: "Email not found" }
    else Email Exists
        Controller->>Controller: Generate random 6-digit OTP
        Controller->>Memory: Save otpStore[email] = { otp, expiresAt: now + 10min }
        Controller->>Mailer: Send HTML email with OTP
        Mailer-->>User: Email Delivered with 6-digit Code
        Controller-->>User: { success: true, message: "OTP sent to email" }
    end

    Note over User,DB: Step 2: Verify OTP
    User->>Controller: POST /api/v1/user/verify-otp { email, otp }
    Controller->>Memory: Lookup otpStore[email]
    alt OTP Missing / Expired
        Controller-->>User: { success: false, message: "OTP not found or expired" }
    else OTP Mismatch
        Controller-->>User: { success: false, message: "Invalid OTP" }
    else OTP Match
        Controller-->>User: { success: true, message: "OTP verified successfully" }
    end

    Note over User,DB: Step 3: Set New Password
    User->>Controller: POST /api/v1/user/set-new-password { email, otp, newPassword }
    Controller->>Memory: Confirm OTP validity
    Controller->>Controller: Hash newPassword with bcrypt
    Controller->>DB: UPDATE tbl_user SET password = hashedPassword WHERE email = email
    Controller->>Memory: Delete otpStore[email] (Invalidate OTP)
    Controller-->>User: { success: true, message: "Password reset successfully" }
```

---

### 3. Catalog & Product Master Relational Data Flow

The POS product catalog uses foreign key relations across **Category**, **Brand**, and **Attribute**:

```mermaid
flowchart TD
    ClientReq([Client Request: Create / Get Products]) --> Controller[productMaster.controller.js]
    
    subgraph Validation_&_Integrity["Foreign Key Validation"]
        CheckCat{Category exists by PK?}
        CheckBrand{Brand exists by PK?}
        CheckAttr{Attribute exists by PK?}
        CheckSKU{SKU Unique Check?}
    end

    Controller --> CheckCat
    CheckCat -- Yes --> CheckBrand
    CheckBrand -- Yes --> CheckAttr
    CheckAttr -- Yes --> CheckSKU
    
    CheckCat -- No --> RetErr1[Return 400: Category does not exist]
    CheckBrand -- No --> RetErr2[Return 400: Brand does not exist]
    CheckSKU -- Duplicate --> RetErr3[Return 400: SKU already in use]

    CheckSKU -- OK --> ORMQuery[Execute Sequelize findAll / create with Relations]
    
    subgraph Joined_Data_Models["Joined Models via ORM"]
        PM[(ProductMaster)]
        CAT[(Category tbl_category)]
        BR[(Brand tbl_brand)]
        ATT[(Attribute tbl_attribute)]
        PM ---|belongsTo| CAT
        PM ---|belongsTo| BR
        PM ---|belongsTo| ATT
    end

    ORMQuery --> Joined_Data_Models
    Joined_Data_Models --> JSONResp[Return Consolidated Response with Nested Objects]
```

---

### 4. Google OAuth 2.0 Single Sign-On Flow

Allows users to log in seamlessly with Google credentials.

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 User Browser
    participant API as 🚀 Node API
    participant Google as 🔑 Google OAuth Server
    participant DB as 🗄️ MySQL User Store

    User->>API: GET /api/v1/auth/google
    API-->>User: 302 Redirect to Google Login Consent Screen
    User->>Google: Authenticate & Authorize POS App
    Google-->>API: 302 Redirect to /api/v1/auth/google/callback?code=AUTH_CODE
    API->>Google: Exchange code for Access Token & Profile (email, name, picture)
    Google-->>API: Return User Profile
    API->>DB: Find or Auto-Register User by Google Email
    API->>API: Generate POS JWT Session Token
    API-->>User: 302 Redirect to /auth/success?token=JWT_TOKEN
```

---

### 5. Error Handling & Notification Flow (Telegram & Logs)

Ensures zero silent failures by streaming operational exceptions to developers via Telegram.

```mermaid
flowchart LR
    Exception[💥 Runtime Exception / Error] --> LogHandler[helper/log_error.js]
    LogHandler --> WriteFile[📝 Append to /logs/error.log]
    LogHandler --> TelegramBot[🤖 Telegram Bot Service]
    TelegramBot --> SendGroup[📢 Send Alert to Dev Telegram Group / Chat]
    LogHandler --> FormattedResponse[🛡️ Send 500 JSON to Client: Internal Server Error]
```

---

## 📂 Project Structure & Module Responsibilities

```plaintext
node-api/
├── index.js                      # Application entry point, Express server & DB sync
├── package.json                  # Dependencies, scripts, and project metadata
├── note.md                       # Scratch notes & classroom guidelines
├── logs/                         # File logging directory
│   └── error.log                 # Recorded application errors
│
├── api_tests/                    # 🧪 Feature-based API testing guides & cURL scripts
│   ├── README.md                 # Test suite index & quick cheat-sheet
│   ├── category_api_test.md      # Category endpoints & test cases
│   ├── brand_api_test.md         # Brand endpoints & test cases
│   ├── attribute_api_test.md     # Attribute endpoints & test cases
│   ├── product_master_api_test.md# Product Master endpoints with joins
│   └── user_api_test.md          # User, Auth, and OTP test cases
│
└── src/
    ├── config/                   # Configuration files
    │   ├── config.js             # MySQL raw connection pool
    │   └── sequelizeConfig.js    # Sequelize instance & MySQL credentials
    │
    ├── controller/               # Request handlers & Business logic
    │   ├── auth.controller.js    # Google OAuth controllers
    │   ├── category.controller.js# Category CRUD operations
    │   ├── brand.controller.js   # Brand CRUD operations
    │   ├── attribute.controller.js # Attribute CRUD operations
    │   ├── productMaster.controller.js # Product Master CRUD & joins
    │   └── user.controller.js    # User registration, login, and OTP recovery
    │
    ├── helper/                   # Reusable utilities
    │   ├── log_error.js          # File logger helper
    │   ├── mail_config.js        # Nodemailer SMTP transporter
    │   ├── telegramConfig.js     # Telegram Bot integration
    │   └── validate.js           # IsEmpty validator function
    │
    ├── middleware/               # Express middlewares
    │   └── auth.js               # JWT bearer token verification
    │
    ├── models/                   # Sequelize ORM schema definitions & relationships
    │   ├── category.model.js     # tbl_category definition
    │   ├── brand.model.js        # tbl_brand definition
    │   ├── attribute.model.js    # tbl_attribute definition
    │   ├── productMaster.model.js# tbl_product_master definition
    │   └── index.js              # Model associations & central export
    │
    ├── route/                    # Express route registries
    │   ├── category.route.js     # Category routing (/api/v1/category/*)
    │   ├── brand.route.js        # Brand routing (/api/v1/brand/*)
    │   ├── attribute.route.js    # Attribute routing (/api/v1/attribute/*)
    │   ├── productMaster.route.js# Product Master routing (/api/v1/productmaster/*)
    │   └── user.route.js         # User & Auth routing (/api/v1/user/*)
    │
    └── services/                 # External service handlers
        ├── googleAuth.service.js # Google OAuth token & userinfo fetcher
        └── jwt.service.js        # JWT signer & token decoder
```

---

## 🗄️ Database Relationships (ERD)

```mermaid
erDiagram
    tbl_category ||--o{ tbl_product_master : "has many products"
    tbl_brand ||--o{ tbl_product_master : "has many products"
    tbl_attribute ||--o{ tbl_product_master : "has many products"

    tbl_category {
        int category_id PK "Auto Increment"
        string category_name "Unique, Required"
        string description
        int active "Default: 1"
        datetime created_date
        datetime updated_date
    }

    tbl_brand {
        int brand_id PK "Auto Increment"
        string brand_name "Unique, Required"
        string description
        int active "Default: 1"
        datetime created_date
        datetime updated_date
    }

    tbl_attribute {
        int attribute_id PK "Auto Increment"
        string attribute_name "Required (e.g. Size, Ice)"
        string attribute_value "Required (e.g. Grande, 50%)"
        int active "Default: 1"
        datetime created_date
    }

    tbl_product_master {
        int product_id PK "Auto Increment"
        string product_name "Required"
        int category_id FK "References tbl_category"
        int brand_id FK "References tbl_brand"
        int attribute_id FK "References tbl_attribute"
        string sku "Unique, Required"
        string barcode "Unique"
        decimal price "Required"
        decimal cost "Default: 0.0"
        int quantity_stock "Default: 0"
        string image
        string description
        int active "Default: 1"
        datetime created_date
        datetime updated_date
    }

    tbl_user {
        string user_id PK
        string email "Unique, Required"
        string password "Hashed bcrypt"
        string status "active / inactive"
    }
```

---

## 🛠️ Installation & Getting Started

### 1. Prerequisites
- **Node.js**: `v18.x` or higher
- **MySQL Server**: `v8.x` or MariaDB running locally or via Docker

### 2. Configure Environment (`.env`)
Create a `.env` file in the root of `node-api/`:

```ini
# Server Configuration
PORT=3000

# MySQL Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=pos_db
DB_PORT=3306

# JWT Secret Key
SECRET_KEY=your_jwt_super_secret_key_168

# Email SMTP (Gmail App Password)
EMAIL=your_email@gmail.com
APP_PASSWORD=your_gmail_app_password

# Telegram Notification Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_chat_or_group_id

# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/v1/auth/google/callback
```

### 3. Install Dependencies & Start Server
```bash
# Install node packages
npm install

# Start development server with Nodemon
npm run dev

# Or start directly with Node
node index.js
```

> 💡 **Auto-Sync Schema**: On startup, Sequelize will automatically sync and create tables via `sequelize.sync()`.

---

## 🧪 API Testing Directory & Quick Links

All API endpoint requests, cURL scripts, request bodies, and expected status codes are documented by module in the [api_tests/](file:///d:/TRANING/Web%20Frontend%2019/FullStack/POS/node-api/api_tests/README.md) directory:

| Feature Guide | File Link | Description |
|---|---|---|
| 📦 **Category** | [category_api_test.md](file:///d:/TRANING/Web%20Frontend%2019/FullStack/POS/node-api/api_tests/category_api_test.md) | CRUD, search filters, and active status |
| 🏷️ **Brand** | [brand_api_test.md](file:///d:/TRANING/Web%20Frontend%2019/FullStack/POS/node-api/api_tests/brand_api_test.md) | Brand creation, uniqueness check, search & list |
| 🎨 **Attribute** | [attribute_api_test.md](file:///d:/TRANING/Web%20Frontend%2019/FullStack/POS/node-api/api_tests/attribute_api_test.md) | Product attributes, cup sizes, sweetness levels |
| ☕ **Product Master** | [product_master_api_test.md](file:///d:/TRANING/Web%20Frontend%2019/FullStack/POS/node-api/api_tests/product_master_api_test.md) | Product inventory, pricing, SKU, and relational joins |
| 👤 **User & Auth** | [user_api_test.md](file:///d:/TRANING/Web%20Frontend%2019/FullStack/POS/node-api/api_tests/user_api_test.md) | User register, JWT login, and 3-step OTP recovery |
| 📑 **Test Suite Hub** | [README.md](file:///d:/TRANING/Web%20Frontend%2019/FullStack/POS/node-api/api_tests/README.md) | Complete testing workflow sequence and global configurations |
