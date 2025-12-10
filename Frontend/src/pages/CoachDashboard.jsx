import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { materialApi, sessionApi, getAssetUrl } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Users, DollarSign, Video, Calendar, RefreshCw, AlertCircle, Eye, Edit2 } from 'lucide-react'

const CoachDashboard = () => {
  const [materials, setMaterials] = useState([])
  const [sessions, setSessions] = useState([])
  const [stats, setStats] = useState({
    totalMaterials: 0,
    totalEarnings: 0,
    upcomingSessions: 0
  })
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const { user, loading: authLoading } = useAuth() // Get auth loading state
  const navigate = useNavigate()

  useEffect(() => {
    console.log('CoachDashboard - Auth loading:', authLoading)
    console.log('CoachDashboard - User:', user)

    // Wait for auth to finish loading
    if (authLoading) {
      console.log('Auth still loading, waiting...')
      return
    }

    // Check if user exists AFTER auth finishes loading
    if (!user) {
      console.log('No user after auth loaded, redirecting to login')
      //navigate('/login')
      return
    }

    // Check user role
    if (user.role !== 'Coach') {
      console.log(`User role is ${user.role}, redirecting`)
      navigate(user.role === 'Student' ? '/student/dashboard' : '/')
      return
    }

    // Load dashboard data
    if (user.id) {
      console.log('User is coach, loading dashboard data...')
      loadDashboardData()
    } else {
      console.error('User missing id property:', user)
      setError('User data incomplete')
      setLoadingData(false)
    }
  }, [user, authLoading, navigate])

  const loadDashboardData = async () => {
    try {
      setError(null)
      setLoadingData(true)

      console.log('Loading dashboard data for coach ID:', user.id)

      const [materialsData, sessionsData] = await Promise.all([
        materialApi.getCoachMaterials(user.id),
        sessionApi.getCoachSessions(user.id)
      ])

      console.log('Materials data:', materialsData)
      console.log('Sessions data:', sessionsData)

      setMaterials(Array.isArray(materialsData) ? materialsData.slice(0, 5) : [])
      setSessions(Array.isArray(sessionsData) ? sessionsData.slice(0, 5) : [])

      // Calculate stats
      const totalEarnings = Array.isArray(materialsData) ? materialsData.reduce((sum, material) => {
        return sum + ((material.price || 0) * (material.purchases || 10))
      }, 0) : 0

      const upcomingSessions = Array.isArray(sessionsData) ? sessionsData.filter(session => {
        try {
          if (!session?.scheduledAt) return false
          const sessionDate = new Date(session.scheduledAt)
          return sessionDate > new Date() && session.status === 'Scheduled'
        } catch (e) {
          console.error('Error parsing session date:', e)
          return false
        }
      }).length : 0

      setStats({
        totalMaterials: Array.isArray(materialsData) ? materialsData.length : 0,
        totalEarnings,
        upcomingSessions
      })

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setError(error.message || 'Failed to load dashboard data. Please try again.')
    } finally {
      setLoadingData(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadDashboardData()
  }

  // Show loading while auth is loading OR dashboard data is loading
  if (authLoading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {authLoading ? 'Checking authentication...' : 'Loading dashboard...'}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Coach Dashboard</h1>
          </div>
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Safety check - should never reach here without user, but just in case
  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with refresh button */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Coach Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Welcome back, {user?.firstName || 'Coach'}!
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Video className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Materials</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMaterials}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalEarnings.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingSessions}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Materials - Updated with Edit links */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Recent Materials</h2>
                <Link
                  to="/Coach/Materials/Create"
                  className="flex items-center text-primary-600 hover:text-primary-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create New
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {materials.length > 0 ? (
                materials.map((material) => (
                  <div key={material.id || material._id} className="px-6 py-4 hover:bg-gray-50 group">
                    <div className="flex items-start">
                      {/* Thumbnail */}
                      <div className="flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden bg-gray-100 mr-4">
                        {material.thumbnailUrl ? (
                          <img
                            src={getAssetUrl(material.thumbnailUrl)}
                            alt={material.title || 'Material thumbnail'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{material.title || 'Untitled Material'}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                          {material.description || 'No description'}
                        </p>
                        <div className="flex items-center mt-2 space-x-3">
                          <span className="text-sm font-medium text-gray-900">
                            ${material.price ? material.price.toFixed(2) : '0.00'}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                            {material.contentType || 'Unknown'}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="ml-4 flex items-center space-x-1">
                        <Link
                          to={`/coach/materials/${material.id || material._id}`}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/coach/materials/edit/${material.id || material._id}`}
                          className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center">
                  <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No materials yet</p>
                  <Link
                    to="/Coach/Materials/Create"
                    className="inline-block mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Create your first material
                  </Link>
                </div>
              )}
            </div>
            {materials.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <Link
                  to="/coach/materials"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View all materials →
                </Link>
              </div>
            )}
          </div>

          {/* Upcoming Sessions */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Upcoming Sessions</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {sessions.length > 0 ? (
                sessions.map((session) => (
                  <div key={session.id || session._id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          Session with {session.student?.firstName || 'Student'} {session.student?.lastName || ''}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {session.scheduledAt ? (
                            <>
                              {new Date(session.scheduledAt).toLocaleDateString()} at{' '}
                              {new Date(session.scheduledAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </>
                          ) : (
                            'Date not scheduled'
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          ${session.price ? session.price.toFixed(2) : '0.00'}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {session.sessionType || 'Session'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No upcoming sessions</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CoachDashboard