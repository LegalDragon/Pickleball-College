import axios from 'axios'

const API_BASE_URL = 'https://localhost:7009/api'

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

  updateMaterial: async (id, data) => {
    const response = await api.put(`/materials/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },
  
  deleteMaterial: async (id) => {
    const response = await api.delete(`/materials/${id}`)
    return response.data
  },
  
  getMaterial: async (id) => {
    const response = await api.get(`/materials/${id}`)
    return response.data
  }
  
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

export default api