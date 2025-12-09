import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, LogIn } from 'lucide-react'

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm()

  const onSubmit = async (data) => {
    console.log('Login form submitted with:', { email: data.email })
    setLoading(true)

    try {
      const result = await login(data.email, data.password)
      console.log('Login result:', result)

      if (result.success) {
        // Get user from localStorage to determine role
        const storedUser = localStorage.getItem('pickleball_user')

        if (storedUser) {
          try {
            const user = JSON.parse(storedUser)
            console.log('Logged in user:', user)

            // Determine redirect path based on role
            let redirectPath = '/'

            if (user.role) {
              const role = user.role.toLowerCase()

              switch (role) {
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
                  redirectPath = from
              }

              console.log(`Redirecting ${role} to: ${redirectPath}`)

              // Add a small delay to ensure state is updated
              setTimeout(() => {
                navigate(redirectPath, { replace: true })
              }, 100)
            }
          }
          catch (parseError) {
            console.error('Error parsing user data:', parseError)
            navigate(from, { replace: true })
          }
        }
      } else {
        console.error('Login failed:', result.error)
        setError('root', {
          type: 'manual',
          message: result.error || 'Login failed. Please try again.'
        })
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('root', {
        type: 'manual',
        message: 'An unexpected error occurred. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  // Demo account login handler
  const handleDemoLogin = async (email, password) => {
    console.log('Using demo account:', email)
    setLoading(true)

    try {
      const result = await login(email, password)
      console.log('Demo login result:', result)

      if (result.success) {
        console.log('Demo login successful')

        // Add a small delay to ensure state is updated
        setTimeout(() => {
          navigate(from, { replace: true })
        }, 100)
      } else {
        console.error('Demo login failed:', result.error)
        setError('root', {
          type: 'manual',
          message: 'Demo login failed. ' + (result.error || 'Please try again.')
        })
      }
    } catch (error) {
      console.error('Demo login error:', error)
      setError('root', {
        type: 'manual',
        message: 'Demo login error. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg">
            <LogIn className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link
            to="/register"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {errors.root && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{errors.root.message}</div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  autoComplete="email"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm pr-10"
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
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  {...register('rememberMe')}
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Demo Accounts</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleDemoLogin('coach@example.com', 'Password123!')}
                disabled={loading}
                className="text-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <p className="text-xs font-medium text-gray-600">Coach</p>
                <p className="text-xs text-gray-500">coach@example.com</p>
                <p className="text-xs text-gray-500">Password123!</p>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('student@example.com', 'Password123!')}
                disabled={loading}
                className="text-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <p className="text-xs font-medium text-gray-600">Student</p>
                <p className="text-xs text-gray-500">student@example.com</p>
                <p className="text-xs text-gray-500">Password123!</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login