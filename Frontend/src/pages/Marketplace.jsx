import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { materialApi, courseApi, ratingApi, coachApi, videoReviewApi, sessionApi, assetApi, getAssetUrl } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Search, Filter, Play, DollarSign, BookOpen, Video, Users, Upload, Clock, X, Loader2 } from 'lucide-react'
import StarRating from '../components/StarRating'
import MockPaymentModal from '../components/MockPaymentModal'

const Marketplace = () => {
  const [materials, setMaterials] = useState([])
  const [courses, setCourses] = useState([])
  const [coaches, setCoaches] = useState([])
  const [materialRatings, setMaterialRatings] = useState({})
  const [courseRatings, setCourseRatings] = useState({})
  const [coachRatings, setCoachRatings] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('courses') // 'courses', 'materials', 'coaches', or 'reviews'
  const { user } = useAuth()
  const navigate = useNavigate()

  // Purchase modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)

  // Session request modal state
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [selectedCoach, setSelectedCoach] = useState(null)

  // Video review modal state
  const [showVideoUploadModal, setShowVideoUploadModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load courses, materials, and coaches in parallel
      const [coursesData, materialsData, coachesData] = await Promise.all([
        courseApi.getCourses(),
        materialApi.getMaterials(),
        coachApi.getCoaches()
      ])

      setCourses(Array.isArray(coursesData) ? coursesData : [])
      setMaterials(Array.isArray(materialsData) ? materialsData : [])
      setCoaches(Array.isArray(coachesData) ? coachesData : [])

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

      // Load rating summaries for coaches
      if (coachesData?.length > 0) {
        try {
          const coachIds = coachesData.map(c => c.id)
          const summaries = await ratingApi.getSummaries('Coach', coachIds)
          setCoachRatings(summaries || {})
        } catch (error) {
          console.error('Failed to load coach ratings:', error)
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

  const filteredCoaches = coaches.filter(coach =>
    coach.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coach.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coach.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coach.coachProfile?.certificationLevel?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleRequestSession = (coach) => {
    if (!user) {
      alert('Please log in to request a session')
      return
    }
    setSelectedCoach(coach)
    setShowSessionModal(true)
  }

  const handleRequestVideoReview = () => {
    if (!user) {
      alert('Please log in to request a video review')
      return
    }
    setShowVideoUploadModal(true)
  }

  const handlePurchaseMaterial = (e, material) => {
    e.stopPropagation()
    if (!user) {
      alert('Please log in to purchase materials')
      return
    }

    setSelectedItem({
      type: 'material',
      id: material.id,
      name: material.title,
      price: material.price,
      coachName: `${material.coach?.firstName || ''} ${material.coach?.lastName || ''}`
    })
    setShowPaymentModal(true)
  }

  const handlePurchaseCourse = (e, course) => {
    e.stopPropagation()
    if (!user) {
      alert('Please log in to purchase courses')
      return
    }

    setSelectedItem({
      type: 'course',
      id: course.id,
      name: course.title,
      price: course.price,
      coachName: `${course.coach?.firstName || ''} ${course.coach?.lastName || ''}`
    })
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = async () => {
    if (!selectedItem) return

    try {
      if (selectedItem.type === 'course') {
        await courseApi.purchaseCourse(selectedItem.id)
      } else {
        await materialApi.purchaseMaterial(selectedItem.id)
      }

      // Navigate on success
      setShowPaymentModal(false)
      setSelectedItem(null)
      if (selectedItem.type === 'course') {
        navigate(`/courses/${selectedItem.id}`)
      } else {
        navigate(`/student/dashboard`)
      }
    } catch (error) {
      console.error('Purchase failed:', error)
      setShowPaymentModal(false)

      // Check if it's "already purchased" error - navigate anyway
      const errorMsg = typeof error === 'string' ? error : error?.message || ''
      if (errorMsg.toLowerCase().includes('already purchased') || errorMsg.toLowerCase().includes('already owns')) {
        if (selectedItem.type === 'course') {
          navigate(`/courses/${selectedItem.id}`)
        } else {
          navigate(`/student/dashboard`)
        }
      } else {
        alert('Purchase failed: ' + (errorMsg || 'Please try again'))
      }
      setSelectedItem(null)
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
          <div className="inline-flex bg-gray-100 rounded-lg p-1 flex-wrap gap-1">
            <button
              onClick={() => setActiveTab('courses')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
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
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'materials'
                  ? 'bg-white text-primary-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Video className="w-4 h-4 mr-2" />
              Materials ({materials.length})
            </button>
            <button
              onClick={() => setActiveTab('coaches')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'coaches'
                  ? 'bg-white text-primary-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              Coaches ({coaches.length})
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'reviews'
                  ? 'bg-white text-primary-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Upload className="w-4 h-4 mr-2" />
              Video Reviews
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
                        onClick={(e) => handlePurchaseCourse(e, course)}
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
                        onClick={(e) => handlePurchaseMaterial(e, material)}
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

        {/* Coaches Grid */}
        {activeTab === 'coaches' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCoaches.map((coach) => {
                const rating = coachRatings[coach.id]
                return (
                  <div
                    key={coach.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        {coach.profileImageUrl ? (
                          <img
                            src={getAssetUrl(coach.profileImageUrl)}
                            alt={`${coach.firstName} ${coach.lastName}`}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                            <Users className="w-8 h-8 text-primary-600" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {coach.firstName} {coach.lastName}
                          </h3>
                          {coach.coachProfile?.certificationLevel && (
                            <p className="text-sm text-gray-500">{coach.coachProfile.certificationLevel}</p>
                          )}
                        </div>
                      </div>

                      {coach.bio && (
                        <p className="text-gray-600 mb-4 line-clamp-2">{coach.bio}</p>
                      )}

                      {/* Rating */}
                      <div className="flex items-center mb-4">
                        <StarRating
                          rating={rating?.averageRating || 0}
                          size={16}
                          showValue
                          totalRatings={rating?.totalRatings}
                        />
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        {coach.coachProfile?.hourlyRate ? (
                          <span className="text-lg font-bold text-primary-600">
                            ${coach.coachProfile.hourlyRate}/hr
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">Rate not set</span>
                        )}
                        <span className="text-sm text-gray-500">
                          {coach.coachProfile?.yearsExperience ? `${coach.coachProfile.yearsExperience} years exp.` : ''}
                        </span>
                      </div>

                      <button
                        onClick={() => handleRequestSession(coach)}
                        disabled={!user}
                        className="w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        {user ? 'Request Session' : 'Login to Request'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {filteredCoaches.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No coaches found matching your search.</p>
              </div>
            )}
          </>
        )}

        {/* Video Reviews Section */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-8">
              <Upload className="w-16 h-16 text-primary-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Get Expert Video Feedback</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Upload your pickleball gameplay video and get personalized feedback from our certified coaches.
                Improve your technique, strategy, and overall game with professional analysis.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">1. Upload Video</h3>
                <p className="text-sm text-gray-600">Upload your gameplay video or provide a link</p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">2. Coach Reviews</h3>
                <p className="text-sm text-gray-600">Certified coaches analyze your technique</p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Video className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">3. Get Feedback</h3>
                <p className="text-sm text-gray-600">Receive detailed feedback and improvement tips</p>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={handleRequestVideoReview}
                disabled={!user}
                className="px-8 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors inline-flex items-center"
              >
                <Upload className="w-5 h-5 mr-2" />
                {user ? 'Request Video Review' : 'Login to Request Review'}
              </button>
              {!user && (
                <p className="text-sm text-gray-500 mt-2">Please log in to submit a video for review</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <MockPaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false)
          setSelectedItem(null)
        }}
        onSuccess={handlePaymentSuccess}
        itemName={selectedItem?.name}
        itemType={selectedItem?.type}
        price={selectedItem?.price}
        coachName={selectedItem?.coachName}
      />

      {/* Session Request Modal */}
      {showSessionModal && selectedCoach && (
        <SessionRequestModal
          coach={selectedCoach}
          onClose={() => {
            setShowSessionModal(false)
            setSelectedCoach(null)
          }}
          onSuccess={() => {
            setShowSessionModal(false)
            setSelectedCoach(null)
            alert('Session request sent! Check your dashboard to track its status.')
          }}
        />
      )}

      {/* Video Upload Modal */}
      {showVideoUploadModal && (
        <VideoUploadModal
          coaches={coaches}
          onClose={() => setShowVideoUploadModal(false)}
          onSuccess={() => {
            setShowVideoUploadModal(false)
            alert('Video review request submitted! Check your dashboard to track its status.')
          }}
        />
      )}
    </div>
  )
}

// Session Request Modal
const SessionRequestModal = ({ coach, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    sessionType: 'Online',
    requestedAt: '',
    durationMinutes: 60,
    notes: '',
    preferredLocation: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await sessionApi.requestSession({
        coachId: coach.id,
        sessionType: formData.sessionType,
        requestedAt: new Date(formData.requestedAt).toISOString(),
        durationMinutes: formData.durationMinutes,
        notes: formData.sessionType === 'InPerson' && formData.preferredLocation
          ? `Preferred location: ${formData.preferredLocation}${formData.notes ? '. ' + formData.notes : ''}`
          : formData.notes
      })
      onSuccess()
    } catch (error) {
      alert('Failed to request session: ' + (error.message || 'Unknown error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Request Session with {coach.firstName}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
            <select
              value={formData.sessionType}
              onChange={(e) => setFormData({ ...formData, sessionType: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="Online">Online (Video Call)</option>
              <option value="InPerson">In Person</option>
            </select>
          </div>

          {formData.sessionType === 'InPerson' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Location</label>
              <input
                type="text"
                value={formData.preferredLocation}
                onChange={(e) => setFormData({ ...formData, preferredLocation: e.target.value })}
                placeholder="e.g., Local pickleball courts, your address..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Coach will confirm or suggest an alternative location
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date & Time</label>
            <input
              type="datetime-local"
              value={formData.requestedAt}
              onChange={(e) => setFormData({ ...formData, requestedAt: e.target.value })}
              required
              min={new Date().toISOString().slice(0, 16)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
            <select
              value={formData.durationMinutes}
              onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Any specific topics or areas you'd like to focus on?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          {coach.coachProfile?.hourlyRate && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                Estimated cost: <span className="font-bold text-primary-600">
                  ${(coach.coachProfile.hourlyRate * formData.durationMinutes / 60).toFixed(2)}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Based on ${coach.coachProfile.hourlyRate}/hour rate
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center"
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send Request
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Video Upload Modal
const VideoUploadModal = ({ coaches, onClose, onSuccess }) => {
  const [videoMode, setVideoMode] = useState('link')
  const [formData, setFormData] = useState({
    coachId: '',
    title: '',
    description: '',
    videoUrl: '',
    externalVideoLink: '',
    offeredPrice: 25
  })
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const response = await assetApi.upload(file, 'videos')
      if (response.success && response.data?.url) {
        setFormData({ ...formData, videoUrl: response.data.url, externalVideoLink: '' })
      }
    } catch (error) {
      alert('Failed to upload video: ' + (error.message || 'Unknown error'))
    } finally {
      setUploading(false)
    }
  }

  const hasVideo = formData.videoUrl || formData.externalVideoLink

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!hasVideo) {
      alert('Please provide a video (upload or link)')
      return
    }

    setSubmitting(true)
    try {
      await videoReviewApi.createRequest({
        title: formData.title,
        description: formData.description,
        videoUrl: formData.videoUrl || null,
        externalVideoLink: formData.externalVideoLink || null,
        offeredPrice: formData.offeredPrice,
        coachId: formData.coachId ? Number(formData.coachId) : null
      })
      onSuccess()
    } catch (error) {
      alert('Failed to create request: ' + (error.message || 'Unknown error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Request Video Review</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="e.g., My serve technique"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="What would you like feedback on?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Video Source</label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setVideoMode('link')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                  videoMode === 'link'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Paste Link
              </button>
              <button
                type="button"
                onClick={() => setVideoMode('upload')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                  videoMode === 'upload'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Upload File
              </button>
            </div>

            {videoMode === 'link' ? (
              <input
                type="url"
                value={formData.externalVideoLink}
                onChange={(e) => setFormData({ ...formData, externalVideoLink: e.target.value, videoUrl: '' })}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            ) : (
              <div>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="w-full"
                />
                {uploading && (
                  <p className="text-sm text-gray-500 mt-1 flex items-center">
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Uploading...
                  </p>
                )}
                {formData.videoUrl && (
                  <p className="text-sm text-green-600 mt-1">Video uploaded successfully</p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Request Specific Coach (Optional)
            </label>
            <select
              value={formData.coachId}
              onChange={(e) => setFormData({ ...formData, coachId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Open to all coaches</option>
              {coaches.map(coach => (
                <option key={coach.id} value={coach.id}>
                  {coach.firstName} {coach.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Offered Price ($)
            </label>
            <input
              type="number"
              value={formData.offeredPrice}
              onChange={(e) => setFormData({ ...formData, offeredPrice: Number(e.target.value) })}
              min={5}
              step={5}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Coaches may propose a different price
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !hasVideo}
              className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center"
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Marketplace
