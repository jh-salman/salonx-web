import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { signIn, selectIsLoading, selectError, clearError } from '../features/auth/authSlice'
import { addError, addSuccess } from '../features/alerts/alertsSlice'
import { selectCurrentTheme } from '../features/theme/themeSlice'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import LoadingSpinner from '../components/shared/LoadingSpinner'

const SignIn = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isLoading = useSelector(selectIsLoading)
  const error = useSelector(selectError)
  const currentTheme = useSelector(selectCurrentTheme)

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})
  const [retryCount, setRetryCount] = useState(0)

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
      console.log('SignIn: Attempting sign in...')
      setRetryCount(prev => prev + 1)
      const result = await dispatch(signIn(formData)).unwrap()
      
      if (result) {
        dispatch(addSuccess({
          message: 'Successfully signed in!',
          title: 'Welcome back'
        }))
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('SignIn: Error during sign in:', error)
      
      // Handle specific timeout errors
      if (error.includes('timeout')) {
        dispatch(addError({
          message: `Connection timeout. Please check your internet connection and try again. (Attempt ${retryCount + 1})`,
          title: 'Connection Timeout'
        }))
      } else if (error.includes('Invalid login credentials')) {
        dispatch(addError({
          message: 'Invalid email or password. Please check your credentials and try again.',
          title: 'Invalid Credentials'
        }))
      } else {
        dispatch(addError({
          message: error || 'Failed to sign in. Please try again.',
          title: 'Sign In Error'
        }))
      }
    }
  }

  const handleRetry = () => {
    setRetryCount(0)
    dispatch(clearError())
    handleSubmit(new Event('submit'))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className={`mx-auto h-12 w-12 theme-gradient rounded-lg flex items-center justify-center`}>
            <span className="text-white text-xl font-bold">S</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold theme-text">
            Sign in to SalonX
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Or{' '}
            <Link
              to="/signup"
              className="font-medium theme-accent hover:text-purple-300"
            >
              create a new account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
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
                  className={`appearance-none relative block w-full px-3 py-2 pl-10 border rounded-md placeholder-gray-400 text-white bg-gray-800 border-gray-600 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm ${
                    validationErrors.email ? 'border-red-400' : 'border-gray-600'
                  }`}
                  placeholder="Enter your email"
                />
              </div>
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-400">{validationErrors.email}</p>
              )}
            </div>

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
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`appearance-none relative block w-full px-3 py-2 pl-10 pr-10 border rounded-md placeholder-gray-400 text-white bg-gray-800 border-gray-600 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm ${
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
                <p className="mt-1 text-sm text-red-400">{validationErrors.password}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-600 rounded bg-gray-800"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-purple-400 hover:text-purple-300">
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white theme-gradient hover:theme-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-900 border border-red-700 rounded-md">
            <p className="text-sm text-red-300 mb-3">{error}</p>
            <button
              onClick={handleRetry}
              className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SignIn 