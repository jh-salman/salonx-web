import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { combineReducers } from 'redux'

// Import slices
import authReducer from '../features/auth/authSlice'
import appointmentsReducer from '../features/appointments/appointmentsSlice'
import clientsReducer from '../features/clients/clientsSlice'
import servicesReducer from '../features/services/servicesSlice'

import reviewsReducer from '../features/reviews/reviewsSlice'
import performanceReducer from '../features/performance/performanceSlice'
import waitlistReducer from '../features/waitlist/waitlistSlice'
import calendarReducer from '../features/calendar/calendarSlice'
import alertsReducer from '../features/alerts/alertsSlice'
import appReducer from '../features/app/appSlice'
import themeReducer from '../features/theme/themeSlice'

// Persist configuration
const persistConfig = {
  key: 'salonx-root',
  storage,
  whitelist: [
    'auth',
    'appointments', 
    'clients',
    'services',

    'reviews',
    'performance',
    'waitlist',
    'calendar',
    'theme'
  ],
  blacklist: ['alerts'] // Don't persist alerts
}

// Root reducer
const rootReducer = combineReducers({
  auth: authReducer,
  appointments: appointmentsReducer,
  clients: clientsReducer,
  services: servicesReducer,

  reviews: reviewsReducer,
  performance: performanceReducer,
  waitlist: waitlistReducer,
  calendar: calendarReducer,
  alerts: alertsReducer,
  app: appReducer,
  theme: themeReducer
})

// Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer)

// Store configuration
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['persist']
      }
    }),
  devTools: process.env.NODE_ENV !== 'production'
})

// Persistor
export const persistor = persistStore(store)

// Export types (for TypeScript - commented out for JavaScript)
// export type RootState = ReturnType<typeof store.getState>
// export type AppDispatch = typeof store.dispatch 