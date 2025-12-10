import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7009/api'

// Helper function to get full asset URL (for avatars, images, etc.)
export const getAssetUrl = (path) => {
  if (!path) return null
  // If path is already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  // If path starts with /api, replace with API_BASE_URL
  if (path.startsWith('/api/')) {
    return `${API_BASE_URL}${path.substring(4)}`
  }
  // If path starts with /, prepend API_BASE_URL
  if (path.startsWith('/')) {
    return `${API_BASE_URL}${path}`
  }
  // Otherwise, return as-is
  return path
}

// Export API_BASE_URL for direct use if needed
export { API_BASE_URL }

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwtToken') ;
  // const token = localStorage.getItem('jwtToken') || 
  //               localStorage.getItem('authToken') ||
  //               JSON.parse(localStorage.getItem('pickleball_user'))?.RefreshToken;
  
  console.log('API Request:', config.method?.toUpperCase(), config.url);
  console.log('Using token:', token ? token.substring(0, 20) + '...' : 'No token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  return config
}, (error) => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
})

// Response interceptor for handling auth errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response Success:', response.config.url, response.status);
    return response.data;
  },
  (error) => {
    console.error('API Response Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      console.log('401 Unauthorized - Clearing auth data');
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('authToken');
      localStorage.removeItem('pickleball_user');
      localStorage.removeItem('refreshToken');
      
      // Redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error.response?.data || error.message);
  }
)

export const authApi = {
  login: (email, password) => 
    api.post('/auth/login', { email, password }),
  
  fastlogin: async (token) => {
    try {
      console.log('Sending token to fastlogin API:', token.substring(0, 20) + '...');
      
      // Use the api instance, not raw axios
      const response = await api.post('/auth/fastlogin', 
        JSON.stringify(token), // Send token as JSON string
        {
          headers: { 
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Fastlogin API response:', response);
      return response;
    } catch (error) {
      console.error('Fastlogin API error:', error);
      throw error;
    }
  },
  
  
  register: (userData) => 
    api.post('/auth/register', userData).then(res => res.data),

  forgotPassword: (email) => {
    return axios.post('/api/auth/forgot-password', { email })
  },
  
  resetPassword: (token, newPassword) => {
    return axios.post('/api/auth/reset-password', { token, newPassword })
  },
  
  verifyResetToken: (token) => {
    return axios.get(`/api/auth/verify-reset-token/${token}`)
  }

}

export const materialApi = {
  createMaterial: (formData) => 
    api.post('/materials', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  getMaterials: () => 
    api.get('/materials'),

  getCoachMaterials: (coachId) => {
    console.log('Getting materials for coach:', coachId);
    return api.get(`/materials/coach/${coachId}`);
  },

  purchaseMaterial: (materialId) => 
    api.post(`/materials/${materialId}/purchase`),

  updateMaterial: (id, data) =>
    api.put(`/materials/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),

  deleteMaterial: (id) =>
    api.delete(`/materials/${id}`),

  getMaterial: (id) =>
    api.get(`/materials/${id}`),

  togglePublish: (id) =>
    api.post(`/materials/${id}/toggle-publish`)
}

export const sessionApi = {
  scheduleSession: (sessionData) => 
    api.post('/sessions', sessionData),

  getCoachSessions: (coachId) => {
    console.log('Getting sessions for coach:', coachId);
    // Try different endpoint patterns
    return api.get(`/sessions/coach/${coachId}`)
      .catch(error => {
        console.log('Coach sessions with ID failed, trying without ID...');
        // Try without ID if your backend gets coach ID from token
        return api.get('/sessions/coach');
      });
  },

  getStudentSessions: () => 
    api.get('/sessions/student'),

  cancelSession: (sessionId) => 
    api.delete(`/sessions/${sessionId}`)
}

// For debugging - test endpoints
export const testApi = {
  testAuth: () => api.get('/auth/test'),
  testMaterials: () => api.get('/materials/test'),
  testSessions: () => api.get('/sessions/test')
}

// Theme Management API
export const themeApi = {
  // Get active theme (public - no auth required)
  getActive: () => api.get('/theme/active'),

  // Get theme settings (admin only)
  getCurrent: () => api.get('/theme'),

  // Update theme settings (admin only)
  update: (data) => api.put('/theme', data),

  // Upload logo (admin only)
  uploadLogo: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/theme/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Upload favicon (admin only)
  uploadFavicon: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/theme/favicon', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Get theme presets (admin only)
  getPresets: () => api.get('/theme/presets'),

  // Reset theme to default (admin only)
  reset: () => api.post('/theme/reset')
}

// User Profile API
export const userApi = {
  // Get current user's profile
  getProfile: () => api.get('/users/profile'),

  // Update current user's profile
  updateProfile: (data) => api.put('/users/profile', data),

  // Upload avatar
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Delete avatar
  deleteAvatar: () => api.delete('/users/avatar'),

  // Get all users (admin only)
  getAllUsers: () => api.get('/users'),

  // Update user by ID (admin only)
  updateUser: (id, data) => api.put(`/users/${id}`, data)
}

// Content Types API
export const contentTypesApi = {
  // Get all active content types
  getAll: () => api.get('/contenttypes'),

  // Get content type by code
  getByCode: (code) => api.get(`/contenttypes/${code}`)
}

// Asset Management API
export const assetApi = {
  // Upload a single file
  upload: (file, folder = 'image', objectType = null, objectId = null) => {
    const formData = new FormData();
    formData.append('file', file);
    const params = new URLSearchParams({ folder });
    if (objectType) params.append('objectType', objectType);
    if (objectId) params.append('objectId', objectId);
    return api.post(`/assets/upload?${params.toString()}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Upload multiple files
  uploadMultiple: (files, folder = 'image', objectType = null, objectId = null) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const params = new URLSearchParams({ folder });
    if (objectType) params.append('objectType', objectType);
    if (objectId) params.append('objectId', objectId);
    return api.post(`/assets/upload-multiple?${params.toString()}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Delete a file by URL
  delete: (url) => api.delete(`/assets?url=${encodeURIComponent(url)}`),

  // Get allowed file types
  getAllowedTypes: () => api.get('/assets/allowed-types')
}

export default api