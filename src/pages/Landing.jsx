// src/pages/Landing.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

function Landing() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    // Проверяем, установлено ли PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
  }, []);

  // Функция для отправки из приветствия - используем window.location
  const handleGreetingSend = () => {
    if (inputText.trim()) {
      localStorage.setItem('rayGreetingMessage', inputText);
      window.location.href = '/chat';
    }
  };

  // Обработка Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleGreetingSend();
    }
  };

  return (
    <div className="landing">
      {/* Герой-секция */}
      <section className="hero">
        <div className="hero-content">
          <h1>Рэй рядом, когда нужно подумать, собраться или просто написать как человеку.</h1>
          <p className="hero-description">
            Он отвечает коротко, помнит важное, помогает с фокусом, голосовыми, идеями, картинками и привычками.
          </p>
          
          <div className="hero-actions">
            <a href="https://t.me/rey_helper_bot" className="btn-primary" target="_blank" rel="noopener noreferrer">
              <span className="icon">📱</span> Открыть Telegram
            </a>
            <button className="btn-secondary" onClick={() => document.getElementById('install')?.scrollIntoView({ behavior: 'smooth' })}>
              <span className="icon">⬇️</span> Установить
            </button>
            <Link to="/settings" className="btn-ghost">
              ⚙️ Настройки приватности
            </Link>
          </div>
        </div>

        <div className="hero-avatar">
          <div className="ray-avatar">
            <span className="ray-icon">🤖</span>
            <div className="ray-pulse" />
          </div>
        </div>
      </section>

      {/* Секция "Привет, я Рэй" */}
      <section className="greeting">
        <div className="greeting-card">
          <div className="greeting-header">
            <span className="ray-emoji">🤖</span>
            <h2>Привет, я Рэй. А ты?</h2>
          </div>
          
          <div className="greeting-example">
            <p className="user-thought">Я хочу не потерять фокус и учить английский.</p>
            <p className="ray-response">Ок. Давай просто: цель, срок и сколько минут в день реально.</p>
          </div>

          <div className="greeting-actions">
            <button className="btn-outline" onClick={() => window.location.href = '/chat'}>
              Продолжить
            </button>
            <button className="btn-ghost-sm" onClick={() => {
              localStorage.setItem('rayMemoryEnabled', 'false');
              window.location.href = '/chat';
            }}>
              Без памяти
            </button>
          </div>

          <div className="greeting-input">
            <input 
              type="text" 
              placeholder="Напиши Рэю мысль, вопрос или цель" 
              className="ray-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button className="btn-send" onClick={handleGreetingSend}>
              Отправить →
            </button>
          </div>
        </div>
      </section>

      {/* Фичи */}
      <section className="features">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-number">01</div>
            <h3>Память</h3>
            <p>Рэй запоминает важные факты, цели и стиль общения, чтобы не начинать каждый раз с нуля.</p>
            <a href="https://rayweb.com" className="feature-link" target="_blank" rel="noopener noreferrer">
              Слушай, расскажи о себе. →
            </a>
            <div className="feature-badge">Telegram и на сайте</div>
          </div>

          <div className="feature-card">
            <div className="feature-number">02</div>
            <h3>Цели</h3>
            <p>Большие планы превращаются в маленькие шаги: день, неделя, прогресс и мягкие напоминания.</p>
            <a href="https://rayweb.com" className="feature-link" target="_blank" rel="noopener noreferrer">
              Слушай, расскажи о себе. →
            </a>
            <div className="feature-badge">Telegram и на сайте</div>
          </div>

          <div className="feature-card">
            <div className="feature-number">03</div>
            <h3>Голос и фото</h3>
            <p>Можно говорить голосом, присылать фото, просить найти изображение или объяснить, что на самом деле.</p>
            <a href="https://rayweb.com" className="feature-link" target="_blank" rel="noopener noreferrer">
              Слушай, расскажи о себе. →
            </a>
            <div className="feature-badge">Telegram и на сайте</div>
          </div>
        </div>
      </section>

      {/* Установка */}
      <section className="install" id="install">
        <h2>УСТАНОВКА</h2>
        <p className="install-sub">
          Рэй работает в Telegram, браузере и как приложение на экране телефона или компьютера.
        </p>

        {!isInstalled && (
          <div className="install-banner">
            <button className="btn-install" onClick={() => {
              // PWA установка
              if (window.deferredPrompt) {
                window.deferredPrompt.prompt();
              } else {
                alert('Для установки приложения используйте меню браузера');
              }
            }}>
              <span className="icon">📲</span> Установить приложение
            </button>
          </div>
        )}

        <div className="platform-grid">
          <div className="platform-card">
            <span className="platform-icon">📱</span>
            <h4>iPhone</h4>
            <p>Открой сайт в Safari, нажми "Поделиться", затем "На экран Домой".</p>
          </div>

          <div className="platform-card">
            <span className="platform-icon">🤖</span>
            <h4>Android</h4>
            <p>Открой сайт в Chrome, нажми меню с тремя точками, затем "Установить приложение".</p>
          </div>

          <div className="platform-card">
            <span className="platform-icon">💻</span>
            <h4>Компьютер</h4>
            <p>Открой сайт в Chrome или Edge и нажми значок установки в адресной строке.</p>
          </div>
        </div>
      </section>

      {/* Единый аккаунт */}
      <section className="unified">
        <h2>Единый РЭЙ</h2>
        <p className="unified-sub">Один аккаунт, одна память, разные места общения.</p>

        <div className="auth-methods">
          <div className="auth-method">
            <span className="auth-icon">✉️</span>
            <span>Email</span>
            <span className="auth-desc">Классический логин и пароль для сайта и приложения.</span>
          </div>

          <div className="auth-method">
            <span className="auth-icon">🔵</span>
            <span>Google</span>
            <span className="auth-desc">Быстрый вход для веб и будущий мобильный версия.</span>
          </div>

          <div className="auth-method">
            <span className="auth-icon">✈️</span>
            <span>Telegram</span>
            <span className="auth-desc">Вход через текущего бота без создания второго Telegram.</span>
          </div>

          <div className="auth-method coming">
            <span className="auth-icon">💬</span>
            <span>WhatsApp</span>
            <span className="auth-desc">Позже: вход по мобильному номеру.</span>
            <span className="coming-badge">Скоро</span>
          </div>
        </div>

        <div className="sync-info">
          <p>
            В Telegram можно быстро написать без регистрации и установки. 
            В Ray Web появляется полноценный интерфейс — чат, память, цвет, приватность, спутник. 
            Рэй и будущая синхронизация с другими каналами.
          </p>
        </div>
      </section>

      {/* Спутник Рэй */}
      <section className="satellite">
        <h3>Спутник Рэй</h3>
        <p>Можно включить, выключить и выбрать цвет.</p>
        
        <div className="satellite-controls">
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              defaultChecked={localStorage.getItem('raySatelliteEnabled') === 'true'}
              onChange={(e) => {
                localStorage.setItem('raySatelliteEnabled', String(e.target.checked));
                window.location.reload();
              }}
            />
            <span className="toggle-slider" />
            <span className="toggle-label">Включить спутник</span>
          </label>

          <div className="color-picker">
            <span>Цвет:</span>
            <div className="color-options">
              {['#4f46e5', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6'].map((color) => (
                <button
                  key={color}
                  className={`color-dot ${localStorage.getItem('raySatelliteColor') === color ? 'active' : ''}`}
                  style={{ background: color }}
                  onClick={() => {
                    localStorage.setItem('raySatelliteColor', color);
                    window.location.reload();
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="satellite-preview">
          <div 
            className="floating-ray" 
            style={{ 
              background: localStorage.getItem('raySatelliteColor') || '#4f46e5' 
            }}
          >
            🤖
          </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;