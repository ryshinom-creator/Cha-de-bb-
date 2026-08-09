// COLE AQUI A URL /exec DO SEU GOOGLE APPS SCRIPT
const API_URL = "";

const form = document.getElementById("rsvpForm");
const statusEl = document.getElementById("status");
const guestsWrap = document.getElementById("guestsWrap");
const btnAbrirMapa = document.getElementById("btn-abrir-mapa");

// Controle de exibição do campo de convidados ao confirmar presença
document.querySelectorAll('input[name="attending"]').forEach(r => {
  r.addEventListener("change", () => {
    const isSim = document.querySelector('input[name="attending"]:checked')?.value === "sim";
    guestsWrap.style.display = isSim ? "block" : "none";
  });
});

// Carregar a localização salva no Google Sheets automaticamente
async function loadLocation() {
  if (!API_URL) return;
  try {
    const res = await fetch(API_URL + "?action=getLoc");
    const data = await res.json();
    if (data.ok && data.localizacao && btnAbrirMapa) {
      btnAbrirMapa.href = data.localizacao;
    }
  } catch (e) {
    console.error("Erro ao carregar localização", e);
  }
}
loadLocation();

// Envio do formulário de RSVP
form.addEventListener("submit", async e => {
  e.preventDefault();
  const data = {
    action: "rsvp",
    name: document.getElementById("name").value.trim(),
    attending: document.querySelector('input[name="attending"]:checked')?.value,
    guests: document.getElementById("guests").value,
    message: document.getElementById("message").value.trim()
  };
  
  if (!data.name || !data.attending) return;
  
  const btn = document.getElementById("submitBtn");
  btn.disabled = true;
  statusEl.textContent = "Enviando confirmação...";
  
  if (!API_URL) {
    // Modo offline simulado se não houver URL configurada
    const arr = JSON.parse(localStorage.getItem("aydan_rsvps") || "[]");
    arr.push(data);
    localStorage.setItem("aydan_rsvps", JSON.stringify(arr));
    success(data);
    return;
  }
  
  try {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data),
      mode: "no-cors"
    });
    success(data);
  } catch (err) {
    statusEl.textContent = "Erro ao enviar. Tente novamente.";
    btn.disabled = false;
  }
});

function success(data) {
  statusEl.textContent = data.attending === "sim" ? "Presença confirmada com sucesso! 🚀💙" : "Obrigado por avisar! 🌙💙";
  form.reset();
  guestsWrap.style.display = "block";
  document.getElementById("submitBtn").disabled = false;
}
