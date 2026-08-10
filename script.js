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
const mapButton = document.getElementById("mapButton");
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
  locationText.textContent = d.mensagem || "Localização liberada! Toque no botão para ver no mapa.";

  if (d.endereco) {
    locationAddress.textContent = d.endereco;
    locationAddress.hidden = false;
    infoLocal.textContent = d.endereco;
  }

  const destino = d.mapa || d.rota || "";
  mapButton.href = destino || "#";

  locationActions.hidden = !destino;
  locationLocked.hidden = !!destino;

  if (d.abrirAutomatico && destino) iniciarAberturaAutomatica(destino);
}

function mostrarBloqueada() {
  locationActions.hidden = true;
  locationLocked.hidden = false;
  autoOpen.hidden = true;
  if (typeof pararContagem === "function") pararContagem();
  if (observador) { observador.disconnect(); observador = null; }
}

/**
 * Abertura automática do mapa.
 * Só entra em contagem quando o convidado está de fato parado olhando o bloco de
 * localização — se ele estiver rolando a página, nada acontece. Rolar para longe
 * cancela a contagem, e cancelar à mão vale para o resto do dia.
 */
let observador = null;
let timerContagem = null;
let timerEspera = null;

function jaResolvidoHoje() {
  return !!localStorage.getItem(chaveDoDia());
}

function pararContagem() {
  clearInterval(timerContagem);
  clearTimeout(timerEspera);
  timerContagem = null;
  timerEspera = null;
  contagemAtiva = false;
  autoOpen.hidden = true;
}

function iniciarAberturaAutomatica(rota) {
  if (contagemCancelada || jaResolvidoHoje() || observador) return;

  // sem suporte a IntersectionObserver: não abre sozinho, só deixa o botão pronto
  if (!("IntersectionObserver" in window)) return;

  const alvo = document.querySelector(".location-box");
  if (!alvo) return;

  observador = new IntersectionObserver(function (entradas) {
    const visivel = entradas[0].isIntersecting && entradas[0].intersectionRatio >= 0.6;

    if (!visivel) {
      if (contagemAtiva || timerEspera) pararContagem();
      return;
    }
    if (contagemAtiva || timerEspera || contagemCancelada || jaResolvidoHoje()) return;

    // exige 2s parado no bloco antes de começar a contar
    timerEspera = setTimeout(function () {
      timerEspera = null;
      contar(rota);
    }, 2000);
  }, { threshold: [0, 0.6, 1] });

  observador.observe(alvo);
}

function contar(rota) {
  contagemAtiva = true;
  let restam = SEGUNDOS_ABERTURA_AUTOMATICA;
  autoOpen.hidden = false;
  autoOpenText.textContent = "Abrindo o mapa em " + restam + "s...";

  timerContagem = setInterval(function () {
    restam--;
    if (contagemCancelada) { pararContagem(); return; }
    if (restam <= 0) {
      clearInterval(timerContagem);
      timerContagem = null;
      localStorage.setItem(chaveDoDia(), "aberto");
      autoOpenText.textContent = "Abrindo o mapa...";
      window.location.href = rota;
      return;
    }
    autoOpenText.textContent = "Abrindo o mapa em " + restam + "s...";
  }, 1000);
}

autoOpenCancel.addEventListener("click", function () {
  contagemCancelada = true;
  localStorage.setItem(chaveDoDia(), "cancelado");
  pararContagem();
  if (observador) { observador.disconnect(); observador = null; }
});

async function carregarLocalizacao() {
  if (!API_URL) return;
  try {
    const r = await fetch(API_URL + "?action=location&t=" + Date.now());
    const d = await r.json();
    if (d && d.liberado) mostrarLiberada(d);
    else mostrarBloqueada();
  } catch (e) { /* silencioso: tenta de novo no próximo ciclo */ }
}

carregarLocalizacao();
setInterval(carregarLocalizacao, INTERVALO_CHECAGEM);
document.addEventListener("visibilitychange", function () {
  if (!document.hidden) carregarLocalizacao();
});

/* ------------------------- fraldas ---------------------------- */
/**
 * Sorteia o tamanho da fralda a cada abertura do site.
 * Em vez de sortear solto (o que faria muita gente cair no mesmo tamanho),
 * cada aparelho recebe uma ordem embaralhada dos três tamanhos e vai
 * percorrendo essa ordem a cada visita. Assim os tamanhos ficam equilibrados
 * entre os convidados, e quem abre de novo recebe um tamanho diferente.
 */
const TAMANHOS = ["M", "G", "GG"];

function sortearFralda() {
  const alvo = document.getElementById("diaperSize");
  if (!alvo) return;

  let ordem, passo;
  try {
    ordem = JSON.parse(localStorage.getItem("aydan_fralda_ordem") || "null");
    if (!Array.isArray(ordem) || ordem.length !== TAMANHOS.length) {
      ordem = TAMANHOS.slice();
      for (let i = ordem.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = ordem[i]; ordem[i] = ordem[j]; ordem[j] = t;
      }
      localStorage.setItem("aydan_fralda_ordem", JSON.stringify(ordem));
    }
    passo = parseInt(localStorage.getItem("aydan_fralda_passo") || "0", 10) || 0;
    localStorage.setItem("aydan_fralda_passo", String(passo + 1));
  } catch (e) {
    // navegador sem armazenamento: sorteia na hora
    ordem = TAMANHOS;
    passo = Math.floor(Math.random() * TAMANHOS.length);
  }

  const tamanho = ordem[passo % ordem.length];
  alvo.textContent = tamanho;

  const nota = document.getElementById("diaperNote");
  if (nota && passo > 0) {
    nota.textContent = "Este é um tamanho novo para você — se já trouxe outro antes, qualquer um dos três ajuda muito!";
  }
}

sortearFralda();
