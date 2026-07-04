// src/components/Satellite.jsx
import React, { useState, useEffect } from 'react';
import './Satellite.css';

function Satellite() {
  const [isEnabled, setIsEnabled] = useState(
    localStorage.getItem('raySatelliteEnabled') === 'true'
  );
  const [color, setColor] = useState(
    localStorage.getItem('raySatelliteColor') || '#4f46e5'
  );
  const [position, setPosition] = useState({ x: 20, y: 20 });

  // Загрузка позиции
  useEffect(() => {
    const saved = localStorage.getItem('raySatellitePosition');
    if (saved) {
      try {
        setPosition(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading satellite position:', e);
      }
    }
  }, []);

  // Сохранение позиции
  useEffect(() => {
    localStorage.setItem('raySatellitePosition', JSON.stringify(position));
  }, [position]);

  // Сохранение настроек
  useEffect(() => {
    localStorage.setItem('raySatelliteEnabled', String(isEnabled));
    localStorage.setItem('raySatelliteColor', color);
  }, [isEnabled, color]);

  if (!isEnabled) return null;

  return (
    <div 
      className="ray-satellite"
      style={{
        '--satellite-color': color,
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      <div className="satellite-content">
        <span className="satellite-icon">🤖</span>
        <div className="satellite-pulse" style={{ background: color }} />
      </div>
      
      <div className="satellite-message">
        <p>Рэй рядом ✨</p>
        <span className="message-time">сейчас</span>
      </div>
    </div>
  );
}

export default Satellite;