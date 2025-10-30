# Made-in-China Admin Dashboard - Full Stack

A production-ready admin dashboard built with React 18, TypeScript, Vite, and Firebase backend.

## 🚀 Features

### Core Tech Stack

**Frontend:**
- **React 18** with TypeScript for type-safe development
- **Vite** for fast development and building
- **Redux Toolkit** with RTK Query for state management
- **React Router v6** with protected routes and RBAC
- **TailwindCSS** for styling with **Headless UI** components
- **React Hook Form + Zod** for form handling and validation
- **TanStack Table v8** with virtualization for data grids
- **Recharts** for dashboard analytics
- **dayjs** for date/time formatting (Asia/Colombo timezone)

**Backend:**
- **Firebase Authentication** for secure user management
- **Firestore Database** for real-time data storage
- **Firebase Storage** for file uploads and media management
- **Firebase Hosting** for production deployment
- **Security Rules** for data protection and access control

### Admin Features
- **Dashboard** with KPIs, charts, and quick insights
- **User Management** with RBAC (6 roles: SuperAdmin, Admin, Manager, Support, ContentEditor, Finance)
- **Product Catalog** with variants, pricing, media, and bulk operations
- **Order Management** with status tracking and fulfillment
- **Payment Processing** with provider integration and refunds
- **Content Management** (Pages, Banners, Media Library)
- **Catalog Setup** (Categories, Brands, Attributes)
- **System Management** (Roles, Audit Logs, Settings)

### UI/UX Features
- **Responsive design** optimized for all screen sizes
- **Advanced data tables** with sorting, filtering, pagination, CSV export
- **Form validation** with inline errors and type checking
- **Status badges and indicators** throughout the interface
- **Search and filtering** across all entity lists
- **Column visibility controls** and customizable views
- **Accessibility-first** design with keyboard navigation and ARIA labels
- **Real-time updates** with Firebase listeners
- **File upload** with progress tracking

## 📁 Project Structure

```
src/
├── app/                    # Redux store and routing
│   ├── store.ts           # Main Redux store configuration
│   └── routes.tsx         # React Router configuration
├── components/
│   ├── layout/            # App shell components
│   ├── data-grid/         # Reusable table components
│   └── common/            # Shared UI components
├── features/              # Feature-based modules
│   ├── auth/              # Authentication
│   ├── dashboard/         # Main dashboard
│   ├── users/             # User management
│   ├── products/          # Product catalog
│   └── [other modules]/
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   ├── rbac.ts            # Role-based access control
│   ├── format.ts          # Date/number formatting
│   ├── csv.ts             # CSV import/export
│   ├── firebase.ts        # Firebase configuration
│   └── utils.ts           # General utilities
├── services/              # Backend services
│   ├── auth.ts            # Authentication service
│   ├── firestore.ts       # Database service
│   └── storage.ts         # File storage service
└── types/                 # TypeScript definitions
    ├── user.ts
    ├── product.ts
    └── [other types]
```

## 🛠️ Quick Start

### Prerequisites
- Node.js 16+ and npm/yarn/pnpm
- Firebase project with Authentication, Firestore, and Storage enabled

### Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure Firebase:**
   - Create a Firebase project at https://console.firebase.google.com/
   - Enable Authentication (Email/Password provider)
   - Enable Firestore Database
   - Enable Storage
   - Copy your Firebase config to `.env` file

3. **Deploy Firebase rules:**
```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,storage:rules
```

4. **Start development server:**
```bash
npm run dev
```

5. **Access the application:**
   - Frontend: http://localhost:5173

### Timezone Configuration
- Default timezone: **Asia/Colombo (UTC+05:30)** 
- All dates displayed in local timezone
- Configurable in Settings page

## 🔐 Authentication

The application uses Firebase Authentication with email/password sign-in. You'll need to:

1. **Create your first admin user** through Firebase Console or sign up through the app
2. **Set user roles** in Firestore manually for the first admin user
3. **Use the admin panel** to manage other users and their roles

### RBAC System
The role-based access control system includes:

**Permissions:**
- `users:list|create|update|delete|import|export`
- `products:list|create|update|delete|import|bulkUpdate`
- `orders:list|update|export`
- `payments:list|refund`
- `content:list|create|update|delete`
- `catalog:list|create|update|delete`
- `system:roles|audit|settings`
- `dashboard:view`

**Usage:**
```typescript
import { can } from '@/lib/rbac';

// Check permissions in components
{can(role, 'products:create') && (
  <CreateProductButton />
)}

// Use in route guards
<AuthGuard permissions={['users:list']}>
  <UsersPage />
</AuthGuard>
```

## 🚀 Production Deployment

```bash
# Build for production
npm run build

# Deploy to Firebase Hosting
firebase deploy
```

## 🧪 Development

### Running the Application
```bash
npm run dev
```

The application uses Firebase for backend services with real-time data synchronization.

### Firebase Emulators (Optional)
For local development with Firebase emulators:
```bash
firebase emulators:start
```

## 🎨 UI Components

### Data Tables
- **Sorting**: Multi-column sorting with visual indicators
- **Filtering**: Global search + per-column filters
- **Pagination**: Configurable page sizes
- **Virtualization**: Handles 1000+ rows smoothly
- **Export**: CSV export respecting current filters
- **Column Control**: Show/hide columns dynamically
- **Real-time Updates**: Live data synchronization

### Forms
- **Validation**: Real-time validation with Zod schemas
- **Error Handling**: Inline field errors and form-level messages
- **File Uploads**: Firebase Storage integration with progress tracking

### Status Indicators
- **Badges**: Consistent status representation across the app
- **Colors**: Success (green), warning (yellow), error (red), info (blue)
- **Icons**: Contextual icons for quick recognition

## 📈 Performance

### Optimization Features
- **Real-time Data**: Firebase Firestore real-time listeners
- **Optimistic Updates**: Immediate UI feedback with RTK Query
- **Memoization**: React.memo and useMemo prevent unnecessary re-renders
- **Code Splitting**: Routes loaded on demand
- **Image Lazy Loading**: Product images load as needed
- **Debounced Search**: Smooth search experience
- **Caching**: RTK Query automatic caching and invalidation

### Monitoring
- **Redux DevTools**: State management debugging
- **Firebase Analytics**: User behavior tracking
- Performance monitoring with React DevTools Profiler

## 🔒 Security

### Firebase Security Rules
- **Firestore Rules**: Role-based data access control
- **Storage Rules**: Secure file upload permissions
- **Authentication**: Email verification and password policies

### Data Protection
- **Input Validation**: Zod schemas for all forms
- **XSS Protection**: Sanitized user inputs
- **CSRF Protection**: Firebase SDK built-in protection

## 🤝 Contributing

### Development Workflow
1. **Feature branches**: Create feature branches from `main`
2. **Code standards**: ESLint and Prettier configuration included
3. **Type checking**: Full TypeScript coverage required
4. **Component Testing**: Test new UI components
5. **Firebase Rules**: Update security rules for new features

### Code Standards
- **TypeScript**: Strict mode enabled with comprehensive type coverage
- **ESLint**: Airbnb configuration with React and TypeScript rules
- **Prettier**: Consistent code formatting
- **Import organization**: Absolute imports with path aliases

---

## 📞 Support

For questions about implementation or extending the application:

1. **Check the code comments** - Key components are well-documented
2. **Review the type definitions** - Complete TypeScript interfaces available
3. **Test with different roles** - Create users with different roles to understand RBAC
4. **Firebase Console** - Monitor database and authentication in Firebase Console

---

**Built with ❤️ using React, TypeScript, Vite, and Firebase**