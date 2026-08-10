/**
 * BACKEND DA MISSÃO AYDAN — v2 (Google Sheets)
 *
 * O que ele faz:
 *  - guarda as confirmações na aba "Confirmacoes";
 *  - guarda a localização do evento na aba "Config" (você pode editar direto na planilha);
 *  - devolve para o site o link de rota pronto (Google Maps e Waze).
 *
 * Instalação:
 *  1. Planilha Google > Extensões > Apps Script
 *  2. Apague o que estiver lá e cole este arquivo inteiro
 *  3. Troque a senha abaixo
 *  4. Salvar > Implantar > Nova implantação > Aplicativo da Web
 *     Executar como: eu   |   Quem tem acesso: qualquer pessoa
 *  5. Copie a URL que termina em /exec
 *
 * IMPORTANTE: sempre que você alterar este código, faça
 * "Implantar > Gerenciar implantações > editar (lápis) > Versão: nova > Implantar".
 */

const ADMIN_PASSWORD = "TROQUE-ESTA-SENHA-123";

const ABA_RSVP = "Confirmacoes";
const ABA_CONFIG = "Config";

const CHAVES = [
  "LOCAL_ENDERECO",
  "LOCAL_LINK",
  "LOCAL_LAT",
  "LOCAL_LNG",
  "LOCAL_MENSAGEM",
  "LOCAL_PUBLICADO",
  "LOCAL_LIBERAR_EM",
  "LOCAL_ABRIR_AUTOMATICO",
  "LOCAL_ATUALIZADO_EM"
];

/* ------------------------------------------------------------------ */
/* utilidades                                                          */
/* ------------------------------------------------------------------ */

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function ss_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function abaRsvp_() {
  const ss = ss_();
  let s = ss.getSheetByName(ABA_RSVP);

  if (!s) {
    // reaproveita a aba antiga (versão 1) se ela já tiver confirmações
    const primeira = ss.getSheets()[0];
    let cabecalho = "";
    if (primeira && primeira.getLastRow() > 0) {
      cabecalho = primeira
        .getRange(1, 1, 1, Math.max(1, primeira.getLastColumn()))
        .getValues()[0]
        .join("|");
    }
    if (/nome/i.test(cabecalho) && /pessoas/i.test(cabecalho)) {
      primeira.setName(ABA_RSVP);
      s = primeira;
    } else {
      s = ss.insertSheet(ABA_RSVP);
    }
  }

  if (s.getLastRow() === 0) {
    s.appendRow(["Data", "Nome", "Vai?", "Pessoas", "Mensagem"]);
    s.getRange(1, 1, 1, 5).setFontWeight("bold");
    s.setFrozenRows(1);
    s.setColumnWidth(1, 150);
    s.setColumnWidth(2, 200);
    s.setColumnWidth(5, 320);
  }
  return s;
}

function abaConfig_() {
  const ss = ss_();
  let s = ss.getSheetByName(ABA_CONFIG);
  if (!s) s = ss.insertSheet(ABA_CONFIG);

  if (s.getLastRow() === 0) {
    s.appendRow(["Chave", "Valor"]);
    s.getRange(1, 1, 1, 2).setFontWeight("bold");
    s.setFrozenRows(1);
    s.setColumnWidth(1, 220);
    s.setColumnWidth(2, 480);
    CHAVES.forEach(function (k) { s.appendRow([k, ""]); });

    // migra a localização da versão antiga, se existir
    const antigo = PropertiesService.getScriptProperties();
    const linkAntigo = antigo.getProperty("LOCATION_LINK");
    if (linkAntigo) {
      gravarConfig_({
        LOCAL_LINK: linkAntigo,
        LOCAL_MENSAGEM: antigo.getProperty("LOCATION_TEXT") || "",
        LOCAL_PUBLICADO: "SIM"
      });
    }
  }
  return s;
}

