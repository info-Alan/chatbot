// src/services/apiService.js

const API_URL = process.env.REACT_APP_API_URL;
console.log('API_URL:', API_URL);

export const loginUser = async (username, password) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    console.log('Login response:', data);

    if (response.ok) {
      // Store userId or token in localStorage (adjust based on your backend response)
      localStorage.setItem('userId', data.userId); // If your backend returns userId
      localStorage.setItem('userType', data.userType); 
    }

    return { success: response.ok, data };
  } catch (error) {
    console.error('Error in login API:', error);
    return { success: false, data: { message: 'Network error' } };
  }
};

export const registerUser = async (username, password) => {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    console.log('Register response:', data);

    if (response.ok) {
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('userType', data.userType); 
    }

    return { success: response.ok, data };
  } catch (error) {
    console.error('Error in register API:', error);
    return { success: false, data: { message: 'Network error' } };
  }
};