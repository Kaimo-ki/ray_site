// Этот скрипт загружается в index.html (загрузочном)
// Он проверяет, загружен ли ray_site, и подгружает его при необходимости

console.log('Рэй Desktop — загрузка...');

// Проверяем, есть ли уже загруженный контент
function loadRaySite() {
  const loader = document.querySelector('.loader');
  if (!loader) return;

  // Создаём iframe для загрузки ray_site
  const iframe = document.createElement('iframe');
  iframe.src = 'ray_site/index.html';
  iframe.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    border: none;
    background: #07110f;
    z-index: 1;
  `;
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-modals');
  
  // Показываем если загрузка идёт долго
  let loadingTimeout = setTimeout(() => {
    loader.innerHTML = `
      <h1 style="color:#32d6b0;font-size:64px;margin:0;">Рэй</h1>
      <p style="color:#a8b6b0;margin-top:8px;">Загрузка... возможно, потребуется обновить страницу</p>
    `;
  }, 5000);

  iframe.onload = () => {
    clearTimeout(loadingTimeout);
    loader.style.display = 'none';
  };

  iframe.onerror = () => {
    clearTimeout(loadingTimeout);
    loader.innerHTML = `
      <h1 style="color:#32d6b0;font-size:64px;margin:0;">Рэй</h1>
      <p style="color:#a8b6b0;margin-top:8px;">
        Не удалось загрузить приложение.<br>
        <a href="#" onclick="location.reload()" style="color:#32d6b0;">Обновить</a>
      </p>
    `;
  };

  document.body.appendChild(iframe);
}

// Загружаем приложение после загрузки страницы
window.addEventListener('load', loadRaySite);

// Проверяем, не загружено ли уже приложение
if (document.querySelector('.ray-app')) {
  document.querySelector('.loader')?.style.setProperty('display', 'none');
}

// Поддержка тёмной темы
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.style.colorScheme = 'dark';
}