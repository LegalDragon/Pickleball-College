import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { materialApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Video, Image, FileText, Link, ArrowLeft } from 'lucide-react'

const MaterialDetail = () => {
  const [material, setMaterial] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()

  useEffect(() => {
    loadMaterial()
  }, [id])

  const loadMaterial = async () => {
    try {
      setLoading(true)
      const response = await materialApi.getMaterial(id)

      console.log('MaterialDetail - API response:', response)

      // Handle various API response structures
      let materialData = null

      if (response && typeof response === 'object') {
        if (response.data && typeof response.data === 'object' && (response.data.id || response.data.Id)) {
          // Wrapped: { success: true, data: { id, title, ... } }
          materialData = response.data
        } else if (response.id || response.Id) {
          // Direct object: { id, title, ... }
          materialData = response
        } else if (response.success === false) {
          throw new Error(response.message || 'Failed to load material')
        }
      }

      console.log('MaterialDetail - Extracted material:', materialData)

      if (!materialData) {
        throw new Error('Material not found')
      }

      setMaterial(materialData)
    } catch (error) {
      console.error('Failed to load material:', error)
      alert('Failed to load material: ' + (error.message || 'Unknown error'))
      navigate('/coach/dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading material...</p>
        </div>
      </div>
    )
  }

  if (!material) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Material Not Found</h3>
          <button
            onClick={() => navigate('/coach/dashboard')}
            className="text-primary-600 hover:text-primary-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'Video': return <Video className="w-6 h-6" />
      case 'Image': return <Image className="w-6 h-6" />
      case 'Document': return <FileText className="w-6 h-6" />
      case 'Link': return <Link className="w-6 h-6" />
      default: return <Video className="w-6 h-6" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/coach/dashboard')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{material.title || material.Title || 'Untitled'}</h1>
                <div className="flex items-center mt-2">
                  {getContentTypeIcon(material.contentType || material.ContentType)}
                  <span className="ml-2 text-sm text-gray-500 capitalize">
                    {material.contentType || material.ContentType || 'Unknown'} • ${(material.price ?? material.Price ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>
              {user?.id === (material.coachId || material.CoachId) && (
                <button
                  onClick={() => navigate(`/coach/materials/edit/${material.id || material._id}`)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  Edit Material
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{material.description || material.Description || 'No description'}</p>
            </div>

            {/* Content Preview */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Content</h2>
              {(material.contentType || material.ContentType) === 'Link' && (material.externalLink || material.ExternalLink) ? (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Link className="w-5 h-5 mr-2 text-gray-500" />
                    <a
                      href={material.externalLink || material.ExternalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 break-all"
                    >
                      {material.externalLink || material.ExternalLink}
                    </a>
                  </div>
                  <p className="text-sm text-gray-500">Click to open external link</p>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="flex items-center justify-center mb-4">
                    {getContentTypeIcon(material.contentType || material.ContentType)}
                    <span className="ml-2 text-gray-700">Content uploaded as file</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {(material.contentType || material.ContentType) === 'Video' && 'Video file is available for students'}
                    {(material.contentType || material.ContentType) === 'Image' && 'Image file is available for students'}
                    {(material.contentType || material.ContentType) === 'Document' && 'Document file is available for students'}
                  </p>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Purchases</p>
                <p className="text-xl font-bold text-gray-900">{material.purchases || material.Purchases || 0}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Created</p>
                <p className="text-lg font-medium text-gray-900">
                  {(material.createdAt || material.CreatedAt) ? new Date(material.createdAt || material.CreatedAt).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MaterialDetail