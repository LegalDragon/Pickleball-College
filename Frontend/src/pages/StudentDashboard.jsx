import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Users, DollarSign, Video, Calendar } from 'lucide-react'

const StudentDashboard = () => {
  const [materials, setMaterials] = useState([])
  const [sessions, setSessions] = useState([])
  const [stats, setStats] = useState({
    totalMaterials: 0,
    totalEarnings: 0,
    upcomingSessions: 0
  })
  const { user } = useAuth()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Mock data for now
      setMaterials([
        {
          id: '1',
          title: 'Advanced Pickleball Strategies',
          description: 'Learn advanced game strategies',
          price: 49.99,
          contentType: 'Video',
          createdAt: new Date().toISOString()
        }
      ])
      
      setSessions([
        {
          id: '1',
          student: { firstName: 'Jane', lastName: 'Doe' },
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          sessionType: 'Online',
          price: 75,
          status: 'Scheduled'
        }
      ])

      setStats({
        totalMaterials: 1,
        totalEarnings: 49.99,
        upcomingSessions: 1
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Student  Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back, {user?.firstName}!</p>
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
                <p className="text-2xl font-bold text-gray-900">${stats.totalEarnings}</p>
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
          {/* Recent Materials */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Recent Materials</h2>
                <Link
                  to="/coach/materials/create"
                  className="flex items-center text-primary-600 hover:text-primary-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create New
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {materials.map((material) => (
                <div key={material.id} className="px-6 py-4">
                  <h3 className="text-sm font-medium text-gray-900">{material.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{material.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-600">${material.price}</span>
                    <span className="text-xs text-gray-500 capitalize">{material.contentType}</span>
                  </div>
                </div>
              ))}
              {materials.length === 0 && (
                <div className="px-6 py-8 text-center">
                  <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No materials yet</p>
                  <Link
                    to="/coach/materials/create"
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Create your first material
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Sessions */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Upcoming Sessions</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {sessions.map((session) => (
                <div key={session.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        Session with {session.student.firstName} {session.student.lastName}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(session.scheduledAt).toLocaleDateString()} at{' '}
                        {new Date(session.scheduledAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">${session.price}</p>
                      <p className="text-xs text-gray-500 capitalize">{session.sessionType}</p>
                    </div>
                  </div>
                </div>
              ))}
              {sessions.length === 0 && (
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

export default StudentDashboard