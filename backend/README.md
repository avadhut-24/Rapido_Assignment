# 🚗 Corporate Ride Scheduling System

A comprehensive backend API for managing corporate ride scheduling with user management, ride booking, and admin controls.

## 🏗️ Architecture

- **Framework**: Node.js with Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based token authentication
- **Validation**: Express-validator for request validation
- **Security**: Helmet, CORS, Rate limiting

## 📋 Features

### Core Features
- ✅ **User Management**: Registration, login, profile management
- ✅ **Ride Booking**: Create, view, update, and cancel ride requests
- ✅ **Admin Controls**: Approve/reject rides, view analytics, manage users
- ✅ **Authentication**: JWT-based secure authentication
- ✅ **Authorization**: Role-based access control (User/Admin)

### Database Models
- **User**: User accounts with roles (USER/ADMIN)
- **Ride**: Ride requests with status tracking
- **AdminAction**: Audit trail for admin actions

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone and navigate to the project**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your database credentials:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/rapido_corporate_rides"
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   PORT=3000
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Seed the database with sample data
   npm run db:seed
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:3000`

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 🔐 Authentication Endpoints

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@company.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "+1234567890",
  "company": "Tech Corp"
}
```

### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@company.com",
  "password": "password123"
}
```

### Get Current User Profile
```http
GET /auth/me
Authorization: Bearer <token>
```

---

## 👤 User Management Endpoints

### Get User Profile
```http
GET /users/profile
Authorization: Bearer <token>
```

### Update User Profile
```http
PUT /users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Updated",
  "phone": "+1234567891",
  "company": "Updated Corp"
}
```

### Change Password
```http
PUT /users/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

### Get All Users (Admin Only)
```http
GET /users?page=1&limit=10&search=john
Authorization: Bearer <admin-token>
```

---

## 🚗 Ride Booking Endpoints

### Create Ride Request
```http
POST /rides
Authorization: Bearer <token>
Content-Type: application/json

{
  "pickupLocation": "123 Main Street, Downtown",
  "dropLocation": "456 Business Park, Tech District",
  "scheduledTime": "2024-01-15T10:00:00Z",
  "purpose": "Client Meeting",
  "notes": "Important presentation"
}
```

### Get User's Rides
```http
GET /rides/my-rides?status=PENDING&page=1&limit=10
Authorization: Bearer <token>
```

### Get Ride Details
```http
GET /rides/:id
Authorization: Bearer <token>
```

### Update Ride (Pending Only)
```http
PUT /rides/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "pickupLocation": "Updated Pickup Location",
  "scheduledTime": "2024-01-15T11:00:00Z"
}
```

### Cancel Ride
```http
DELETE /rides/:id
Authorization: Bearer <token>
```

---

## 👨‍💼 Admin Endpoints

### Get All Rides (with filters)
```http
GET /admin/rides?status=PENDING&startDate=2024-01-01&endDate=2024-01-31&userId=123&page=1&limit=10&search=meeting
Authorization: Bearer <admin-token>
```

### Approve/Reject Ride
```http
POST /admin/rides/:id/action
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "action": "APPROVE",
  "reason": "Valid business purpose"
}
```

### Get Analytics
```http
GET /admin/analytics?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <admin-token>
```

### Get Dashboard Summary
```http
GET /admin/dashboard
Authorization: Bearer <admin-token>
```

---

## 📊 Response Formats

### Success Response
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": [ ... ]
}
```

### Paginated Response
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

---

## 🗄️ Database Schema

### User Model
```sql
- id: String (Primary Key)
- email: String (Unique)
- password: String (Hashed)
- name: String
- phone: String (Optional)
- company: String (Optional)
- role: UserRole (USER/ADMIN)
- createdAt: DateTime
- updatedAt: DateTime
```

### Ride Model
```sql
- id: String (Primary Key)
- userId: String (Foreign Key)
- pickupLocation: String
- dropLocation: String
- scheduledTime: DateTime
- status: RideStatus (PENDING/APPROVED/REJECTED/CANCELLED/COMPLETED)
- purpose: String (Optional)
- notes: String (Optional)
- createdAt: DateTime
- updatedAt: DateTime
```

### AdminAction Model
```sql
- id: String (Primary Key)
- adminId: String (Foreign Key)
- rideId: String (Foreign Key)
- action: AdminActionType (APPROVE/REJECT/CANCEL)
- reason: String (Optional)
- createdAt: DateTime
```

---

## 🧪 Sample Data

After running the seed script, you'll have:

### Users
- **Admin**: `admin@rapido.com` (password: `admin123`)
- **Regular Users**: 
  - `john.doe@company.com` (password: `user123`)
  - `jane.smith@company.com` (password: `user123`)
  - `mike.johnson@company.com` (password: `user123`)

### Sample Rides
- Various ride requests with different statuses (PENDING, APPROVED, REJECTED, COMPLETED)
- Admin actions for approved/rejected rides

---

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm start           # Start production server
npm run db:generate # Generate Prisma client
npm run db:push     # Push schema to database
npm run db:migrate  # Run database migrations
npm run db:studio   # Open Prisma Studio
npm run db:seed     # Seed database with sample data
```

### Project Structure
```
src/
├── index.js              # Main server file
├── lib/
│   └── prisma.js         # Prisma client
├── middleware/
│   ├── auth.js           # Authentication middleware
│   └── validation.js     # Request validation
├── routes/
│   ├── auth.js           # Authentication routes
│   ├── users.js          # User management routes
│   ├── rides.js          # Ride booking routes
│   └── admin.js          # Admin routes
└── seed.js               # Database seeder
```

---

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: Protection against brute force attacks
- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers
- **Role-based Access**: Admin/User role separation

---

## 📈 Analytics Features

- **Ride Statistics**: Total rides, rides by status
- **Time-based Analytics**: Rides per day, date range filtering
- **User Analytics**: Top users by ride count
- **Admin Actions**: Audit trail of admin decisions
- **Dashboard**: Real-time summary statistics

---

## 🚀 Deployment

### Environment Variables
Make sure to set these in production:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Strong secret key for JWT signing
- `NODE_ENV`: Set to "production"
- `PORT`: Server port (optional, defaults to 3000)

### Database Setup
1. Create PostgreSQL database
2. Run `npm run db:push` to apply schema
3. Run `npm run db:seed` to populate initial data

### Production Considerations
- Use environment variables for sensitive data
- Set up proper logging
- Configure CORS for your domain
- Set up monitoring and health checks
- Use HTTPS in production

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🆘 Support

For support or questions, please create an issue in the repository. 