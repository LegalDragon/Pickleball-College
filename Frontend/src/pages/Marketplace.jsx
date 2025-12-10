import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { materialApi, courseApi, ratingApi, getAssetUrl } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Search, Filter, Play, DollarSign, BookOpen, Video } from 'lucide-react'
import StarRating from '../components/StarRating'

const Marketplace = () => {
  const [materials, setMaterials] = useState([])
  const [courses, setCourses] = useState([])
  const [materialRatings, setMaterialRatings] = useState({})
  const [courseRatings, setCourseRatings] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('courses') // 'courses' or 'materials'
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load both courses and materials in parallel
      const [coursesData, materialsData] = await Promise.all([
        courseApi.getCourses(),
        materialApi.getMaterials()
      ])

      setCourses(Array.isArray(coursesData) ? coursesData : [])
      setMaterials(Array.isArray(materialsData) ? materialsData : [])

      // Load rating summaries for courses
      if (coursesData?.length > 0) {
        try {
          const courseIds = coursesData.map(c => c.id)
          const summaries = await ratingApi.getSummaries('Course', courseIds)
          setCourseRatings(summaries || {})
        } catch (error) {
          console.error('Failed to load course ratings:', error)
        }
      }

      // Load rating summaries for materials
      if (materialsData?.length > 0) {
        try {
          const materialIds = materialsData.map(m => m.id)
          const summaries = await ratingApi.getSummaries('Material', materialIds)
          setMaterialRatings(summaries || {})
        } catch (error) {
          console.error('Failed to load material ratings:', error)
        }
      }
    } catch (error) {
      console.error('Failed to load marketplace data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCourses = courses.filter(course =>
    course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.coach?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.coach?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredMaterials = materials.filter(material =>
    material.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.coach?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.coach?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handlePurchaseMaterial = async (e, materialId) => {
    e.stopPropagation()
    if (!user) {
      alert('Please log in to purchase materials')
      return
    }

    try {
      const result = await materialApi.purchaseMaterial(materialId)
      alert('Purchase initiated! Check console for payment details.')
      console.log('Purchase result:', result)
    } catch (error) {
      alert('Purchase failed: ' + error.message)
    }
  }

  const handlePurchaseCourse = async (e, courseId) => {
    e.stopPropagation()
    if (!user) {
      alert('Please log in to purchase courses')
      return
    }

    try {
      const result = await courseApi.purchaseCourse(courseId)
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
          <h1 className="text-3xl font-bold text-gray-900">Pickleball Training Marketplace</h1>
          <p className="mt-4 text-lg text-gray-600">
            Discover expert courses and training materials from certified coaches
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('courses')}
              className={`flex items-center px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'courses'
                  ? 'bg-white text-primary-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Courses ({courses.length})
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`flex items-center px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'materials'
                  ? 'bg-white text-primary-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Video className="w-4 h-4 mr-2" />
              Materials ({materials.length})
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={`Search ${activeTab}, coaches...`}
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

        {/* Courses Grid */}
        {activeTab === 'courses' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => {
                const rating = courseRatings[course.id]
                return (
                  <div
                    key={course.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/courses/${course.id}`)}
                  >
                    <div className="h-48 bg-gray-200 relative">
                      {course.thumbnailUrl ? (
                        <img
                          src={getAssetUrl(course.thumbnailUrl)}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-indigo-200">
                          <BookOpen className="w-12 h-12 text-indigo-500" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4 bg-indigo-600 text-white px-2 py-1 rounded text-xs font-medium">
                        COURSE
                      </div>
                      <div className="absolute top-4 right-4 bg-primary-500 text-white px-2 py-1 rounded text-sm font-medium">
                        ${course.price?.toFixed(2) || '0.00'}
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
                      <p className="text-gray-600 mb-3 line-clamp-2">{course.description}</p>

                      {/* Rating */}
                      <div className="flex items-center mb-3">
                        <StarRating
                          rating={rating?.averageRating || 0}
                          size={16}
                          showValue
                          totalRatings={rating?.totalRatings}
                        />
                      </div>

                      {/* Course Info */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-2">
                            <span className="text-sm font-medium text-gray-600">
                              {course.coach?.firstName?.[0] || ''}{course.coach?.lastName?.[0] || ''}
                            </span>
                          </div>
                          <span className="text-sm text-gray-600">
                            {course.coach?.firstName} {course.coach?.lastName}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {course.materialCount || 0} lessons
                        </span>
                      </div>

                      <button
                        onClick={(e) => handlePurchaseCourse(e, course.id)}
                        disabled={!user}
                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        {user ? 'Enroll Now' : 'Login to Enroll'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {filteredCourses.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No courses found matching your search.</p>
              </div>
            )}
          </>
        )}

        {/* Materials Grid */}
        {activeTab === 'materials' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMaterials.map((material) => {
                const rating = materialRatings[material.id]
                return (
                  <div
                    key={material.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/coach/materials/${material.id}`)}
                  >
                    <div className="h-48 bg-gray-200 relative">
                      {material.thumbnailUrl ? (
                        <img
                          src={getAssetUrl(material.thumbnailUrl)}
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
                      <p className="text-gray-600 mb-3 line-clamp-2">{material.description}</p>

                      {/* Rating */}
                      <div className="flex items-center mb-3">
                        <StarRating
                          rating={rating?.averageRating || 0}
                          size={16}
                          showValue
                          totalRatings={rating?.totalRatings}
                        />
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-2">
                            <span className="text-sm font-medium text-gray-600">
                              {material.coach?.firstName?.[0]}{material.coach?.lastName?.[0]}
                            </span>
                          </div>
                          <span className="text-sm text-gray-600">
                            {material.coach?.firstName} {material.coach?.lastName}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500 capitalize">{material.contentType}</span>
                      </div>

                      <button
                        onClick={(e) => handlePurchaseMaterial(e, material.id)}
                        disabled={!user}
                        className="w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        {user ? 'Purchase Now' : 'Login to Purchase'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {filteredMaterials.length === 0 && (
              <div className="text-center py-12">
                <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No materials found matching your search.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Marketplace
