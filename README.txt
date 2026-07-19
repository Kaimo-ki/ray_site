Ray public site

Public URL:
https://kaimo-ki.github.io/ray_site/

Local entry:
index.html

Install options:
- PWA install through Chrome, Edge, Android Chrome, or iPhone Safari "Add to Home Screen".
- Windows app shortcut: downloads/Install-Ray-Web.cmd
- Windows floating companion: downloads/Install-Ray-Companion.cmd
- Downloadable static site archive: downloads/ray-web.zip

Privacy behavior:
- Ray does not read the computer, phone, files, screen, or other apps.
- Ray sees only messages and files the user sends directly.
- Memory and free companion movement are separate user choices.
- If the user chooses "chat only", Ray still works in chat and companion movement stays off.

Backend connection:
Set window.RAY_API_URL in config.js when the 24/7 Ray API is deployed.
Ray Web uses Ray API for email/password account signup/login when the API is available.
If Ray API auth is not reachable yet, the site falls back to a local Ray ID stored on this device.
Never put DATABASE_URL or secret keys in this site. DATABASE_URL belongs only in the Railway backend services.

Telegram:
The same Telegram bot can open Ray Web through a Web App button.
Telegram itself does not allow a bot to draw a floating object over the normal chat UI.
Current bot username: @rey_helper_bot
For shared memory, create/login to Ray Account on the site, then use the Telegram link code.
