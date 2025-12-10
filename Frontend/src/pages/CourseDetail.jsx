import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { courseApi, getAssetUrl } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import {
  BookOpen, Play, Lock, Check, DollarSign, ArrowLeft,
  User, Clock, Video, ExternalLink, Loader2
} from 'lucide-react'
import StarRating from '../components/StarRating'

const CourseDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [hasPurchased, setHasPurchased] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState(null)

  useEffect(() => {
    loadCourse()
  }, [id, user])

  const loadCourse = async () => {
    try {
      setLoading(true)
      const data = await courseApi.getCourse(id)
      setCourse(data)

      // Check if purchased
      if (user) {
        try {
          const purchased = await courseApi.hasPurchased(id)
          setHasPurchased(purchased)
        } catch (e) {
          console.error('Error checking purchase status:', e)
        }
      }
    } catch (error) {
      console.error('Failed to load course:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async () => {
    if (!user) {
      alert('Please log in to purchase this course')
      return
    }

    setPurchasing(true)
    try {
      await courseApi.purchaseCourse(id)
      setHasPurchased(true)
      alert('Course purchased successfully! You now have access to all materials.')
      loadCourse() // Reload to get full content
    } catch (error) {
      alert('Purchase failed: ' + (error.message || 'Unknown error'))
    } finally {
      setPurchasing(false)
    }
  }

  const canViewMaterial = (material) => {
    return material.isPreview || hasPurchased || course?.coachId === user?.id
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Course Not Found</h2>
          <button
            onClick={() => navigate('/marketplace')}
            className="text-primary-600 hover:text-primary-700"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate('/marketplace')}
            className="flex items-center text-indigo-200 hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </button>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Course Thumbnail */}
            <div className="md:w-1/3">
              {course.thumbnailUrl ? (
                <img
                  src={getAssetUrl(course.thumbnailUrl)}
                  alt={course.title}
                  className="w-full rounded-lg shadow-lg"
                />
              ) : (
                <div className="w-full aspect-video bg-indigo-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-indigo-300" />
                </div>
              )}
            </div>

            {/* Course Info */}
            <div className="md:w-2/3">
              <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
              <p className="text-indigo-100 mb-6">{course.description}</p>

              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  <span>{course.coach?.firstName} {course.coach?.lastName}</span>
                </div>
                <div className="flex items-center">
                  <Video className="w-5 h-5 mr-2" />
                  <span>{course.materialCount || course.materials?.length || 0} lessons</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold">${course.price?.toFixed(2)}</span>

                {hasPurchased ? (
                  <span className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg">
                    <Check className="w-5 h-5 mr-2" />
                    Purchased
                  </span>
                ) : (
                  <button
                    onClick={handlePurchase}
                    disabled={purchasing || !user}
                    className="flex items-center px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 disabled:bg-gray-200 disabled:text-gray-500 transition-colors"
                  >
                    {purchasing ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <DollarSign className="w-5 h-5 mr-2" />
                    )}
                    {user ? 'Enroll Now' : 'Login to Enroll'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Materials List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Course Content</h2>

              {course.materials && course.materials.length > 0 ? (
                <div className="space-y-2">
                  {course.materials.map((cm, index) => {
                    const canView = canViewMaterial(cm)
                    return (
                      <button
                        key={cm.id}
                        onClick={() => canView && setSelectedMaterial(cm)}
                        disabled={!canView}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedMaterial?.id === cm.id
                            ? 'bg-indigo-100 border-2 border-indigo-500'
                            : canView
                            ? 'bg-gray-50 hover:bg-gray-100'
                            : 'bg-gray-50 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center mr-3">
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">
                                {cm.material?.title}
                              </p>
                              <p className="text-xs text-gray-500 capitalize">
                                {cm.material?.contentType}
                              </p>
                            </div>
                          </div>
                          {cm.isPreview ? (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                              Preview
                            </span>
                          ) : !canView ? (
                            <Lock className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Play className="w-4 h-4 text-indigo-600" />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No materials yet</p>
              )}

              {!hasPurchased && course.materials?.some(m => !m.isPreview) && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <Lock className="w-4 h-4 inline mr-1" />
                    Purchase this course to unlock all {course.materials.filter(m => !m.isPreview).length} locked lessons
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Material Viewer */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              {selectedMaterial ? (
                <div>
                  {/* Video Player or Content */}
                  {selectedMaterial.material?.videoUrl ? (
                    <div className="aspect-video bg-black rounded-t-lg">
                      <video
                        src={getAssetUrl(selectedMaterial.material.videoUrl)}
                        controls
                        className="w-full h-full rounded-t-lg"
                      />
                    </div>
                  ) : selectedMaterial.material?.externalLink ? (
                    <div className="aspect-video bg-gray-100 rounded-t-lg flex items-center justify-center">
                      <a
                        href={selectedMaterial.material.externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        <ExternalLink className="w-5 h-5 mr-2" />
                        Open External Content
                      </a>
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-100 rounded-t-lg flex items-center justify-center">
                      <Video className="w-16 h-16 text-gray-300" />
                    </div>
                  )}

                  {/* Material Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {selectedMaterial.material?.title}
                    </h3>
                    <p className="text-gray-600">
                      {selectedMaterial.material?.description}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="aspect-video flex items-center justify-center bg-gray-100 rounded-lg">
                  <div className="text-center text-gray-500">
                    <Play className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Select a lesson to start learning</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseDetail
