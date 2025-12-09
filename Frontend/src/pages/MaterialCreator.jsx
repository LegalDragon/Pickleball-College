import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { materialApi, assetApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Upload, Video, Image, FileText, Link, Play } from 'lucide-react'
import VideoUploadModal from '../components/ui/VideoUploadModal'

const MaterialCreator = () => {
  const [videoUrl, setVideoUrl] = useState(null)
  const [videoType, setVideoType] = useState(null) // 'url' or 'file'
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(null)
  const [documentFile, setDocumentFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      title: '',
      description: '',
      contentType: 'Video',
      externalLink: '',
      price: 0
    }
  })

  const contentType = watch('contentType')

  // Handle video save from modal
  const handleVideoSave = ({ url, type }) => {
    setVideoUrl(url)
    setVideoType(type)
  }

  // Handle thumbnail selection with preview
  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setThumbnailFile(file)
      setThumbnailPreview(URL.createObjectURL(file))
    }
  }

  const onSubmit = async (data) => {
    if (!user) {
      alert('Please log in to create materials')
      return
    }

    // Validate based on content type
    if (contentType === 'Video' && !videoUrl) {
      alert('Please add a video for Video content')
      return
    }
    if (contentType === 'Image' && !thumbnailFile) {
      alert('Please upload an image file for Image content')
      return
    }
    if (contentType === 'Document' && !documentFile) {
      alert('Please upload a document file for Document content')
      return
    }
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
      formData.append('price', data.price.toString())

      // Handle video URL (from VideoUploadModal)
      if (contentType === 'Video' && videoUrl) {
        formData.append('externalLink', videoUrl)
      } else if (contentType === 'Link') {
        formData.append('externalLink', data.externalLink || '')
      } else {
        formData.append('externalLink', '')
      }

      // Upload thumbnail if provided
      if (thumbnailFile) {
        formData.append('thumbnailFile', thumbnailFile)
      }

      // Upload document if provided
      if (documentFile) {
        formData.append('documentFile', documentFile)
      }

      await materialApi.createMaterial(formData)
      alert('Material created successfully!')
      navigate('/coach/dashboard')
    } catch (error) {
      alert('Failed to create material: ' + error.message)
    } finally {
      setUploading(false)
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

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'Video': return <Video className="w-5 h-5" />
      case 'Image': return <Image className="w-5 h-5" />
      case 'Document': return <FileText className="w-5 h-5" />
      case 'Link': return <Link className="w-5 h-5" />
      default: return <Video className="w-5 h-5" />
    }
  }

  // Check if URL is external (YouTube, etc.)
  const isExternalVideoUrl = (url) => {
    if (!url) return false
    const patterns = ['youtube.com', 'youtu.be', 'tiktok.com', 'vimeo.com']
    return patterns.some(p => url.includes(p))
  }

  // Get YouTube embed URL
  const getVideoEmbedUrl = (url) => {
    if (!url) return null
    if (url.includes('youtube.com/watch')) {
      const videoId = new URL(url).searchParams.get('v')
      return `https://www.youtube.com/embed/${videoId}`
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0]
      return `https://www.youtube.com/embed/${videoId}`
    }
    return null
  }

  const renderFileUpload = () => {
    switch (contentType) {
      case 'Video':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video Content *
            </label>
            {videoUrl ? (
              <div className="relative rounded-lg overflow-hidden bg-gray-100">
                {isExternalVideoUrl(videoUrl) && getVideoEmbedUrl(videoUrl) ? (
                  <iframe
                    src={getVideoEmbedUrl(videoUrl)}
                    className="w-full aspect-video"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : isExternalVideoUrl(videoUrl) ? (
                  <div className="w-full aspect-video flex items-center justify-center bg-gray-200">
                    <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                      <Play className="w-5 h-5 mr-2" />
                      Open Video Link
                    </a>
                  </div>
                ) : (
                  <video src={videoUrl} controls className="w-full aspect-video" />
                )}
                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(true)}
                  className="absolute top-2 right-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  Change Video
                </button>
              </div>
            ) : (
              <div
                onClick={() => setIsVideoModalOpen(true)}
                className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition"
              >
                <Video className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-primary-600 hover:text-primary-700 font-medium">
                  Add Video
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Upload a file or paste a YouTube/TikTok link
                </p>
              </div>
            )}
          </div>
        )
      
      case 'Image':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image File *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                className="hidden"
                id="image-upload"
                required={contentType === 'Image'}
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <span className="text-primary-600 hover:text-primary-700 font-medium">
                  Choose image file
                </span>
              </label>
              {thumbnailFile && (
                <p className="mt-2 text-sm text-gray-600">{thumbnailFile.name}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Required for image content
              </p>
            </div>
          </div>
        )
      
      case 'Document':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document File *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                className="hidden"
                id="document-upload"
                required={contentType === 'Document'}
              />
              <label htmlFor="document-upload" className="cursor-pointer">
                <span className="text-primary-600 hover:text-primary-700 font-medium">
                  Choose document file
                </span>
              </label>
              {documentFile && (
                <p className="mt-2 text-sm text-gray-600">{documentFile.name}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Accepts PDF, Word, PowerPoint, and text files
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Create Training Material</h1>
          
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

            {/* Optional Thumbnail Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thumbnail Image (Optional)
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
                    Choose thumbnail
                  </span>
                </label>
                {thumbnailFile && (
                  <p className="mt-2 text-sm text-gray-600">{thumbnailFile.name}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Recommended for better presentation
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={uploading}
                className="bg-primary-500 text-white px-6 py-3 rounded-md hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Publishing...
                  </>
                ) : (
                  'Publish Material'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Video Upload Modal */}
      <VideoUploadModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onSave={handleVideoSave}
        currentVideo={videoUrl}
        objectType="CoachMaterial"
        objectId={null}
        title="Add Course Video"
        maxSizeMB={500}
      />
    </div>
  )
}

export default MaterialCreator