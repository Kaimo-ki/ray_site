// src/components/FloatingRay.jsx (альтернативная версия)
import React, { useState, useEffect } from 'react';
import './FloatingRay.css';

function FloatingRay() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Проверяем, не на странице чата
  const isChatPage = window.location.pathname === '/chat';

  // Загрузка позиции
  useEffect(() => {
    const saved = localStorage.getItem('rayFloatPosition');
    if (saved) {
      try {
        setPosition(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading position:', e);
      }
    }
  }, []);

  // Сохранение позиции
  useEffect(() => {
    if (position.x !== 0 || position.y !== 0) {
      localStorage.setItem('rayFloatPosition', JSON.stringify(position));
    }
  }, [position]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    if (isDragging) return;
    if (isChatPage) {
      window.location.href = '/';
    } else {
      window.location.href = '/chat';
    }
  };

  // Только не на странице чата
  if (isChatPage) return null;

  return (
    <div
      className={`floating-ray ${isDragging ? 'dragging' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <button 
        className="ray-btn"
        onClick={handleClick}
        title={isChatPage ? 'На главную' : 'Открыть чат'}
      >
        <span className="ray-icon">🤖</span>
        <span className="ray-label">Рэй</span>
      </button>
      
      <div className="ray-tooltip">
        {isChatPage ? 'На главную' : 'Открыть чат'}
      </div>
    </div>
  );
}

export default FloatingRay;