# Corporate Ride Scheduling - Frontend

A React Native mobile application for corporate ride scheduling and management.

## 🚀 Features

- **User Authentication**: Login/Register with JWT token management
- **Ride Management**: Create, view, edit, and cancel ride requests
- **Admin Dashboard**: Comprehensive admin interface for ride management
- **Analytics**: Real-time analytics and reporting for admins
- **Filtering & Search**: Advanced filtering by date, status, username
- **Responsive Design**: Works on both mobile and web platforms

## 📱 Screens

### User Screens
- **Login Screen**: User authentication
- **Register Screen**: New user registration
- **Profile Screen**: User profile management
- **Ride Listing**: View user's ride history
- **Create Ride**: Book new ride requests
- **Edit Ride**: Modify existing ride details
- **Ride Details**: Detailed view of individual rides

### Admin Screens
- **Admin Analytics**: Dashboard with charts and statistics
- **All Rides Management**: Comprehensive ride management with filters
- **Pending Rides**: Quick access to pending ride approvals

## 🛠 Tech Stack

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **React Navigation**: Navigation between screens
- **Axios**: HTTP client for API calls
- **AsyncStorage**: Local data persistence
- **React Native Elements**: UI component library

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Setup Steps

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Install Expo CLI** (if not already installed)
   ```bash
   npm install -g @expo/cli
   ```

3. **Start Development Server**
   ```bash
   npx expo start
   ```

4. **Run on Different Platforms**
   - **Web**: Press `w` in terminal or visit `http://localhost:8081`
   - **Android**: Press `a` in terminal (requires Android emulator)
   - **iOS**: Press `i` in terminal (macOS only, requires Xcode)

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the frontend directory:
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### Backend URL Configuration
The backend URL is configured in `src/services/api.js`:
- **Web Development**: `http://localhost:3000`
- **Android Emulator**: `http://10.0.2.2:3000`
- **Production**: Update to your production backend URL

## 📁 Project Structure

```
frontend/
├── src/
│   ├── contexts/
│   │   └── AuthContext.js          # Authentication context
│   ├── navigation/
│   │   └── AppNavigator.js         # Navigation configuration
│   ├── screens/
│   │   ├── LoginScreen.js          # User login
│   │   ├── RegisterScreen.js       # User registration
│   │   ├── ProfileScreen.js        # User profile
│   │   ├── RideListingScreen.js    # User ride list
│   │   ├── CreateRideScreen.js     # Create new ride
│   │   ├── EditRideScreen.js       # Edit existing ride
│   │   ├── RideDetailScreen.js     # Ride details view
│   │   ├── AdminAnalyticsScreen.js # Admin analytics dashboard
│   │   └── AdminAllRidesScreen.js  # Admin ride management
│   └── services/
│       └── api.js                  # API service functions
├── assets/                         # Images, fonts, etc.
├── App.js                          # Main app component
├── app.json                        # Expo configuration
├── package.json                    # Dependencies
└── README.md                       # This file
```

## 🔌 API Integration

The frontend communicates with the backend through RESTful APIs:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Rides
- `GET /api/rides/my-rides` - Get user's rides
- `POST /api/rides` - Create new ride
- `PUT /api/rides/:id` - Update ride
- `DELETE /api/rides/:id` - Cancel ride

### Admin
- `GET /api/admin/rides` - Get all rides with filters
- `POST /api/admin/rides/:id/action` - Approve/reject ride
- `GET /api/admin/analytics` - Get analytics data
- `GET /api/admin/dashboard` - Get dashboard stats

### Simulation
- `GET /api/simulation/rides/eligible-for-completion` - Get eligible rides
- `POST /api/simulation/rides/:id/complete` - Simulate ride completion
- `POST /api/simulation/rides/bulk-complete` - Bulk completion

## 🎨 UI Components

The app uses a consistent design system with:
- **Color Scheme**: Primary blue theme with status-based colors
- **Typography**: Clear, readable fonts
- **Spacing**: Consistent padding and margins
- **Status Indicators**: Color-coded ride status badges
- **Loading States**: Skeleton screens and spinners
- **Error Handling**: User-friendly error messages

## 🔐 Authentication Flow

1. **Login**: User enters email/password
2. **Token Storage**: JWT token stored in AsyncStorage
3. **Context Update**: AuthContext updates with user data
4. **Navigation**: Redirected to appropriate screen based on role
5. **Token Validation**: Automatic token validation on app start

## 📊 Admin Features

### Analytics Dashboard
- Total rides count
- Rides by status
- Rides per day 
- Top users by ride count
- Recent admin actions

### Ride Management
- View all rides with pagination
- Filter by username, status, date range
- Search functionality
- Bulk actions for ride approval/rejection
- Real-time status updates

## 🚀 Deployment

### Web Deployment
```bash
npx expo build:web
```

### Mobile App Store Deployment
```bash
npx expo build:android  # For Android
npx expo build:ios      # For iOS
```

## 🐛 Troubleshooting

### Common Issues

1. **Metro Bundler Issues**
   ```bash
   npx expo start --clear
   ```

2. **Android Emulator Connection**
   - Ensure backend URL is set to `http://10.0.2.2:3000`
   - Check if Android emulator is running

3. **iOS Simulator Issues**
   - Ensure Xcode is properly installed
   - Run `npx expo run:ios` for native iOS build

4. **API Connection Issues**
   - Verify backend server is running
   - Check network connectivity
   - Validate API endpoints

## 📝 Development Guidelines

- **Code Style**: Follow React Native best practices
- **Component Structure**: Use functional components with hooks
- **State Management**: Use React Context for global state
- **Error Handling**: Implement proper error boundaries
- **Performance**: Optimize re-renders and bundle size

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test on multiple platforms
4. Submit a pull request



**Note**: This frontend application is designed to work with the corresponding backend API. Ensure the backend server is running before testing the frontend features. 