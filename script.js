const form = document.querySelector("#chatForm");
const input = document.querySelector("#chatInput");
const log = document.querySelector("#chatLog");

const replies = [
  "Понял. Давай возьмем один маленький шаг на сегодня, без перегруза.",
  "Ок. Я бы начал с простого: что сейчас важнее всего и что можно сделать за 15 минут?",
  "Слышится как задача про фокус. Давай отделим главное от шума.",
  "Можно. Сначала уточним цель, потом разобьем ее на короткие шаги.",
  "Я рядом. Напиши чуть подробнее, и я помогу разложить это спокойно."
];

function addMessage(text, type) {
  const node = document.createElement("div");
  node.className = `message ${type}`;
  node.textContent = text;
  log.appendChild(node);
  log.scrollTop = log.scrollHeight;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();

  if (!text) {
    return;
  }

  addMessage(text, "user");
  input.value = "";

  window.setTimeout(() => {
    const reply = replies[Math.floor(Math.random() * replies.length)];
    addMessage(reply, "ray");
  }, 420);
});
