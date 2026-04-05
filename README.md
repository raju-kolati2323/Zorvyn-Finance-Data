# Zorvyn Finance Backend API

Node.js + Express + MongoDB backend for role-based personal finance record management.


### Login Credentials
-- Admin credentials are provided by default. For Viewer and Analyst roles, you can either use the provided credentials or create new ones from the Admin panel.
#### Admin: (Default)
	Email: 		admin@gmail.com
	Password:   admin123
#### Viewer:
	Email:		visitor1@gmail.com
	Password:	visitor1123
#### Analyst:
	Email: 		analyst1@gmail.com
	Password: 	analyst1123


## 1. Project Overview

This backend provides:

- JWT-based authentication and authorization
- Role-based access control for Admin, Analyst, and Viewer
- User management (Admin)
- Record management (Admin create/update/delete, role-based read access)
- Filtering and dashboard summary analytics
- Forgot password flow with OTP email verification
- User account activation/deactivation with access restrictions

## 2. Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT (jsonwebtoken)
- bcryptjs (password hashing)
- Nodemailer (OTP email)

## 3. Folder Structure

server/
- app.js
- package.json
- controllers/ (services)
	- auth.controller.js
	- admin.controller.js
	- common.controller.js
- middleware/
	- auth.middleware.js
- models/
	- Users.js
	- Records.js
	- ForgotPassword.js
- routes/
	- auth.route.js
	- admin.route.js
	- common.route.js
- utils/
	- sendEmail.js
	- otpTemplate.js
	- tokenRevocation.js

## 4. Roles and Access

- Admin
	- Can register users
	- Can list users / get user by id / update user details
	- Can create, update, delete records
	- Can read records and filtered records
	- Can get dashboard summary (overall + per viewer)

- Analyst
	- Can read records and filtered records
	- Can view dashboard summary (overall + per viewer)

- Viewer
	- Can access own profile
	- Can read only own records
	- Can filter only own records
	- Can view own dashboard summary

## 5. Important Functional Notes

1. JWT Security
- Login generates JWT token with 2 hour expiry.
- Protected routes use authentication middleware.
- Logout uses in-memory token revocation list for current runtime.

2. Route Simplification
- Initially, separate Analyst/Viewer routes were planned.
- Common functionality was moved to a single common route set to reduce redundancy.
- Admin routes are still separate due to additional admin-only operations.

3. Account Status Handling
- User model includes isActive.
- If isActive is false, login is blocked and dashboard-related/common data access returns account deactivated response.

4. Record Visibility
- For Analyst/Admin record read endpoints, user details are populated in record responses.
- Viewer gets only their own records.

5. Forgot Password
- OTP is generated and sent through email.
- OTP is stored in ForgotPassword collection with expiry of 5 minutes.
- Reset password verifies email + OTP and updates hashed password.

## 6. Environment Variables

Create a .env file with:

PORT=5000
MONGODB_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret>
EMAIL_USER=<your_gmail_address>
EMAIL_PASS=<your_gmail_app_password>

## 7. Setup and Run

1. Install dependencies
- npm install

2. Configure environment
- Create .env using the values

3. Start server
- npm run dev

Or run without nodemon:
- npm start

Default server runs on port 5000 unless overridden by PORT.

## 8. Authentication Header Format

For protected endpoints, send:

Authorization: Bearer <jwt_token>

## 9. API Endpoints

Base URL examples:
- http://localhost:5000/auth
- http://localhost:5000/admin
- http://localhost:5000

#### Deployed URL: https://zorvyn-financedata-server.onrender.com

### 9.1 Auth Routes

POST /auth/login
- Body: email, password
- Response: role + JWT token

POST /auth/forgot-password
- Body: email
- Sends OTP to user email

POST /auth/reset-password
- Body: email, otp, newPassword
- Resets password after OTP verification

POST /auth/logout
- Invalidates the provided token in runtime memory and user gets logged-out

### 9.2 Admin Routes (Protected)

POST /admin/register
- Register Viewer/Analyst/Admin user

GET /admin/users
- Get all users grouped by viewers and analysts

GET /admin/user/:id
- Get user details by id

PATCH /admin/update-user/:id
- Update name/email/mobileNumber/isActive

POST /admin/create-record
- Create record for user by email(for uniqueness)

GET /admin/records/:id?
- If id provided: records for that user
- If no id: all records

GET /admin/record/:id
- Get single record by record id

GET /admin/filter-records?date=&category=&type=
- Filter records

PATCH /admin/update-record/:id
- Update record fields

DELETE /admin/delete-record/:id
- Delete record

### 9.3 Common Routes (Protected)

GET /profile
- Logged-in user profile

GET /records/:id?
- Viewer: own records only
- Analyst/Admin: all records or user-specific by id

GET /record/:id
- Viewer: only own record by id
- Analyst/Admin: any record by id

GET /filter-records?date=&category=&type=
- Viewer: filter own records
- Analyst/Admin: filter all records

GET /dashboard-summary?startDate=&endDate=
- Viewer: own summary only
- Analyst/Admin: overall summary + each viewer summary
- Summary includes:
	- totalIncome
	- totalExpenses
	- netBalance
	- categoryWiseTotals
	- monthlyTrends

## 10. Dashboard Summary Logic

Viewer response:
- userRole
- summary
- recordCount

Analyst/Admin response:
- userRole
- overallSummary
- viewerSummaries
- totalRecords
- totalViewers

Date range filters:
- startDate (inclusive)
- endDate (inclusive)

Note: Login requires valid email + password; ensures users exist in database.

## 11. Validation Rules Implemented

- Email format validation
- Mobile number must be 10 digits
- Password minimum length: 8
- Role validation against allowed roles
- Amount type validation: Income or Expense
- Category validation against allowed category list
- Date of transaction cannot be future date

## 12. Security and Limitations

Implemented:
- Password hashing with bcrypt
- JWT auth with expiration
- Protected APIs using middleware
- Token revocation on logout (runtime memory)

Current limitation:
- Revoked tokens are stored in memory, so revocation resets when server restarts.

## 13. Submission Summary

This backend is a complete role-based finance management API with:

- authentication and session handling
- user and record management
- OTP-based password reset
- dashboard analytics by roles
