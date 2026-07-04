// src/api/rayApi.js
import axios from 'axios';

class RayApi {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Интерсептор для обработки ошибок
    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          console.warn('Неавторизован, проверьте API ключ');
        }
        return Promise.reject(error);
      }
    );
  }

  async health() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error.message);
      throw error;
    }
  }

  async chat(message, options = {}) {
    const {
      userId = localStorage.getItem('rayUserId') || `user_${Date.now()}`,
      context = [],
      mode = localStorage.getItem('rayMode') || 'friendly',
      goals = JSON.parse(localStorage.getItem('rayGoals') || '[]')
    } = options;

    try {
      const response = await this.client.post('/chat', {
        message,
        user_id: userId,
        context: context.slice(-10),
        mode,
        goals
      });

      if (response.data.user_id) {
        localStorage.setItem('rayUserId', response.data.user_id);
      }

      return response.data;
    } catch (error) {
      console.error('Chat error:', error);
      
      // Fallback при ошибке
      if (error.response?.status === 404 || error.response?.status === 500) {
        return {
          response: this._getFallbackResponse(message),
          isFallback: true
        };
      }
      
      throw error;
    }
  }

  async getProfile(userId = localStorage.getItem('rayUserId')) {
    if (!userId) return null;

    try {
      const response = await this.client.get('/profile', {
        params: { user_id: userId }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        // Профиль не найден - создаем новый
        return this._createProfile(userId);
      }
      console.error('Get profile error:', error);
      return null;
    }
  }

  async _createProfile(userId) {
    try {
      const response = await this.client.post('/profile', {
        user_id: userId,
        mode: 'friendly',
        goals: []
      });
      return response.data;
    } catch (error) {
      console.error('Create profile error:', error);
      return null;
    }
  }

  async updateProfile(updates) {
    const userId = localStorage.getItem('rayUserId');
    if (!userId) throw new Error('User ID not found');

    try {
      const response = await this.client.post('/profile', {
        user_id: userId,
        ...updates
      });
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  async sendVoice(audioBlob) {
    const userId = localStorage.getItem('rayUserId');
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice.ogg');
    if (userId) {
      formData.append('user_id', userId);
    }

    try {
      const response = await this.client.post('/voice', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    } catch (error) {
      console.error('Voice send error:', error);
      throw error;
    }
  }

  _getFallbackResponse(message) {
    const lower = message.toLowerCase();
    
    const fallbacks = {
      'привет': 'Привет! 👋 Я Рэй. Сейчас я в офлайн-режиме, но ты всегда можешь найти меня в Telegram: @rey_helper_bot',
      'как дела': 'У меня всё отлично! А у тебя? 🤗 (работаю офлайн)',
      'помощь': 'Я временно недоступен, но могу помочь в Telegram: @rey_helper_bot',
      'кто ты': 'Я Рэй 🤖 - твой виртуальный ассистент. Пока я в офлайн-режиме, но скоро вернусь!',
      'спасибо': 'Пожалуйста! Всегда рад помочь 😊',
      'пока': 'До встречи! Буду ждать тебя в Telegram: @rey_helper_bot 👋'
    };

    for (const [key, value] of Object.entries(fallbacks)) {
      if (lower.includes(key)) return value;
    }

    return 'Я сейчас в офлайн-режиме. Напиши мне в Telegram: @rey_helper_bot или проверь настройки API.';
  }
}

export default RayApi;