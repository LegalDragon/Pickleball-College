import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, UserPlus, User, GraduationCap, CheckCircle, AlertCircle, Key } from 'lucide-react'
const Register = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const [showUserExistsModal, setShowUserExistsModal] = useState(false)
  const [existingUserEmail, setExistingUserEmail] = useState('')

  const { register: registerUser } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
    getValues
  } = useForm({
    defaultValues: {
      role: 'Student'
    }
  })

  const password = watch('password')
  const [selectedRole, setSelectedRole] = useState('Student')

  const onSubmit = async (data) => {
    console.log('Registration data:', data)
    setLoading(true)

    setExistingUserEmail(data.email)

    try {
      const result = await registerUser(data)
      console.log('Registration result:', result)

      if (result.success) {
        const storedUser = localStorage.getItem('pickleball_user')
        if (storedUser) {
          const user = JSON.parse(storedUser)
          let redirectPath = '/'

          if (user.role) {
            switch (user.role.toLowerCase()) {
              case 'coach':
                redirectPath = '/coach/dashboard'
                break
              case 'student':
                redirectPath = '/student/dashboard'
                break
              case 'admin':
                redirectPath = '/admin/dashboard'
                break
              default:
                redirectPath = '/'
            }
          }
          navigate(redirectPath)
        } else {
          navigate(data.role === 'Coach' ? '/coach/dashboard' : '/student/dashboard')
        }
      } else {


        if (result.error === 'USER_EXISTS') {
          setShowUserExistsModal(true)
        } else {
          console.error('Registration failed:', result.error)
          setError('root', {
            type: 'manual',
            message: result.error || 'Registration failed. Please try again.'
          })
        }
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError('root', {
        type: 'manual',
        message: 'An unexpected error occurred. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  const roleOptions = [
    {
      value: 'Student',
      label: 'Student',
      description: 'I want to learn pickleball and access training materials',
      icon: GraduationCap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
      ringColor: 'ring-blue-200'
    },
    {
      value: 'Coach',
      label: 'Coach',
      description: 'I want to teach and create training materials',
      icon: User,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-500',
      ringColor: 'ring-green-200'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {errors.root && (
              <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                <div className="text-sm text-red-700 font-medium">{errors.root.message}</div>
              </div>
            )}

            {/* Role Selection - IMPROVED */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                I want to join as a...
              </label>
              <div className="grid grid-cols-1 gap-3">
                {roleOptions.map((option) => {
                  const isSelected = selectedRole === option.value
                  return (
                    <label
                      key={option.value}
                      className={`relative flex cursor-pointer rounded-xl border p-4 transition-all duration-200 ${isSelected
                        ? `${option.bgColor} border-2 ${option.borderColor} ring-2 ${option.ringColor}`
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                        }`}
                      onClick={() => setSelectedRole(option.value)}
                    >
                      <input
                        {...register('role', { required: 'Please select a role' })}
                        type="radio"
                        value={option.value}
                        className="sr-only"
                        checked={isSelected}
                        onChange={(e) => setSelectedRole(e.target.value)}
                      />
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center">
                          <div className="text-sm">
                            <div className="flex items-center">
                              <option.icon className={`w-5 h-5 mr-2 ${option.color}`} />
                              <span className="font-semibold text-gray-900">{option.label}</span>
                            </div>
                            <p className="text-gray-500 text-xs mt-1">{option.description}</p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 flex items-center">
                          {/* Custom Checkbox */}
                          {isSelected
                            ? <CheckCircle className={`w-5 h-5 ${option.color}`} />
                            :
                            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all border-gray-300 bg-white`}> </div>
                          }
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
              {errors.role && (
                <p className="mt-2 text-sm text-red-600 font-medium">{errors.role.message}</p>
              )}
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First name
                </label>
                <div className="mt-1">
                  <input
                    {...register('firstName', {
                      required: 'First name is required',
                      minLength: {
                        value: 2,
                        message: 'First name must be at least 2 characters'
                      }
                    })}
                    type="text"
                    autoComplete="given-name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition"
                    placeholder="Enter your first name"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last name
                </label>
                <div className="mt-1">
                  <input
                    {...register('lastName', {
                      required: 'Last name is required',
                      minLength: {
                        value: 2,
                        message: 'Last name must be at least 2 characters'
                      }
                    })}
                    type="text"
                    autoComplete="family-name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition"
                    placeholder="Enter your last name"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <div className="mt-1">
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Please enter a valid email address'
                    }
                  })}
                  type="email"
                  autoComplete="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition"
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>


            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>

              {/* Separate container just for input + eye icon */}
              <div className="relative">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters'
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Must contain uppercase, lowercase, and number'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Create a secure password"
                  id="password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <Eye className="h-5 w-5" />
                  ) : (
                    <EyeOff className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Error message - separate from input container */}
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}

              <p className="mt-1 text-xs text-gray-500">
                Must be at least 8 characters with uppercase, lowercase, and a number
              </p>
            </div>


            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm password
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                  type="password"
                  autoComplete="new-password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition"
                  placeholder="Re-enter your password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex items-start">
              <input
                {...register('terms', {
                  required: 'You must accept the terms and conditions'
                })}
                id="terms"
                name="terms"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                I agree to the{' '}
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Privacy Policy
                </a>
              </label>
            </div>
            {errors.terms && (
              <p className="mt-1 text-sm text-red-600">{errors.terms.message}</p>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-3"></div>
                    Creating account...
                  </div>
                ) : (
                  'Create account'
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>{/* User Exists Modal */}
      {showUserExistsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Account Already Exists
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  An account with <span className="font-medium">{existingUserEmail}</span> already exists.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <Key className="w-5 h-5 text-blue-600 mr-2" />
                <p className="text-sm text-blue-800 font-medium">
                  Already have an account? Try signing in or resetting your password.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowUserExistsModal(false)
                  navigate('/login', { state: { email: existingUserEmail } })
                }}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center"
              >
                <User className="w-4 h-4 mr-2" />
                Sign In Instead
              </button>

              <button
                onClick={() => {
                  setShowUserExistsModal(false)
                  navigate('/forgot-password', { state: { email: existingUserEmail } })
                }}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center"
              >
                <Key className="w-4 h-4 mr-2" />
                Reset Password
              </button>

              <button
                onClick={() => setShowUserExistsModal(false)}
                className="w-full py-3 text-gray-600 hover:text-gray-800 font-medium"
              >
                Try Different Email
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Having trouble? Contact{' '}
                <a href="mailto:support@pickleball.college" className="text-blue-600 hover:underline">
                  support@pickleball.college
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default Register