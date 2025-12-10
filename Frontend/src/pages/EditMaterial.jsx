import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useParams, useNavigate } from 'react-router-dom'
import { materialApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Upload, Video, Image, FileText, Link, ArrowLeft } from 'lucide-react'

const EditMaterial = () => {
  const [videoFile, setVideoFile] = useState(null)
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [documentFile, setDocumentFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [loadingMaterial, setLoadingMaterial] = useState(true)
  const [currentMaterial, setCurrentMaterial] = useState(null)
  
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()

  const { register, handleSubmit, formState: { errors }, watch, reset, setValue } = useForm({
    defaultValues: {
      title: '',
      description: '',
      contentType: 'Video',
      externalLink: '',
      price: 0
    }
  })

  const contentType = watch('contentType')

  useEffect(() => {
    loadMaterial()
  }, [id])

  const loadMaterial = async () => {
    if (!user) {
      alert('Please log in to edit materials')
      navigate('/login')
      return
    }

    try {
      setLoadingMaterial(true)
      const response = await materialApi.getMaterial(id)

      console.log('EditMaterial - API response:', response)

      // Handle various API response structures
      let material = null

      // Check if response has nested data property (ApiResponse wrapper)
      if (response && typeof response === 'object') {
        if (response.data && typeof response.data === 'object' && (response.data.id || response.data.Id)) {
          // Wrapped: { success: true, data: { id, title, ... } }
          material = response.data
        } else if (response.id || response.Id) {
          // Direct object: { id, title, ... }
          material = response
        } else if (response.success === false) {
          throw new Error(response.message || 'Failed to load material')
        }
      }

      console.log('EditMaterial - Extracted material:', material)

      if (!material) {
        throw new Error('Material not found or invalid response format')
      }

      // Check authorization - handle both coachId and CoachId (case variations)
      const materialCoachId = material.coachId || material.CoachId
      console.log('EditMaterial - Coach ID check:', materialCoachId, 'vs user.id:', user.id)

      if (materialCoachId && materialCoachId !== user.id && user.role !== 'Admin') {
        alert('You are not authorized to edit this material')
        navigate('/coach/dashboard')
        return
      }

      setCurrentMaterial(material)

      // Reset form with material data
      reset({
        title: material.title || material.Title || '',
        description: material.description || material.Description || '',
        contentType: material.contentType || material.ContentType || 'Video',
        externalLink: material.externalLink || material.ExternalLink || '',
        price: material.price ?? material.Price ?? 0
      })

    } catch (error) {
      console.error('Failed to load material:', error)
      alert('Failed to load material: ' + (error.message || 'Unknown error'))
      navigate('/coach/dashboard')
    } finally {
      setLoadingMaterial(false)
    }
  }

  const isValidUrl = (url) => {
    try {
      new URL(url)
      return true
    } catch (err) {
      return false
    }
  }

  const onSubmit = async (data) => {
    if (!user) {
      alert('Please log in to edit materials')
      return
    }

    // Validate file uploads based on content type
    if (contentType !== 'Link') {
      // Check if we have existing files or new uploads
      const hasExistingFile = currentMaterial?.videoFile || currentMaterial?.thumbnailFile || currentMaterial?.documentFile
      const hasNewFile = videoFile || thumbnailFile || documentFile
      
      if (!hasExistingFile && !hasNewFile) {
        if (contentType === 'Video') {
          alert('Please upload a video file for Video content')
          return
        }
        if (contentType === 'Image') {
          alert('Please upload an image file for Image content')
          return
        }
        if (contentType === 'Document') {
          alert('Please upload a document file for Document content')
          return
        }
      }
    }

    // Validate external link if Link type
    if (contentType === 'Link') {
      if (!data.externalLink) {
        alert('Please provide an external link for Link content')
        return
      }
      if (!isValidUrl(data.externalLink)) {
        alert('Please enter a valid URL')
        return
      }
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('title', data.title)
      formData.append('description', data.description)
      formData.append('contentType', data.contentType)
      formData.append('externalLink', data.externalLink || '')
      formData.append('price', data.price.toString())

      if (videoFile) {
        formData.append('videoFile', videoFile)
      }

      if (thumbnailFile) {
        formData.append('thumbnailFile', thumbnailFile)
      }

      if (documentFile) {
        formData.append('documentFile', documentFile)
      }

      await materialApi.updateMaterial(id, formData)
      alert('Material updated successfully!')
      navigate('/coach/dashboard')
    } catch (error) {
      alert('Failed to update material: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'Video': return <Video className="w-5 h-5" />
      case 'Image': return <Image className="w-5 h-5" />
      case 'Document': return <FileText className="w-5 h-5" />
      case 'Link': return <Link className="w-5 h-5" />
      default: return <Video className="w-5 h-5" />
    }
  }

  const renderFileUpload = () => {
    switch (contentType) {
      case 'Video':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video File {currentMaterial?.videoFile ? '(Current file uploaded)' : '*'}
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="hidden"
                id="video-upload"
              />
              <label htmlFor="video-upload" className="cursor-pointer">
                <span className="text-primary-600 hover:text-primary-700 font-medium">
                  {videoFile ? 'Change video file' : currentMaterial?.videoFile ? 'Replace video file' : 'Choose video file'}
                </span>
              </label>
              {videoFile ? (
                <p className="mt-2 text-sm text-gray-600">{videoFile.name}</p>
              ) : currentMaterial?.videoFile ? (
                <p className="mt-2 text-sm text-gray-600">Current: {currentMaterial.videoFile}</p>
              ) : null}
              <p className="mt-1 text-xs text-gray-500">
                {currentMaterial?.videoFile ? 'Optional - leave blank to keep current file' : 'Required for video content'}
              </p>
            </div>
          </div>
        )
      
      case 'Image':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image File {currentMaterial?.thumbnailFile ? '(Current file uploaded)' : '*'}
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <span className="text-primary-600 hover:text-primary-700 font-medium">
                  {thumbnailFile ? 'Change image file' : currentMaterial?.thumbnailFile ? 'Replace image file' : 'Choose image file'}
                </span>
              </label>
              {thumbnailFile ? (
                <p className="mt-2 text-sm text-gray-600">{thumbnailFile.name}</p>
              ) : currentMaterial?.thumbnailFile ? (
                <p className="mt-2 text-sm text-gray-600">Current: {currentMaterial.thumbnailFile}</p>
              ) : null}
              <p className="mt-1 text-xs text-gray-500">
                {currentMaterial?.thumbnailFile ? 'Optional - leave blank to keep current file' : 'Required for image content'}
              </p>
            </div>
          </div>
        )
      
      case 'Document':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document File {currentMaterial?.documentFile ? '(Current file uploaded)' : '*'}
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                className="hidden"
                id="document-upload"
              />
              <label htmlFor="document-upload" className="cursor-pointer">
                <span className="text-primary-600 hover:text-primary-700 font-medium">
                  {documentFile ? 'Change document file' : currentMaterial?.documentFile ? 'Replace document file' : 'Choose document file'}
                </span>
              </label>
              {documentFile ? (
                <p className="mt-2 text-sm text-gray-600">{documentFile.name}</p>
              ) : currentMaterial?.documentFile ? (
                <p className="mt-2 text-sm text-gray-600">Current: {currentMaterial.documentFile}</p>
              ) : null}
              <p className="mt-1 text-xs text-gray-500">
                {currentMaterial?.documentFile ? 'Optional - leave blank to keep current file' : 'Required for document content'}
              </p>
            </div>
          </div>
        )
      
      case 'Link':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              External Link *
            </label>
            <div className="flex items-center mb-2 text-sm text-gray-500">
              <Link className="w-5 h-5 mr-2" />
              <span>Paste YouTube, TikTok, or other video links</span>
            </div>
            <input
              {...register('externalLink', { 
                required: contentType === 'Link' ? 'External link is required' : false,
                validate: (value) => {
                  if (contentType === 'Link' && value && !isValidUrl(value)) {
                    return 'Please enter a valid URL'
                  }
                  return true
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="https://www.youtube.com/watch?v=..."
            />
            {errors.externalLink && (
              <p className="mt-1 text-sm text-red-600">{errors.externalLink.message}</p>
            )}
          </div>
        )
      
      default:
        return null
    }
  }

  if (loadingMaterial) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading material...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Back button */}
          <button
            onClick={() => navigate('/coach/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Training Material</h1>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  {...register('title', { required: 'Title is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter material title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  {...register('description', { required: 'Description is required' })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Describe your training material"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>
            </div>

            {/* Content Type and Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Type *
                </label>
                <select
                  {...register('contentType', { required: 'Content type is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="Video">Video</option>
                  <option value="Image">Image</option>
                  <option value="Document">Document</option>
                  <option value="Link">External Link</option>
                </select>
                {errors.contentType && (
                  <p className="mt-1 text-sm text-red-600">{errors.contentType.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('price', { 
                    required: 'Price is required',
                    min: { value: 0, message: 'Price must be positive' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                )}
              </div>
            </div>

            {/* Content Type Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-4">
                {getContentTypeIcon(contentType)}
                <span className="ml-2 text-lg font-medium text-gray-900 capitalize">
                  {contentType === 'Link' ? 'External Link' : contentType} Content
                </span>
              </div>
              
              {renderFileUpload()}
            </div>

            {/* Optional Thumbnail Upload (only if not Image type) */}
            {contentType !== 'Image' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thumbnail Image (Optional) {currentMaterial?.thumbnailFile && contentType !== 'Image' ? '(Current file uploaded)' : ''}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="thumbnail-upload"
                  />
                  <label htmlFor="thumbnail-upload" className="cursor-pointer">
                    <span className="text-primary-600 hover:text-primary-700 font-medium">
                      {thumbnailFile ? 'Change thumbnail' : currentMaterial?.thumbnailFile ? 'Replace thumbnail' : 'Choose thumbnail'}
                    </span>
                  </label>
                  {thumbnailFile ? (
                    <p className="mt-2 text-sm text-gray-600">{thumbnailFile.name}</p>
                  ) : currentMaterial?.thumbnailFile && contentType !== 'Image' ? (
                    <p className="mt-2 text-sm text-gray-600">Current: {currentMaterial.thumbnailFile}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-gray-500">
                    Recommended for better presentation
                  </p>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/coach/dashboard')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <div className="space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this material? This action cannot be undone.')) {
                      handleDelete()
                    }
                  }}
                  className="px-6 py-3 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-primary-500 text-white px-6 py-3 rounded-md hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    'Update Material'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this material? This action cannot be undone.')) {
      return
    }

    try {
      setUploading(true)
      await materialApi.deleteMaterial(id)
      alert('Material deleted successfully!')
      navigate('/coach/dashboard')
    } catch (error) {
      alert('Failed to delete material: ' + error.message)
      setUploading(false)
    }
  }
}

export default EditMaterial