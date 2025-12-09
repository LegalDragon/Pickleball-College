import { useState, useEffect } from 'react'
import { materialApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Search, Filter, Play, DollarSign } from 'lucide-react'

const Marketplace = () => {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    loadMaterials()
  }, [])

  const loadMaterials = async () => {
    try {
      const data = await materialApi.getMaterials()
      setMaterials(data)
    } catch (error) {
      console.error('Failed to load materials:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMaterials = materials.filter(material =>
    material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.coach.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.coach.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handlePurchase = async (materialId) => {
    if (!user) {
      alert('Please log in to purchase materials')
      return
    }

    try {
      const result = await materialApi.purchaseMaterial(materialId)
      // In a real app, you'd integrate with Stripe.js here
      alert('Purchase initiated! Check console for payment details.')
      console.log('Purchase result:', result)
    } catch (error) {
      alert('Purchase failed: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Training Materials Marketplace</h1>
          <p className="mt-4 text-lg text-gray-600">
            Discover expert pickleball training materials from certified coaches
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search materials, coaches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </button>
          </div>
        </div>

        {/* Materials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((material) => (
            <div key={material.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gray-200 relative">
                {material.thumbnailUrl ? (
                  <img
                    src={material.thumbnailUrl}
                    alt={material.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
                    <Play className="w-12 h-12 text-primary-500" />
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-primary-500 text-white px-2 py-1 rounded text-sm font-medium">
                  ${material.price}
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{material.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{material.description}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-2">
                      <span className="text-sm font-medium text-gray-600">
                        {material.coach.firstName[0]}{material.coach.lastName[0]}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {material.coach.firstName} {material.coach.lastName}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 capitalize">{material.contentType}</span>
                </div>

                <button
                  onClick={() => handlePurchase(material.id)}
                  disabled={!user}
                  className="w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  {user ? 'Purchase Now' : 'Login to Purchase'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredMaterials.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No materials found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Marketplace