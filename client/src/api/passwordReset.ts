import { api } from './api';

// Description: Request password reset
// Endpoint: POST /api/auth/forgot-password
// Request: { email: string }
// Response: { success: boolean, message: string }
export const requestPasswordReset = (email: string) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: 'Password reset email sent successfully'
      });
    }, 1000);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   return await api.post('/api/auth/forgot-password', { email });
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
}

// Description: Reset password with token
// Endpoint: POST /api/auth/reset-password
// Request: { token: string, password: string }
// Response: { success: boolean, message: string }
export const resetPassword = (data: { token: string; password: string }) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: 'Password reset successfully'
      });
    }, 1000);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   return await api.post('/api/auth/reset-password', data);
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
}

// Description: Verify password reset token
// Endpoint: GET /api/auth/verify-reset-token/:token
// Request: {}
// Response: { valid: boolean, message: string }
export const verifyResetToken = (token: string) => {
  // Mocking the response
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate token validation
      if (token && token.length > 10) {
        resolve({
          valid: true,
          message: 'Token is valid'
        });
      } else {
        reject(new Error('Invalid or expired reset token'));
      }
    }, 500);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   return await api.get(`/api/auth/verify-reset-token/${token}`);
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
}