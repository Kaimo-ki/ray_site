Ray website

Публичный сайт Рея.

Файлы:
- index.html - страница сайта
- styles.css - визуальный стиль
- config.js - URL backend API после VM
- script.js - web-chat с API/fallback demo
- assets/ray-hero.png - hero-изображение
- assets/ray-avatar.png - avatar Рея

Пока window.RAY_API_URL в config.js пустой, чат работает как демо.
Когда backend будет поднят на VM, вставь URL:

window.RAY_API_URL = "https://api.example.com";