function lerConfig_() {
  const s = abaConfig_();
  const valores = s.getDataRange().getValues();
  const cfg = {};
  CHAVES.forEach(function (k) { cfg[k] = ""; });
  for (let i = 1; i < valores.length; i++) {
    const chave = String(valores[i][0] || "").trim();
    if (chave) cfg[chave] = String(valores[i][1] == null ? "" : valores[i][1]).trim();
  }
  return cfg;
}

function gravarConfig_(dados) {
  const s = abaConfig_();
  const valores = s.getDataRange().getValues();
  const linhaDe = {};
  for (let i = 1; i < valores.length; i++) {
    const chave = String(valores[i][0] || "").trim();
    if (chave) linhaDe[chave] = i + 1;
  }
  Object.keys(dados).forEach(function (chave) {
    const valor = dados[chave] == null ? "" : String(dados[chave]);
    if (linhaDe[chave]) {
      s.getRange(linhaDe[chave], 2).setValue(valor);
    } else {
      s.appendRow([chave, valor]);
      linhaDe[chave] = s.getLastRow();
    }
  });
}

function sim_(v) {
  return String(v).trim().toUpperCase() === "SIM";
}

function coordValida_(lat, lng) {
  const a = parseFloat(lat), b = parseFloat(lng);
  return isFinite(a) && isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180 && !(a === 0 && b === 0);
}

/* ------------------------------------------------------------------ */
/* localização                                                         */
/* ------------------------------------------------------------------ */

