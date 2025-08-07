# SalonX - Stylist App

A comprehensive salon management application built with React, Redux Toolkit, and Supabase. Supports both single stylist and team/brand modes with role-based access control.

## 🚀 Features

### Core Functionality
- **Authentication & Authorization**: Secure login/signup with role-based access
- **Team/Single Mode**: Support for both individual stylists and team environments
- **Appointment Management**: Create, update, and manage appointments with real-time updates
- **Client Management**: Comprehensive client profiles and history
- **Calendar Integration**: Day, week, and month views with appointment scheduling
- **Performance Tracking**: KPI monitoring and performance analytics
- **Waitlist Management**: Queue management for walk-in clients
- **Branding Customization**: Customizable UI elements and branding content

### Technical Features
- **Real-time Updates**: Live synchronization across all connected devices
- **State Persistence**: Redux Persist for offline capability
- **Role-based Security**: Row Level Security (RLS) in Supabase
- **Responsive Design**: Mobile-first approach with TailwindCSS
- **Modern UI**: Clean, professional interface with smooth animations

## 🛠 Technology Stack

- **Frontend**: React 18 + Vite
- **State Management**: Redux Toolkit + Redux Persist
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Styling**: TailwindCSS + Lucide React Icons
- **Routing**: React Router DOM
- **Calendar**: Custom calendar implementation
- **Build Tool**: Vite

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd salonx-stylist-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

4. **Set up Supabase Database**
   Run the SQL scripts in the `database/` folder to create the necessary tables and RLS policies.

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🗄 Database Schema

### Core Tables
- **profiles**: User profiles with role and brand information
- **brands**: Brand/business information for team mode
- **clients**: Client information and contact details
- **appointments**: Appointment scheduling and management
- **services**: Available services and pricing
- **performance_logs**: KPI tracking and analytics
- **waitlist**: Queue management for walk-ins
- **branding_content**: Customizable UI content

### Security
- Row Level Security (RLS) enabled on all tables
- Role-based access control (Owner, Admin, Stylist)
- Team vs Single mode filtering

## 🏗 Project Structure

```
src/
├── features/                 # Redux slices
│   ├── auth/                # Authentication
│   ├── appointments/         # Appointment management
│   ├── clients/             # Client management
│   ├── branding/            # Branding content
│   ├── performance/         # KPI tracking
│   ├── waitlist/            # Waitlist management
│   ├── calendar/            # Calendar state
│   └── alerts/              # Global notifications
├── components/              # Reusable components
│   └── shared/              # Common UI components
├── pages/                   # Main application pages
├── lib/                     # Utilities and configurations
└── store/                   # Redux store configuration
```

## 🔐 Authentication & Roles

### User Roles
- **Owner**: Full access to brand management and team data
- **Admin**: Management access within the brand
- **Stylist**: Individual appointment and client management

### Modes
- **Single Mode**: Individual stylist working independently
- **Team Mode**: Multiple stylists working under a brand

## 📱 Key Features

### Dashboard
- Real-time appointment queue
- Performance KPIs
- Quick client access
- Waitlist management
- Branding customization

### Calendar
- Day, week, and month views
- Appointment scheduling
- Drag-and-drop functionality (planned)
- Parked appointments management

### Client Management
- Comprehensive client profiles
- Appointment history
- Contact information
- Notes and preferences

### Performance Tracking
- Daily KPI logging
- Revenue, retail, retention metrics
- Performance analytics
- Goal tracking

## 🔄 Real-time Features

- Live appointment updates
- Client information synchronization
- Performance data updates
- Waitlist changes
- Branding content updates

## 🎨 Customization

### Branding
- Customizable dashboard header
- Brand colors and logos
- Section-specific content
- Team/brand-specific styling

### UI Components
- Responsive design
- Dark/light mode support (planned)
- Customizable themes
- Accessibility features

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically

### Deploy to Netlify
1. Build the project
2. Upload the `dist` folder
3. Configure environment variables

## 🔧 Development

### Available Scripts
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint

### Code Style
- ESLint configuration included
- Prettier formatting
- Consistent component structure
- TypeScript support (planned)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code examples

## 🔮 Future Features

- Smartwatch integration
- Voice input for notes
- Advanced analytics
- Multi-language support
- Mobile app version
- Payment processing
- SMS notifications
- Advanced reporting

---

**SalonX** - Empowering stylists with modern salon management tools. # salonx-web
