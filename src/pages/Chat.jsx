// src/pages/Chat.jsx (с историей)
import React, { useState, useEffect, useRef } from "react";
import { useRay } from "../context/RayContext";
import { useVoice } from "../hooks/useVoice";
import "./Chat.css";

function Chat() {
  const { messages, sendMessage, isLoading, isConnected, apiUrl } = useRay();
  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const { isSupported, isListening, startListening } = useVoice();

  // Загрузка локальных сообщений
  useEffect(() => {
    const saved = localStorage.getItem("rayChatMessages");
    if (saved) {
      try {
        setLocalMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading chat messages:", e);
      }
    }
  }, []);

  // Сохранение локальных сообщений
  useEffect(() => {
    if (localMessages.length > 0) {
      localStorage.setItem("rayChatMessages", JSON.stringify(localMessages));
    }
  }, [localMessages]);

  // Используем либо сообщения из контекста, либо локальные
  const displayMessages = messages.length > 0 ? messages : localMessages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const message = input;
    setInput("");

    // Добавляем сообщение пользователя локально
    const userMsg = {
      role: "user",
      content: message,
      timestamp: Date.now(),
    };
    setLocalMessages((prev) => [...prev, userMsg]);

    // Отправляем в API
    await sendMessage(message);
  };

  const handleVoice = () => {
    if (!isSupported) {
      alert("Голосовой ввод не поддерживается");
      return;
    }
    startListening(
      (text) => {
        setInput(text);
        setTimeout(handleSend, 200);
      },
      (error) => {
        alert(error);
      }
    );
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const goBack = () => {
    window.location.href = "/";
  };

  const clearHistory = () => {
    if (confirm("Очистить историю сообщений?")) {
      setLocalMessages([]);
      localStorage.removeItem("rayChatMessages");
    }
  };

  return (
    <div className="chat-page">
      <header className="chat-nav">
        <button className="back-btn" onClick={goBack}>
          ← Назад
        </button>
        <div className="chat-status">
          <span className={`status-dot ${isConnected ? "online" : "offline"}`} />
          {isConnected ? "Онлайн" : "Офлайн"}
        </div>
        <button className="clear-btn" onClick={clearHistory} title="Очистить историю">
          🗑️
        </button>
      </header>

      <div className="chat-container">
        <div className="chat-messages">
          {displayMessages.length === 0 && (
            <div className="chat-welcome">
              <div className="welcome-avatar">🤖</div>
              <h3>Привет! Я Рэй</h3>
              <p>Напиши мне что-нибудь</p>
            </div>
          )}

          {displayMessages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div className="message-avatar">
                {msg.role === "assistant" ? "🤖" : "👤"}
              </div>
              <div className="message-bubble">
                <p>{msg.content}</p>
                <span className="message-time">
                  {msg.timestamp
                    ? new Date(msg.timestamp).toLocaleTimeString()
                    : new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message assistant">
              <div className="message-avatar">🤖</div>
              <div className="message-bubble typing">
                <span>•</span>
                <span>•</span>
                <span>•</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <button
            className={`voice-btn ${isListening ? "active" : ""}`}
            onClick={handleVoice}
            disabled={!isSupported}
            title={isSupported ? "Голосовой ввод" : "Голос не поддерживается"}
          >
            🎤
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              apiUrl
                ? "Напишите сообщение..."
                : "Настройте API в настройках"
            }
            disabled={!apiUrl || isLoading}
            className="chat-input"
          />

          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!apiUrl || isLoading || !input.trim()}
          >
            {isLoading ? "⏳" : "➤"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;