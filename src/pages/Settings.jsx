// src/pages/Settings.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRay } from '../context/RayContext';
import './Settings.css';

function Settings() {
  const { apiUrl, setApiUrl, isConnected, user, updateMode, updateGoals } = useRay();
  const [tempApiUrl, setTempApiUrl] = useState(apiUrl);
  const [mode, setMode] = useState(localStorage.getItem('rayMode') || 'friendly');
  const [goals, setGoals] = useState(
    JSON.parse(localStorage.getItem('rayGoals') || '[]')
  );
  const [voiceEnabled, setVoiceEnabled] = useState(
    localStorage.getItem('rayVoiceEnabled') === 'true'
  );

  const handleSaveApi = () => {
    setApiUrl(tempApiUrl);
    localStorage.setItem('rayApiUrl', tempApiUrl);
  };

  const handleModeChange = async (newMode) => {
    setMode(newMode);
    localStorage.setItem('rayMode', newMode);
    await updateMode(newMode);
  };

  const handleGoalToggle = async (goal) => {
    const newGoals = goals.includes(goal)
      ? goals.filter(g => g !== goal)
      : [...goals, goal];
    setGoals(newGoals);
    localStorage.setItem('rayGoals', JSON.stringify(newGoals));
    await updateGoals(newGoals);
  };

  const availableGoals = ['learn', 'health', 'focus', 'productivity', 'creative'];

  return (
    <div className="settings-page">
      <header className="settings-nav">
        <Link to="/" className="back-btn">← Назад</Link>
        <h1>Настройки</h1>
      </header>

      <div className="settings-content">
        {/* API Настройки */}
        <section className="settings-section">
          <h2>🔌 API Рэя</h2>
          <div className="settings-field">
            <label>URL API</label>
            <div className="api-input-group">
              <input
                type="text"
                value={tempApiUrl}
                onChange={(e) => setTempApiUrl(e.target.value)}
                placeholder="https://ray-bot.onrender.com"
                className="settings-input"
              />
              <button onClick={handleSaveApi} className="btn-save">
                Сохранить
              </button>
            </div>
            <span className={`status-badge ${isConnected ? 'online' : 'offline'}`}>
              {isConnected ? '✅ Подключено' : '❌ Нет соединения'}
            </span>
          </div>
        </section>

        {/* Режим общения */}
        <section className="settings-section">
          <h2>💬 Режим общения</h2>
          <div className="settings-options">
            {['friendly', 'professional', 'creative'].map((m) => (
              <button
                key={m}
                className={`option-btn ${mode === m ? 'active' : ''}`}
                onClick={() => handleModeChange(m)}
              >
                {m === 'friendly' && '😊 Дружелюбный'}
                {m === 'professional' && '💼 Профессиональный'}
                {m === 'creative' && '🎨 Креативный'}
              </button>
            ))}
          </div>
        </section>

        {/* Цели */}
        <section className="settings-section">
          <h2>🎯 Цели</h2>
          <div className="settings-goals">
            {availableGoals.map((goal) => (
              <label key={goal} className="goal-checkbox">
                <input
                  type="checkbox"
                  checked={goals.includes(goal)}
                  onChange={() => handleGoalToggle(goal)}
                />
                <span>
                  {goal === 'learn' && '📚 Учиться'}
                  {goal === 'health' && '💪 Здоровье'}
                  {goal === 'focus' && '🎯 Фокус'}
                  {goal === 'productivity' && '⚡ Продуктивность'}
                  {goal === 'creative' && '🎨 Творчество'}
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* Голос */}
        <section className="settings-section">
          <h2>🎤 Голос</h2>
          <div className="settings-toggle">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={(e) => {
                  setVoiceEnabled(e.target.checked);
                  localStorage.setItem('rayVoiceEnabled', String(e.target.checked));
                }}
              />
              <span className="toggle-slider" />
              <span className="toggle-label">Озвучка ответов</span>
            </label>
          </div>
        </section>

        {/* Приватность */}
        <section className="settings-section">
          <h2>🔒 Приватность</h2>
          <div className="settings-info">
            <p>Ваши данные хранятся локально. История сообщений сохраняется в браузере.</p>
            <button 
              className="btn-danger"
              onClick={() => {
                if (confirm('Очистить всю историю сообщений?')) {
                  localStorage.removeItem('rayMessages');
                  localStorage.removeItem('rayUserId');
                  window.location.reload();
                }
              }}
            >
              🗑️ Очистить историю
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Settings;