// src/context/RayContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import RayApi from '../api/rayApi';

const RayContext = createContext();

export const RayProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('rayApiUrl') || '');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rayApi, setRayApi] = useState(null);
  const [user, setUser] = useState(null);

  // Инициализация API при изменении URL
  useEffect(() => {
    if (apiUrl) {
      const api = new RayApi(apiUrl);
      setRayApi(api);
      checkConnection(api);
      loadUserProfile(api);
    } else {
      setRayApi(null);
      setIsConnected(false);
    }
  }, [apiUrl]);

  // Загрузка истории из localStorage
  useEffect(() => {
    const saved = localStorage.getItem('rayMessages');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading messages:', e);
      }
    }
  }, []);

  // Сохранение истории в localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('rayMessages', JSON.stringify(messages));
    }
  }, [messages]);

  const checkConnection = async (api) => {
    if (!api) return;
    try {
      const result = await api.health();
      setIsConnected(result.status === 'ok' || result.status === 'online');
    } catch (error) {
      console.error('Health check failed:', error);
      setIsConnected(false);
    }
  };

  const loadUserProfile = async (api) => {
    if (!api) return;
    try {
      const profile = await api.getProfile();
      if (profile) {
        setUser(profile);
        if (profile.mode) {
          localStorage.setItem('rayMode', profile.mode);
        }
        if (profile.goals) {
          localStorage.setItem('rayGoals', JSON.stringify(profile.goals));
        }
      }
    } catch (error) {
      console.error('Load profile error:', error);
    }
  };

  const sendMessage = async (text, options = {}) => {
    if (!rayApi) {
      // Fallback без API
      const fallbackResponse = `Извините, API не настроен. Пожалуйста, настройте URL API в настройках.`;
      const botMessage = {
        role: 'assistant',
        content: fallbackResponse,
        timestamp: Date.now(),
        isFallback: true
      };
      setMessages(prev => [...prev, botMessage]);
      return;
    }

    // Добавляем сообщение пользователя
    const userMessage = {
      role: 'user',
      content: text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Получаем контекст последних сообщений
      const context = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await rayApi.chat(text, {
        context,
        mode: localStorage.getItem('rayMode') || 'friendly',
        goals: JSON.parse(localStorage.getItem('rayGoals') || '[]'),
        ...options
      });

      const botMessage = {
        role: 'assistant',
        content: response.response || response.reply || response.message || 'Я не понял запрос',
        timestamp: Date.now(),
        isFallback: response.isFallback || false
      };
      setMessages(prev => [...prev, botMessage]);

      // Обновляем профиль если есть изменения
      if (response.user_id) {
        loadUserProfile(rayApi);
      }

      return response;
    } catch (error) {
      console.error('Send message error:', error);
      
      // Fallback при ошибке
      const fallbackMessage = {
        role: 'assistant',
        content: '⚠️ Произошла ошибка. Попробуйте позже или напишите в Telegram: @rey_helper_bot',
        timestamp: Date.now(),
        isError: true
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateMode = async (mode) => {
    if (!rayApi) return false;
    try {
      await rayApi.updateProfile({ mode });
      localStorage.setItem('rayMode', mode);
      if (user) setUser({ ...user, mode });
      return true;
    } catch (error) {
      console.error('Update mode error:', error);
      return false;
    }
  };

  const updateGoals = async (goals) => {
    if (!rayApi) return false;
    try {
      await rayApi.updateProfile({ goals });
      localStorage.setItem('rayGoals', JSON.stringify(goals));
      if (user) setUser({ ...user, goals });
      return true;
    } catch (error) {
      console.error('Update goals error:', error);
      return false;
    }
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem('rayMessages');
  };

  return (
    <RayContext.Provider value={{
      messages,
      setMessages,
      apiUrl,
      setApiUrl,
      isConnected,
      isLoading,
      user,
      rayApi,
      sendMessage,
      updateMode,
      updateGoals,
      clearHistory,
      checkConnection
    }}>
      {children}
    </RayContext.Provider>
  );
};

export const useRay = () => {
  const context = useContext(RayContext);
  if (!context) {
    throw new Error('useRay must be used within RayProvider');
  }
  return context;
};