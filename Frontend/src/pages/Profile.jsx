import React, { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import { 
  User, Camera, Video, MapPin, Phone, Calendar, 
  Edit2, Save, Upload, X, Play, Award, Target,
  Zap, Heart, Activity, TrendingUp
} from 'lucide-react'

const Profile = () => {
  const { user, updateUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [videoPreview, setVideoPreview] = useState(null)
  const fileInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const [isEditing, setIsEditing] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      gender: '',
      dob: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      bio: '',
      experienceLevel: '',
      playingStyle: '',
      handedness: '',
      paddleBrand: '',
      paddleModel: '',
      yearsPlaying: '',
      tournamentLevel: '',
      favoriteShot: ''
    }
  })

  // Load user data into form
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        gender: user.gender || '',
        dob: user.dob || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || '',
        country: user.country || '',
        bio: user.bio || '',
        experienceLevel: user.experienceLevel || '',
        playingStyle: user.playingStyle || '',
        handedness: user.handedness || '',
        paddleBrand: user.paddleBrand || '',
        paddleModel: user.paddleModel || '',
        yearsPlaying: user.yearsPlaying || '',
        tournamentLevel: user.tournamentLevel || '',
        favoriteShot: user.favoriteShot || ''
      })
      
      if (user.avatar) {
        setAvatarPreview(user.avatar)
      }
      if (user.introVideo) {
        setVideoPreview(user.introVideo)
      }
    }
  }, [user, reset])

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const formData = new FormData()
      
      // Append all form data
      Object.keys(data).forEach(key => {
        if (data[key]) {
          formData.append(key, data[key])
        }
      })

      // Append files if they exist
      if (fileInputRef.current?.files[0]) {
        formData.append('avatar', fileInputRef.current.files[0])
      }
      
      if (videoInputRef.current?.files[0]) {
        formData.append('introVideo', videoInputRef.current.files[0])
      }

      // Call your API to update profile
      const response = await updateUser(formData)
      
      if (response.success) {
        setIsEditing(false)
        alert('Profile updated successfully!')
      } else {
        alert('Failed to update profile: ' + response.error)
      }
    } catch (error) {
      console.error('Profile update error:', error)
      alert('An error occurred while updating your profile.')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size should be less than 5MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleVideoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        alert('Video size should be less than 50MB')
        return
      }
      if (!file.type.includes('video')) {
        alert('Please select a video file')
        return
      }
      const videoUrl = URL.createObjectURL(file)
      setVideoPreview(videoUrl)
    }
  }

  const removeAvatar = () => {
    setAvatarPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeVideo = () => {
    setVideoPreview(null)
    if (videoInputRef.current) {
      videoInputRef.current.value = ''
    }
  }

  const experienceLevels = [
    'Beginner (0-1 years)',
    'Intermediate (1-3 years)',
    'Advanced (3-5 years)',
    'Competitive (5+ years)',
    'Professional'
  ]

  const playingStyles = [
    'Aggressive/Banger',
    'Defensive/Soft Game',
    'All-rounder',
    'Strategic/Placement',
    'Power Player',
    'Finesse Player'
  ]

  const handednessOptions = [
    { value: 'right', label: 'Right-handed', icon: '👉' },
    { value: 'left', label: 'Left-handed', icon: '👈' },
    { value: 'ambidextrous', label: 'Ambidextrous', icon: '🔄' }
  ]

  const tournamentLevels = [
    'Recreational',
    'Local/Club',
    'Regional',
    'National',
    'Professional'
  ]

  const favoriteShots = [
    'Third-shot drop',
    'Drive',
    'Dink',
    'Lob',
    'Overhead smash',
    'ATP (Around the post)',
    'Erne',
    'Reset'
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white">My Profile</h1>
                <p className="text-blue-100 mt-2">
                  Complete your profile to enhance your pickleball experience
                </p>
              </div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      reset()
                    }}
                    className="px-4 py-2 border border-white text-white rounded-lg font-medium hover:bg-white/10 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit(onSubmit)}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Avatar & Basic Info Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Avatar Upload */}
                <div className="lg:col-span-1">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h3>
                      <div className="relative">
                        <div className="w-48 h-48 mx-auto rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
                          {avatarPreview ? (
                            <img 
                              src={avatarPreview} 
                              alt="Profile" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-20 h-20 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        {isEditing && (
                          <div className="mt-4 space-y-3">
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleAvatarChange}
                              accept="image/*"
                              className="hidden"
                              id="avatar-upload"
                            />
                            <label
                              htmlFor="avatar-upload"
                              className="block w-full text-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                            >
                              <div className="flex items-center justify-center space-x-2">
                                <Camera className="w-4 h-4" />
                                <span>Upload Photo</span>
                              </div>
                            </label>
                            {avatarPreview && (
                              <button
                                type="button"
                                onClick={removeAvatar}
                                className="block w-full text-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                              >
                                Remove Photo
                              </button>
                            )}
                            <p className="text-xs text-gray-500 text-center">
                              Recommended: Square image, 500x500px, max 5MB
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Handedness Selection */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Handedness</h3>
                      <div className="space-y-3">
                        {handednessOptions.map((option) => (
                          <label
                            key={option.value}
                            className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition ${
                              watch('handedness') === option.value
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 hover:bg-gray-50'
                            } ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            <input
                              type="radio"
                              {...register('handedness')}
                              value={option.value}
                              disabled={!isEditing}
                              className="hidden"
                            />
                            <span className="text-2xl">{option.icon}</span>
                            <span className="flex-1">{option.label}</span>
                            {watch('handedness') === option.value && (
                              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                              </div>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        {...register('firstName', { required: 'First name is required' })}
                        type="text"
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:cursor-not-allowed"
                      />
                      {errors.firstName && (
                        <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        {...register('lastName', { required: 'Last name is required' })}
                        type="text"
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:cursor-not-allowed"
                      />
                      {errors.lastName && (
                        <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        {...register('email', { 
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address'
                          }
                        })}
                        type="email"
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:cursor-not-allowed"
                      />
                      {errors.email && (
                        <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender
                      </label>
                      <select
                        {...register('gender')}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth
                      </label>
                      <input
                        {...register('dob')}
                        type="date"
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        {...register('phone')}
                        type="tel"
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:cursor-not-allowed"
                        placeholder="(123) 456-7890"
                      />
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Street Address
                        </label>
                        <input
                          {...register('address')}
                          type="text"
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:cursor-not-allowed"
                          placeholder="123 Main St"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          {...register('city')}
                          type="text"
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State/Province
                        </label>
                        <input
                          {...register('state')}
                          type="text"
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ZIP/Postal Code
                        </label>
                        <input
                          {...register('zipCode')}
                          type="text"
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country
                        </label>
                        <input
                          {...register('country')}
                          type="text"
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pickleball Specific Information */}
              <div className="border-t pt-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Target className="w-6 h-6 mr-2 text-blue-500" />
                  Pickleball Player Profile
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Player Info */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Experience Level *
                      </label>
                      <select
                        {...register('experienceLevel', { required: 'Experience level is required' })}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Select your level</option>
                        {experienceLevels.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                      {errors.experienceLevel && (
                        <p className="text-sm text-red-600 mt-1">{errors.experienceLevel.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Years Playing
                      </label>
                      <input
                        {...register('yearsPlaying')}
                        type="number"
                        min="0"
                        max="50"
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:cursor-not-allowed"
                        placeholder="e.g., 3"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tournament Level
                      </label>
                      <select
                        {...register('tournamentLevel')}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Select tournament level</option>
                        {tournamentLevels.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Favorite Shot
                      </label>
                      <select
                        {...register('favoriteShot')}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Select favorite shot</option>
                        {favoriteShots.map(shot => (
                          <option key={shot} value={shot}>{shot}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Right Column - Playing Style & Equipment */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Playing Style
                      </label>
                      <select
                        {...register('playingStyle')}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Select playing style</option>
                        {playingStyles.map(style => (
                          <option key={style} value={style}>{style}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Paddle Brand
                      </label>
                      <input
                        {...register('paddleBrand')}
                        type="text"
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:cursor-not-allowed"
                        placeholder="e.g., Selkirk, Joola, Paddletek"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Paddle Model
                      </label>
                      <input
                        {...register('paddleModel')}
                        type="text"
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:cursor-not-allowed"
                        placeholder="e.g., Vanguard Power Air"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio & Introduction Video */}
              <div className="border-t pt-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Heart className="w-6 h-6 mr-2 text-purple-500" />
                  Personal Introduction
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Bio Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio / About Me *
                    </label>
                    <textarea
                      {...register('bio', { 
                        required: 'Bio is required',
                        minLength: {
                          value: 50,
                          message: 'Bio should be at least 50 characters'
                        },
                        maxLength: {
                          value: 1000,
                          message: 'Bio should not exceed 1000 characters'
                        }
                      })}
                      rows="6"
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:cursor-not-allowed"
                      placeholder="Tell us about yourself, your pickleball journey, and what you're looking for..."
                    />
                    {errors.bio && (
                      <p className="text-sm text-red-600 mt-1">{errors.bio.message}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {watch('bio')?.length || 0}/1000 characters
                    </p>
                  </div>

                  {/* Introduction Video */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Introduction Video (Optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      {videoPreview ? (
                        <div className="relative">
                          <video
                            src={videoPreview}
                            controls
                            className="w-full h-48 rounded-lg object-cover"
                          />
                          {isEditing && (
                            <button
                              type="button"
                              onClick={removeVideo}
                              className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-center">
                          <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 mb-4">
                            Upload a short video introducing yourself (max 50MB)
                          </p>
                          {isEditing && (
                            <>
                              <input
                                type="file"
                                ref={videoInputRef}
                                onChange={handleVideoChange}
                                accept="video/*"
                                className="hidden"
                                id="video-upload"
                              />
                              <label
                                htmlFor="video-upload"
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Video
                              </label>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Max 2 minutes, 50MB. Share your story and playing style!
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile