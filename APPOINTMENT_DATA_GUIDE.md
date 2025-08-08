# Appointment Data Guide

## 📊 **Appointment Data Structure**

### **Database Schema (appointments table)**
```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY,
  stylist_id UUID REFERENCES profiles(id),
  client_id UUID REFERENCES clients(id),
  brand_id UUID REFERENCES brands(id),
  service_id UUID REFERENCES services(id),
  date TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  price NUMERIC(10,2) NOT NULL,
  type TEXT DEFAULT 'normal',
  deposit_percent INTEGER DEFAULT 0,
  notes TEXT,
  attachment_url TEXT,
  parked BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'scheduled',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Appointment Status Types**
```javascript
const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed', 
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
  PARKED: 'parked'
}
```

### **Appointment Color Classes**
```javascript
const APPOINTMENT_COLOR_CLASSES = {
  SCHEDULED: 'bg-blue-500 hover:bg-blue-600 border-blue-600',
  CONFIRMED: 'bg-green-500 hover:bg-green-600 border-green-600',
  IN_PROGRESS: 'bg-yellow-500 hover:bg-yellow-600 border-yellow-600',
  COMPLETED: 'bg-gray-500 hover:bg-gray-600 border-gray-600',
  CANCELLED: 'bg-red-500 hover:bg-red-600 border-red-600',
  NO_SHOW: 'bg-orange-500 hover:bg-orange-600 border-orange-600',
  PARKED: 'bg-purple-500 hover:bg-purple-600 border-purple-600'
}
```

## 🔍 **How to View Appointment Data**

### **1. In Browser Console**
```javascript
// View all appointments
console.log('All appointments:', window.store.getState().appointments.appointments)

// View active appointments
console.log('Active appointments:', window.store.getState().appointments.activeAppointments)

// View parked appointments  
console.log('Parked appointments:', window.store.getState().appointments.parkedAppointments)

// View appointments by status
const appointments = window.store.getState().appointments.appointments
const scheduled = appointments.filter(apt => apt.status === 'scheduled')
const completed = appointments.filter(apt => apt.status === 'completed')
console.log('Scheduled:', scheduled)
console.log('Completed:', completed)
```

### **2. In React Components**
```javascript
import { useSelector } from 'react-redux'
import { selectAppointments, selectActiveAppointments } from '../features/appointments/appointmentsSlice'

const MyComponent = () => {
  const appointments = useSelector(selectAppointments)
  const activeAppointments = useSelector(selectActiveAppointments)
  
  console.log('All appointments:', appointments)
  console.log('Active appointments:', activeAppointments)
  
  return (
    <div>
      <h2>Appointments ({appointments.length})</h2>
      {appointments.map(appointment => (
        <div key={appointment.id}>
          <p>Client: {appointment.clients?.full_name}</p>
          <p>Service: {appointment.services?.name}</p>
          <p>Date: {new Date(appointment.date).toLocaleString()}</p>
          <p>Status: {appointment.status}</p>
          <p>Price: ${appointment.price}</p>
        </div>
      ))}
    </div>
  )
}
```

### **3. Direct Database Query**
```sql
-- View all appointments
SELECT 
  a.id,
  a.date,
  a.duration,
  a.price,
  a.status,
  a.parked,
  c.full_name as client_name,
  s.name as service_name,
  p.full_name as stylist_name
FROM appointments a
LEFT JOIN clients c ON a.client_id = c.id
LEFT JOIN services s ON a.service_id = s.id
LEFT JOIN profiles p ON a.stylist_id = p.id
ORDER BY a.date DESC;

-- View appointments by status
SELECT * FROM appointments WHERE status = 'scheduled';

-- View parked appointments
SELECT * FROM appointments WHERE parked = true;

-- View appointments for today
SELECT * FROM appointments 
WHERE DATE(date) = CURRENT_DATE;
```

## 📈 **Appointment Data Analysis**

### **Key Metrics**
```javascript
// Calculate appointment statistics
const appointments = window.store.getState().appointments.appointments

