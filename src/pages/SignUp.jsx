import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { signUp, selectIsLoading, selectError, clearError } from '../features/auth/authSlice'
import { addError, addSuccess } from '../features/alerts/alertsSlice'
import { Eye, EyeOff, Mail, Lock, User, Phone, Building } from 'lucide-react'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import { APP_MODES, USER_ROLES } from '../lib/constants'

const SignUp = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isLoading = useSelector(selectIsLoading)
  const error = useSelector(selectError)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    role: USER_ROLES.STYLIST,
    mode: APP_MODES.SINGLE,
    brandName: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.email) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email'
    }
    
    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    
    if (!formData.fullName) {
      errors.fullName = 'Full name is required'
    }
    
    if (!formData.phone) {
      errors.phone = 'Phone number is required'
    }
    
    if (formData.mode === APP_MODES.TEAM && !formData.brandName) {
      errors.brandName = 'Brand name is required for team mode'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Clear previous errors
    dispatch(clearError())
    setValidationErrors({})
    
    if (!validateForm()) {
      return
    }

    try {
      const signUpData = {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone,
        role: formData.role,
        mode: formData.mode,
        brandName: formData.mode === APP_MODES.TEAM ? formData.brandName : null
      }

      const result = await dispatch(signUp(signUpData)).unwrap()
      if (result?.awaitingConfirmation) {
        dispatch(addSuccess({
          message: 'We sent you a confirmation email. Please verify and then sign in.',
          title: 'Check your email'
        }))
        // Stay on signup page; optionally clear password fields
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }))
        return
      }
      if (result) {
        dispatch(addSuccess({
          message: 'Account created successfully! Welcome to SalonX.',
          title: 'Success'
        }))
        navigate('/dashboard')
      }
    } catch (error) {
      dispatch(addError({
        message: error || 'Failed to create account. Please try again.',
        title: 'Sign Up Error'
      }))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center neon-purple">
            <span className="text-white text-xl font-bold">S</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Create your SalonX account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Or{' '}
            <Link
              to="/signin"
              className="font-medium text-purple-400 hover:text-purple-300"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Mode Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Account Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, mode: APP_MODES.SINGLE }))}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    formData.mode === APP_MODES.SINGLE
                      ? 'border-purple-500/60 bg-purple-500/10 text-purple-300'
                      : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  Single Stylist
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, mode: APP_MODES.TEAM }))}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    formData.mode === APP_MODES.TEAM
                      ? 'border-purple-500/60 bg-purple-500/10 text-purple-300'
                      : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  Team/Brand
                </button>
              </div>
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-300">
                  Full Name
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`appearance-none relative block w-full px-3 py-2 pl-10 border rounded-md placeholder-gray-500 bg-gray-800 text-gray-100 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm ${
                      validationErrors.fullName ? 'border-red-400' : 'border-gray-600'
                    }`}
                    placeholder="Enter your full name"
                  />
                </div>
                {validationErrors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.fullName}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300">
                  Phone
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`appearance-none relative block w-full px-3 py-2 pl-10 border rounded-md placeholder-gray-500 bg-gray-800 text-gray-100 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm ${
                      validationErrors.phone ? 'border-red-400' : 'border-gray-600'
                    }`}
                    placeholder="Enter your phone"
                  />
                </div>
                {validationErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
                )}
              </div>
            </div>

            {/* Brand Name for Team Mode */}
            {formData.mode === APP_MODES.TEAM && (
              <div>
                <label htmlFor="brandName" className="block text-sm font-medium text-gray-300">
                  Brand Name
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="brandName"
                    name="brandName"
                    type="text"
                    required
                    value={formData.brandName}
                    onChange={handleInputChange}
                    className={`appearance-none relative block w-full px-3 py-2 pl-10 border rounded-md placeholder-gray-500 bg-gray-800 text-gray-100 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm ${
                      validationErrors.brandName ? 'border-red-400' : 'border-gray-600'
                    }`}
                    placeholder="Enter your brand name"
                  />
                </div>
                {validationErrors.brandName && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.brandName}</p>
                )}
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-300">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-800 border-gray-600 text-gray-100 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
              >
                <option value={USER_ROLES.STYLIST}>Stylist</option>
                {formData.mode === APP_MODES.TEAM && (
                  <option value={USER_ROLES.OWNER}>Owner</option>
                )}
              </select>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`appearance-none relative block w-full px-3 py-2 pl-10 border rounded-md placeholder-gray-500 bg-gray-800 text-gray-100 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm ${
                    validationErrors.email ? 'border-red-400' : 'border-gray-600'
                  }`}
                  placeholder="Enter your email"
                />
              </div>
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`appearance-none relative block w-full px-3 py-2 pl-10 pr-10 border rounded-md placeholder-gray-500 bg-gray-800 text-gray-100 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm ${
                    validationErrors.password ? 'border-red-400' : 'border-gray-600'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`appearance-none relative block w-full px-3 py-2 pl-10 pr-10 border rounded-md placeholder-gray-500 bg-gray-800 text-gray-100 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm ${
                    validationErrors.confirmPassword ? 'border-red-400' : 'border-gray-600'
                  }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating account...
                </div>
              ) : (
                'Create account'
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-900/30 border border-red-700/60 rounded-md">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SignUp 