// src/hooks/useVoice.js
import { useState, useEffect, useCallback } from "react";

export const useVoice = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const supported =
      "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
    setIsSupported(supported);

    if (!supported) {
      console.warn("Voice recognition not supported in this browser");
    }
  }, []);

  const startListening = useCallback(
    (onResult, onError) => {
      if (!isSupported) {
        const msg = "Голосовой ввод не поддерживается";
        setError(msg);
        if (onError) onError(msg);
        return;
      }

      const Recognition =
        window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new Recognition();

      recognition.lang = "ru-RU";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        if (onResult) onResult(text);
      };

      recognition.onerror = (event) => {
        console.error("Voice recognition error:", event.error);
        setIsListening(false);

        let errorMessage = "Ошибка распознавания";
        if (event.error === "not-allowed") {
          errorMessage = "Разрешите доступ к микрофону";
        } else if (event.error === "no-speech") {
          errorMessage = "Не удалось распознать речь";
        }

        setError(errorMessage);
        if (onError) onError(errorMessage);
      };

      try {
        recognition.start();
      } catch (err) {
        console.error("Failed to start recognition:", err);
        setIsListening(false);
        setError("Не удалось запустить распознавание");
      }

      // Возвращаем функцию остановки
      return () => {
        try {
          recognition.stop();
        } catch (e) {
          // Игнорируем ошибку остановки
        }
      };
    },
    [isSupported]
  );

  return {
    isSupported,
    isListening,
    error,
    startListening,
  };
};