const stats = {
  total: appointments.length,
  scheduled: appointments.filter(apt => apt.status === 'scheduled').length,
  completed: appointments.filter(apt => apt.status === 'completed').length,
  cancelled: appointments.filter(apt => apt.status === 'cancelled').length,
  parked: appointments.filter(apt => apt.parked).length,
  totalRevenue: appointments.reduce((sum, apt) => sum + apt.price, 0),
  averagePrice: appointments.length > 0 ? appointments.reduce((sum, apt) => sum + apt.price, 0) / appointments.length : 0
}

console.log('Appointment Statistics:', stats)
```

### **Filtering Appointments**
```javascript
// Filter by date range
const startDate = new Date('2024-01-01')
const endDate = new Date('2024-12-31')
const dateFiltered = appointments.filter(apt => {
  const aptDate = new Date(apt.date)
  return aptDate >= startDate && aptDate <= endDate
})

// Filter by client
const clientFiltered = appointments.filter(apt => 
  apt.clients?.full_name?.includes('John')
)

// Filter by service
const serviceFiltered = appointments.filter(apt => 
  apt.services?.name?.includes('Haircut')
)

// Filter by price range
const priceFiltered = appointments.filter(apt => 
  apt.price >= 50 && apt.price <= 200
)
```

## 🔧 **Appointment Management Functions**

### **Create Appointment**
```javascript
// Create new appointment
const newAppointment = {
  client_id: 'client-uuid',
  service_id: 'service-uuid', 
  date: '2024-01-15T10:00:00Z',
  duration: 60,
  price: 75.00,
  notes: 'Client requested specific styling'
}

dispatch(createAppointment(newAppointment))
```

### **Update Appointment**
```javascript
// Update appointment status
const updateData = {
  id: 'appointment-uuid',
  updates: {
    status: 'completed',
    notes: 'Service completed successfully'
  }
}

dispatch(updateAppointment(updateData))
```

### **Park/Unpark Appointment**
```javascript
// Park appointment
dispatch(parkAppointment('appointment-uuid'))

// Unpark appointment  
dispatch(unparkAppointment('appointment-uuid'))
```

### **Delete Appointment**
```javascript
// Delete appointment
dispatch(deleteAppointment('appointment-uuid'))
```

## 📊 **Sample Appointment Data**

```javascript
// Example appointment object
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  stylist_id: "123e4567-e89b-12d3-a456-426614174000",
  client_id: "789e0123-e45b-67d8-a901-234567890000",
  brand_id: "456e7890-e12b-34d5-a678-901234567000",
  service_id: "012e3456-e78b-90d1-a234-567890123000",
  date: "2024-01-15T10:00:00.000Z",
  duration: 60,
  price: 75.00,
  type: "normal",
  deposit_percent: 0,
  notes: "Client requested specific styling",
  attachment_url: null,
  parked: false,
  status: "scheduled",
  created_by: "123e4567-e89b-12d3-a456-426614174000",
  created_at: "2024-01-10T08:00:00.000Z",
  updated_at: "2024-01-10T08:00:00.000Z",
  clients: {
    id: "789e0123-e45b-67d8-a901-234567890000",
    full_name: "John Doe",
    phone: "+1234567890",
    email: "john@example.com"
  },
  services: {
    id: "012e3456-e78b-90d1-a234-567890123000",
    name: "Haircut & Styling",
    price: 75.00,
    duration: 60
  }
}
```

## 🚀 **Quick Data Access Commands**

### **In Browser Console**
```javascript
// Get all appointments
const appointments = window.store.getState().appointments.appointments

// Get today's appointments
const today = new Date().toISOString().split('T')[0]
const todaysAppointments = appointments.filter(apt => 
  apt.date.startsWith(today)
)

// Get this week's appointments
const thisWeek = appointments.filter(apt => {
  const aptDate = new Date(apt.date)
  const now = new Date()
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
  const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6))
  return aptDate >= weekStart && aptDate <= weekEnd
})

console.log('Today:', todaysAppointments)
console.log('This Week:', thisWeek)
```

This guide helps you understand and manage all appointment data in your SalonX application! 