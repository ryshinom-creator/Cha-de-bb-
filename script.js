/* ------------------------------------------------------------------
   MISSÃO AYDAN — site público
   COLE ABAIXO a URL /exec do seu Google Apps Script (a mesma do admin).
------------------------------------------------------------------ */
const API_URL = "https://script.google.com/macros/s/AKfycbxLoO96uzau5hLFmKQmmaCrulP3N5sWPHTAdOWWxvtP7T9XXKA5sQEO8Bw2r1GASLwh/exec";

const INTERVALO_CHECAGEM = 20000; // checa a localização a cada 20s
const SEGUNDOS_ABERTURA_AUTOMATICA = 6;

const form = document.getElementById("rsvpForm");
const statusEl = document.getElementById("status");
const guestsWrap = document.getElementById("guestsWrap");

const locationText = document.getElementById("locationText");
const locationAddress = document.getElementById("locationAddress");
const locationActions = document.getElementById("locationActions");
const locationLocked = document.getElementById("locationLocked");
const routeButton = document.getElementById("routeButton");
const mapButton = document.getElementById("mapButton");
const wazeButton = document.getElementById("wazeButton");
const infoLocal = document.getElementById("infoLocal");
const autoOpen = document.getElementById("autoOpen");
const autoOpenText = document.getElementById("autoOpenText");
const autoOpenCancel = document.getElementById("autoOpenCancel");

/* ---------------------- formulário de presença ---------------------- */

function atualizaCampoPessoas() {
  const escolha = document.querySelector('input[name="attending"]:checked');
  guestsWrap.style.display = escolha && escolha.value === "sim" ? "block" : "none";
}
document.querySelectorAll('input[name="attending"]').forEach(function (r) {
  r.addEventListener("change", atualizaCampoPessoas);
});
atualizaCampoPessoas();

form.addEventListener("submit", async function (e) {
  e.preventDefault();
  const escolha = document.querySelector('input[name="attending"]:checked');
  const dados = {
    action: "rsvp",
    name: document.getElementById("name").value.trim(),
    attending: escolha ? escolha.value : "",
    guests: document.getElementById("guests").value,
    message: document.getElementById("message").value.trim()
  };
  if (!dados.name || !dados.attending) return;

  const btn = document.getElementById("submitBtn");
  btn.disabled = true;
  statusEl.textContent = "Enviando confirmação...";

  if (!API_URL) {
    const arr = JSON.parse(localStorage.getItem("aydan_rsvps") || "[]");
    arr.push(dados);
    localStorage.setItem("aydan_rsvps", JSON.stringify(arr));
    sucesso(dados);
    return;
  }

  try {
    const r = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(dados)
    });
    const d = await r.json();
    if (d && d.ok === false) throw new Error(d.error || "erro");
    sucesso(dados);
  } catch (err) {
    // último recurso: envia sem ler a resposta
    try {
      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(dados)
      });
      sucesso(dados);
    } catch (e2) {
      statusEl.textContent = "Não conseguimos enviar agora. Tente novamente.";
      btn.disabled = false;
    }
  }
});

function sucesso(dados) {
  statusEl.textContent = dados.attending === "sim"
    ? "Presença confirmada! 🚀💙"
    : "Obrigado por avisar! 🌙💙";
  form.reset();
  atualizaCampoPessoas();
  document.getElementById("submitBtn").disabled = false;
}

/* -------------------------- localização --------------------------- */

let contagemAtiva = false;
let contagemCancelada = false;

function chaveDoDia() {
  const d = new Date();
  return "aydan_rota_" + d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2);
}

function mostrarLiberada(d) {
  locationText.textContent = d.mensagem || "Localização liberada! Toque no botão para abrir a rota.";

  if (d.endereco) {
    locationAddress.textContent = d.endereco;
    locationAddress.hidden = false;
    infoLocal.textContent = d.endereco;
  }

  routeButton.href = d.rota || "#";
  if (d.mapa) { mapButton.href = d.mapa; mapButton.hidden = false; } else { mapButton.hidden = true; }
  if (d.waze) { wazeButton.href = d.waze; wazeButton.hidden = false; } else { wazeButton.hidden = true; }

  locationActions.hidden = false;
  locationLocked.hidden = true;

  if (d.abrirAutomatico && d.rota) iniciarAberturaAutomatica(d.rota);
}

function mostrarBloqueada(d) {
  locationActions.hidden = true;
  locationLocked.hidden = false;
  autoOpen.hidden = true;
  if (d && d.liberarEm) {
    const q = new Date(d.liberarEm);
    if (!isNaN(q.getTime())) {
      locationText.textContent = "A localização será liberada em " +
        q.toLocaleDateString("pt-BR") + " às " +
        q.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) + ".";
    }
  }
}

function iniciarAberturaAutomatica(rota) {
  if (contagemAtiva || contagemCancelada) return;
  if (localStorage.getItem(chaveDoDia()) === "1") return;

  contagemAtiva = true;
  let restam = SEGUNDOS_ABERTURA_AUTOMATICA;
  autoOpen.hidden = false;
  autoOpenText.textContent = "Abrindo a rota em " + restam + "s...";

  const timer = setInterval(function () {
    restam--;
    if (contagemCancelada) { clearInterval(timer); return; }
    if (restam <= 0) {
      clearInterval(timer);
      localStorage.setItem(chaveDoDia(), "1");
      autoOpenText.textContent = "Abrindo a rota...";
      window.location.href = rota;
      return;
    }
    autoOpenText.textContent = "Abrindo a rota em " + restam + "s...";
  }, 1000);
}

autoOpenCancel.addEventListener("click", function () {
  contagemCancelada = true;
  autoOpen.hidden = true;
});

async function carregarLocalizacao() {
  if (!API_URL) return;
  try {
    const r = await fetch(API_URL + "?action=location&t=" + Date.now());
    const d = await r.json();
    if (d && d.liberado) mostrarLiberada(d);
    else mostrarBloqueada(d);
  } catch (e) { /* silencioso: tenta de novo no próximo ciclo */ }
}

carregarLocalizacao();
setInterval(carregarLocalizacao, INTERVALO_CHECAGEM);
document.addEventListener("visibilitychange", function () {
  if (!document.hidden) carregarLocalizacao();
});
