import axios from 'axios';

// The URL from your .env.local file
// Provide a robust default for local development if env var is missing
const API_ORIGIN = process.env.REACT_APP_API_URL || (typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':5000') : '');
const API_URL = API_ORIGIN?.replace(/\/+$/, ''); // strip trailing slashes

// Function to get the token from storage
const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

// Create a central axios instance
const api = axios.create({
  // The FIX is here: we add "/api" to the base URL
  baseURL: `${API_URL}/api`,
});

// Use an interceptor to automatically add the Authorization header to every request
api.interceptors.request.use(config => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Define all your API functions in one place
export const fetchProfile = () => api.get('/users/me');
export const fetchMyPosts = () => api.get('/posts/me');
export const updateProfileImage = (formData) => api.post('/upload/profile-image', formData);
export const updateUserProfile = (data) => api.post('/users/profile', data);
export const deletePost = (id) => api.delete(`/posts/${id}`);
export const updatePost = (id, data) => api.put(`/posts/${id}`, data);

// Add these new functions to your existing apiService.js file

export const fetchFeedPosts = () => api.get('/posts/feed');

export const createPost = (formData) => api.post('/posts', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// Note: The upload endpoint for attachments can be the same as the profile image one
export const uploadFile = (fileData) => api.post('/upload/resource', fileData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});

// Friends helpers
export const removeFriend = (friendId) => api.post('/users/remove-friend', { friendId });

// Tries multiple endpoints to remove a friend, returning the first success
export const removeFriendSmart = async (friendId) => {
  const attempts = [
    { method: 'post', url: '/users/remove-friend', data: { friendId } },
    { method: 'post', url: '/users/unfriend', data: { friendId } },
    { method: 'delete', url: `/users/friends/${friendId}` },
    { method: 'delete', url: `/friends/${friendId}` },
    { method: 'post', url: '/friends/remove', data: { friendId } },
  ];

  let lastError;
  for (const attempt of attempts) {
    try {
      const { method, url, data } = attempt;
      const res = await api.request({ method, url, data });
      // consider 200-299 as success
      if (res && res.status >= 200 && res.status < 300) {
        return { success: true, status: res.status, data: res.data };
      }
    } catch (err) {
      lastError = err;
      // If 404, try next; if 401/403/500, still try next but remember error
      continue;
    }
  }
  const message = lastError?.response?.data?.message || lastError?.message || 'Unknown error';
  const status = lastError?.response?.status;
  return { success: false, status, message };
};

// Password reset helpers
export const sendPasswordOTP = (email) => api.post('/users/password/send-otp', { email });
export const verifyPasswordOTP = (email, otp) => api.post('/users/password/verify-otp', { email, otp });
export const resetPassword = (email, otp, newPassword) => api.post('/users/password/reset', { email, otp, newPassword });
