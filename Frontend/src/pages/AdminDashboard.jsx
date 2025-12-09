import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { userApi, materialApi, getAssetUrl } from '../services/api'
import {
  Users, BookOpen, Calendar, DollarSign, Search, Edit2, Trash2,
  ChevronLeft, ChevronRight, Filter, MoreVertical, Eye, X,
  Shield, GraduationCap, User, CheckCircle, XCircle, Save
} from 'lucide-react'

const AdminDashboard = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('users')
  const [loading, setLoading] = useState(false)

  // Users state
  const [users, setUsers] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [savingUser, setSavingUser] = useState(false)

  // Materials state
  const [materials, setMaterials] = useState([])
  const [materialSearch, setMaterialSearch] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Fetch users
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers()
    } else if (activeTab === 'materials') {
      fetchMaterials()
    }
  }, [activeTab])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await userApi.getAllUsers()
      if (response.success && response.data) {
        setUsers(response.data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMaterials = async () => {
    setLoading(true)
    try {
      const response = await materialApi.getMaterials()
      if (response.success && response.data) {
        setMaterials(response.data)
      } else if (Array.isArray(response)) {
        setMaterials(response)
      }
    } catch (error) {
      console.error('Error fetching materials:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      (u.firstName?.toLowerCase() || '').includes(userSearch.toLowerCase()) ||
      (u.lastName?.toLowerCase() || '').includes(userSearch.toLowerCase()) ||
      (u.email?.toLowerCase() || '').includes(userSearch.toLowerCase())
    const matchesRole = userRoleFilter === 'all' || u.role?.toLowerCase() === userRoleFilter.toLowerCase()
    return matchesSearch && matchesRole
  })

  // Filter materials
  const filteredMaterials = materials.filter(m => {
    return (m.title?.toLowerCase() || '').includes(materialSearch.toLowerCase()) ||
           (m.description?.toLowerCase() || '').includes(materialSearch.toLowerCase())
  })

  // Pagination logic
  const getPaginatedData = (data) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return data.slice(startIndex, startIndex + itemsPerPage)
  }

  const totalPages = (data) => Math.ceil(data.length / itemsPerPage)

  // Handle user edit
  const handleEditUser = (userData) => {
    setSelectedUser({ ...userData })
    setIsUserModalOpen(true)
  }

  // Handle save user
  const handleSaveUser = async () => {
    if (!selectedUser) return
    setSavingUser(true)
    try {
      await userApi.updateUser(selectedUser.id, {
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName,
        role: selectedUser.role,
        isActive: selectedUser.isActive
      })
      // Update local state
      setUsers(users.map(u => u.id === selectedUser.id ? selectedUser : u))
      setIsUserModalOpen(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Failed to update user')
    } finally {
      setSavingUser(false)
    }
  }

  // Get role icon
  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return <Shield className="w-4 h-4 text-purple-500" />
      case 'coach': return <GraduationCap className="w-4 h-4 text-blue-500" />
      default: return <User className="w-4 h-4 text-gray-500" />
    }
  }

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'coach': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Sidebar navigation items
  const navItems = [
    { id: 'users', label: 'Users', icon: Users, count: users.length },
    { id: 'materials', label: 'Materials', icon: BookOpen, count: materials.length },
    { id: 'events', label: 'Events', icon: Calendar, count: 0, disabled: true },
    { id: 'transactions', label: 'Transactions', icon: DollarSign, count: 0, disabled: true }
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-sm text-gray-500 mt-1">System Management</p>
          </div>
          <nav className="p-4 space-y-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => !item.disabled && setActiveTab(item.id)}
                disabled={item.disabled}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-700'
                    : item.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <item.icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.count > 0 && (
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    activeTab === item.id ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {item.count}
                  </span>
                )}
                {item.disabled && (
                  <span className="text-xs text-gray-400">Soon</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
              </div>

              {/* Search and Filters */}
              <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="w-5 h-5 text-gray-400" />
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Roles</option>
                      <option value="admin">Admin</option>
                      <option value="coach">Coach</option>
                      <option value="student">Student</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading users...</p>
                  </div>
                ) : (
                  <>
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                          <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {getPaginatedData(filteredUsers).map(u => (
                          <tr key={u.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                  {u.profileImageUrl ? (
                                    <img
                                      src={getAssetUrl(u.profileImageUrl)}
                                      alt={`${u.firstName} ${u.lastName}`}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
                                      {(u.firstName?.[0] || '') + (u.lastName?.[0] || '')}
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="font-medium text-gray-900">
                                    {u.firstName} {u.lastName}
                                  </div>
                                  <div className="text-sm text-gray-500">{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(u.role)}`}>
                                {getRoleIcon(u.role)}
                                <span className="ml-1 capitalize">{u.role}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {u.isActive ? (
                                <span className="inline-flex items-center text-green-600">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-red-600">
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Inactive
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleEditUser(u)}
                                className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Pagination */}
                    {filteredUsers.length > itemsPerPage && (
                      <div className="px-6 py-4 border-t flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                        </p>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="px-3 py-1 text-sm">
                            Page {currentPage} of {totalPages(filteredUsers)}
                          </span>
                          <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages(filteredUsers), p + 1))}
                            disabled={currentPage === totalPages(filteredUsers)}
                            className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {filteredUsers.length === 0 && (
                      <div className="p-12 text-center">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No users found</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Materials Tab */}
          {activeTab === 'materials' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Materials Management</h2>
              </div>

              {/* Search */}
              <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search materials..."
                    value={materialSearch}
                    onChange={(e) => setMaterialSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Materials Grid */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading materials...</p>
                  </div>
                ) : (
                  <>
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coach</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                          <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {getPaginatedData(filteredMaterials).map(m => (
                          <tr key={m.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="w-16 h-12 rounded bg-gray-200 overflow-hidden flex-shrink-0">
                                  {m.thumbnailUrl ? (
                                    <img
                                      src={getAssetUrl(m.thumbnailUrl)}
                                      alt={m.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                      <BookOpen className="w-6 h-6 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="font-medium text-gray-900">{m.title}</div>
                                  <div className="text-sm text-gray-500 truncate max-w-xs">
                                    {m.description?.substring(0, 50)}...
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {m.contentType}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {m.coachName || 'Unknown'}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              ${m.price?.toFixed(2) || '0.00'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 ml-2">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {filteredMaterials.length === 0 && (
                      <div className="p-12 text-center">
                        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No materials found</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Events Tab (Coming Soon) */}
          {activeTab === 'events' && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Events Management</h3>
              <p className="text-gray-500">Coming soon. Manage tournaments, workshops, and events.</p>
            </div>
          )}

          {/* Transactions Tab (Coming Soon) */}
          {activeTab === 'transactions' && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Transactions Management</h3>
              <p className="text-gray-500">Coming soon. View and manage all payment transactions.</p>
            </div>
          )}
        </div>
      </div>

      {/* User Edit Modal */}
      {isUserModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setIsUserModalOpen(false)}
            />

            <div className="relative inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="flex justify-between items-center px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
                <button
                  onClick={() => setIsUserModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-4 space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
                    {selectedUser.profileImageUrl ? (
                      <img
                        src={getAssetUrl(selectedUser.profileImageUrl)}
                        alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-medium">
                        {(selectedUser.firstName?.[0] || '') + (selectedUser.lastName?.[0] || '')}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedUser.email}</p>
                    <p className="text-sm text-gray-500">ID: {selectedUser.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={selectedUser.firstName || ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={selectedUser.lastName || ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={selectedUser.role || 'Student'}
                    onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Student">Student</option>
                    <option value="Coach">Coach</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Account Status</label>
                  <button
                    type="button"
                    onClick={() => setSelectedUser({ ...selectedUser, isActive: !selectedUser.isActive })}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      selectedUser.isActive ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        selectedUser.isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                <button
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUser}
                  disabled={savingUser}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {savingUser ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