function montarLinks_(cfg) {
  const lat = cfg.LOCAL_LAT, lng = cfg.LOCAL_LNG;
  const endereco = cfg.LOCAL_ENDERECO || "";
  const linkManual = cfg.LOCAL_LINK || "";
  const temCoord = coordValida_(lat, lng);
  const destino = temCoord ? (parseFloat(lat) + "," + parseFloat(lng)) : endereco;

  let rota = "";
  let mapa = "";
  let waze = "";

  if (destino) {
    rota = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(destino);
    mapa = linkManual || ("https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(destino));
    waze = temCoord
      ? ("https://waze.com/ul?ll=" + encodeURIComponent(destino) + "&navigate=yes")
      : ("https://waze.com/ul?q=" + encodeURIComponent(destino) + "&navigate=yes");
  } else if (linkManual) {
    // só temos o link compartilhado (ex.: maps.app.goo.gl) — ele serve para as duas coisas
    rota = linkManual;
    mapa = linkManual;
  }

  return { rota: rota, mapa: mapa, waze: waze, temCoord: temCoord };
}

function localizacaoPublica_() {
  const cfg = lerConfig_();
  const publicado = sim_(cfg.LOCAL_PUBLICADO);
  const liberarEm = cfg.LOCAL_LIBERAR_EM || "";

  let liberado = publicado;
  if (publicado && liberarEm) {
    const quando = new Date(liberarEm);
    if (!isNaN(quando.getTime())) liberado = new Date().getTime() >= quando.getTime();
  }

  if (!liberado) {
    return { ok: true, liberado: false, liberarEm: liberarEm };
  }

  const links = montarLinks_(cfg);
  if (!links.rota) return { ok: true, liberado: false, liberarEm: liberarEm };

  return {
    ok: true,
    liberado: true,
    endereco: cfg.LOCAL_ENDERECO || "",
    mensagem: cfg.LOCAL_MENSAGEM || "",
    rota: links.rota,
    mapa: links.mapa,
    waze: links.waze,
    abrirAutomatico: sim_(cfg.LOCAL_ABRIR_AUTOMATICO),
    atualizadoEm: cfg.LOCAL_ATUALIZADO_EM || ""
  };
}

function salvarLocalizacao_(d) {
  const novo = {
    LOCAL_ENDERECO: String(d.endereco || "").trim(),
    LOCAL_LINK: String(d.link || "").trim(),
    LOCAL_LAT: String(d.lat || "").trim(),
    LOCAL_LNG: String(d.lng || "").trim(),
    LOCAL_MENSAGEM: String(d.mensagem || "").trim(),
    LOCAL_LIBERAR_EM: String(d.liberarEm || "").trim()
  };

  // valida ANTES de gravar, para não apagar a localização que já estava salva
  if (!montarLinks_(novo).rota) {
    return { ok: false, error: "Informe o endereço, as coordenadas (GPS) ou um link de mapa." };
  }
  if (novo.LOCAL_LIBERAR_EM && isNaN(new Date(novo.LOCAL_LIBERAR_EM).getTime())) {
    return { ok: false, error: "Data de liberação inválida." };
  }

  const auto = (d.abrirAutomatico === true || sim_(d.abrirAutomatico) ||
                String(d.abrirAutomatico) === "true" || String(d.abrirAutomatico) === "1");
  const agora = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");

  novo.LOCAL_PUBLICADO = "SIM";
  novo.LOCAL_ABRIR_AUTOMATICO = auto ? "SIM" : "NAO";
  novo.LOCAL_ATUALIZADO_EM = agora;
  gravarConfig_(novo);

  return { ok: true, publicada: localizacaoPublica_(), atualizadoEm: agora };
}

function ocultarLocalizacao_() {
  gravarConfig_({ LOCAL_PUBLICADO: "NAO" });
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* confirmações                                                        */
/* ------------------------------------------------------------------ */

function salvarRsvp_(d) {
  const nome = String(d.name || d.nome || "").trim();
  if (!nome) return { ok: false, error: "Nome vazio." };
  const vai = String(d.attending || d.vai || "").toLowerCase() === "sim";

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    abaRsvp_().appendRow([
      new Date(),
      nome.slice(0, 120),
      vai ? "SIM" : "NÃO",
      vai ? (parseInt(d.guests || d.pessoas, 10) || 1) : 0,
      String(d.message || d.mensagem || "").slice(0, 800)
    ]);
  } finally {
    lock.releaseLock();
  }
  return { ok: true };
}

function listarRsvps_() {
  const s = abaRsvp_();
  const valores = s.getDataRange().getValues();
  const tz = Session.getScriptTimeZone();
  const itens = valores.slice(1)
    .filter(function (r) { return String(r[1] || "").trim() !== ""; })
    .map(function (r) {
      let data = "";
      if (r[0] instanceof Date) data = Utilities.formatDate(r[0], tz, "dd/MM/yyyy HH:mm");
      else if (r[0]) data = String(r[0]);
      return {
        date: data,
        name: r[1],
        attending: String(r[2]).toLowerCase().indexOf("sim") === 0 ? "sim" : "nao",
        guests: r[3] || 0,
        message: r[4] || ""
      };
    });
  return { ok: true, items: itens.reverse() };
}

/* ------------------------------------------------------------------ */
/* roteamento                                                          */
/* ------------------------------------------------------------------ */

function autorizado_(senha) {
  return String(senha || "") === ADMIN_PASSWORD;
}

function tratar_(d) {
  const acao = String(d.action || "").trim();

  // público
  if (acao === "location" || acao === "localizacao") return localizacaoPublica_();
  if (acao === "rsvp") return salvarRsvp_(d);

  // administrativo
  const precisaSenha = ["setLocation", "hideLocation", "list", "status"];
  if (precisaSenha.indexOf(acao) >= 0 && !autorizado_(d.password)) {
    return { ok: false, error: "Senha incorreta." };
  }
  if (acao === "setLocation") return salvarLocalizacao_(d);
  if (acao === "hideLocation") return ocultarLocalizacao_();
  if (acao === "list") return listarRsvps_();
  if (acao === "status") {
    return { ok: true, config: lerConfig_(), publicada: localizacaoPublica_() };
  }

  return { ok: true, service: "Missão Aydan", versao: 2 };
}

function doPost(e) {
  try {
    const corpo = (e && e.postData && e.postData.contents) || "{}";
    return json_(tratar_(JSON.parse(corpo)));
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  try {
    return json_(tratar_((e && e.parameter) || {}));
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/* Rode uma vez no editor do Apps Script para criar as abas. */
function instalar() {
  abaRsvp_();
  abaConfig_();
  SpreadsheetApp.getActiveSpreadsheet().toast("Abas Confirmacoes e Config prontas.");
}
