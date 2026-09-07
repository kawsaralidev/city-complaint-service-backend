City Complaint & Service Platform — Backend

A secure, modular REST API for managing city complaints and public service requests. The platform supports role-based workflows for Citizens, Officers, and Administrators, including complaint handling, service requests, officer assignment, Stripe payments, and administrative management.

✨ Key Features

🔐 Email/password authentication with email OTP verification

🔑 JWT access & refresh token authentication

🌐 Google OAuth authentication

👥 Role-based authorization: CITIZEN, OFFICER, ADMIN

🚨 Complaint creation, management, assignment, tracking, and resolution

🏢 Public service and category management

📋 Service request approval, assignment, tracking, and completion

💳 Real Stripe payment integration with webhook handling

👤 Admin user management and account status control

📊 Admin dashboard overview

📝 Audit logging for important business activities

🖼️ Cloudinary image upload support

✅ Server-side validation with Zod

🛡️ Helmet, CORS, rate limiting, and protected routes

🗄️ PostgreSQL with Prisma ORM

⚡ Redis for OTP and temporary authentication data

🔄 Transactions for critical multi-step operations

🗑️ Soft delete support for selected resources

🔎 Search, filtering, sorting, and pagination

👥 User Roles

Role

Responsibilities

CITIZEN

Submit complaints, request services, track requests, and make payments

OFFICER

View assigned work, update progress, and resolve/complete tasks

ADMIN

Manage platform resources, review requests, assign officers, manage users, payments, and dashboard data

🔄 Core Workflows

Complaint Workflow

Citizen creates complaint
↓
Admin reviews & assigns officer
↓
Officer starts work
↓
In Progress
↓
Resolution
↓
Resolved
↓
Admin closes complaint

Service Request Workflow

Citizen submits service request
↓
Admin reviews request
↓
Approved
↓
Citizen makes Stripe payment
↓
Payment confirmed
↓
Admin assigns officer
↓
Officer processes request
↓
Completed

🛠️ Tech Stack

Backend

Node.js

TypeScript

Express.js

Database

PostgreSQL

Prisma ORM

Authentication & Security

JWT

Passport.js

Google OAuth

bcryptjs

Helmet

CORS

express-rate-limit

Services & Integrations

Redis

Stripe

Cloudinary

Nodemailer

Multer

Development Tools

Biome

Postman

⚙️ Environment Variables

Configure the following services in .env:

NODE_ENV=development
PORT=5000

DATABASE_URL=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

APP_URL=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=

REDIS_URL=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_SUCCESS_URL=
STRIPE_CANCEL_URL=

Use the exact variable names required by the project's configuration files. Never commit real credentials or secrets to Git.

Protected endpoints use Bearer authentication:

Authorization: Bearer <access_token>

💳 Stripe Payment

The project uses Stripe Checkout for real payment processing.

Service Request
↓
Admin Approval
↓
Create Stripe Payment
↓
Stripe Checkout
↓
Stripe Webhook
↓
Payment Confirmed
↓
Service Request Confirmed

Webhook signature verification and transactional database updates are used to keep payment state consistent.

🛡️ Security

The backend includes:

JWT authentication

Role-based access control

Password hashing

HttpOnly refresh-token cookies

Server-side Zod validation

Helmet security headers

CORS configuration

Rate limiting

Protected private routes

Stripe webhook verification

Secure environment-based secrets

👨‍💻 Author

Md. Kawsar Ali

Full-Stack Developer

GitHub: github.com/kawsaralidev

LinkedIn: linkedin.com/in/kawsaralidev
