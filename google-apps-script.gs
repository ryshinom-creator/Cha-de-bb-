/**
 * MISSÃO AYDAN — BACKEND v3 (Google Sheets)
 *
 * Foco: localização do evento.
 *  - Aba "Config"        → endereço, coordenadas e se está publicado
 *  - Aba "Confirmacoes"  → respostas do formulário do site
 *
 * Novidades desta versão:
 *  - sem senha administrativa;
 *  - o endereço é escrito automaticamente a partir das coordenadas do GPS;
 *  - quem digita o endereço recebe as coordenadas exatas de volta;
 *  - botões separados: salvar, publicar, ocultar e excluir.
 *
 * Depois de colar: Salvar → Implantar → Gerenciar implantações → lápis →
 * Versão: Nova → Implantar. (A URL continua a mesma.)
 */

const ABA_RSVP = "Confirmacoes";
const ABA_CONFIG = "Config";

const CHAVES = [
  "LOCAL_ENDERECO",
  "LOCAL_LINK",
  "LOCAL_LAT",
  "LOCAL_LNG",
  "LOCAL_MENSAGEM",
  "LOCAL_PUBLICADO",
  "LOCAL_ABRIR_AUTOMATICO",
  "LOCAL_ATUALIZADO_EM"
];

/* ------------------------- utilidades ------------------------- */

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
  if (!s) s = ss.insertSheet(ABA_RSVP);
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
  }
  return s;
}

function lerConfig_() {
  const valores = abaConfig_().getDataRange().getValues();
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
    if (linhaDe[chave]) s.getRange(linhaDe[chave], 2).setValue(valor);
    else { s.appendRow([chave, valor]); linhaDe[chave] = s.getLastRow(); }
  });
}

function sim_(v) {
  return String(v).trim().toUpperCase() === "SIM";
}

function coordValida_(lat, lng) {
  const a = parseFloat(lat), b = parseFloat(lng);
  return isFinite(a) && isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180 && !(a === 0 && b === 0);
}

function agora_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
}

/* -------------------- endereço x coordenadas ------------------- */
/* Usa o serviço Maps do próprio Apps Script — não precisa de chave de API. */

function enderecoDasCoords_(lat, lng) {
  try {
    const r = Maps.newGeocoder().setLanguage("pt-BR").reverseGeocode(parseFloat(lat), parseFloat(lng));
    if (r && r.status === "OK" && r.results && r.results.length) {
      return r.results[0].formatted_address || "";
    }
  } catch (e) { /* sem internet no serviço ou cota estourada */ }
  return "";
}

function coordsDoEndereco_(endereco) {
  try {
    const r = Maps.newGeocoder().setLanguage("pt-BR").setRegion("br").geocode(endereco);
    if (r && r.status === "OK" && r.results && r.results.length) {
      const res = r.results[0];
      return {
        lat: res.geometry.location.lat,
        lng: res.geometry.location.lng,
        endereco: res.formatted_address || endereco,
        exatidao: res.geometry.location_type || ""
      };
    }
  } catch (e) { /* idem */ }
  return null;
}

/** Ação usada pelo painel para traduzir GPS → endereço e endereço → GPS. */
function traduzir_(d) {
  if (coordValida_(d.lat, d.lng)) {
    const endereco = enderecoDasCoords_(d.lat, d.lng);
    if (!endereco) return { ok: false, error: "Não encontrei um endereço para essas coordenadas." };
    return { ok: true, endereco: endereco, lat: String(d.lat), lng: String(d.lng), origem: "gps" };
  }
  const texto = String(d.endereco || "").trim();
  if (texto.length < 4) return { ok: false, error: "Escreva o endereço com rua, número e cidade." };
  const achado = coordsDoEndereco_(texto);
  if (!achado) return { ok: false, error: "Não encontrei esse endereço. Tente incluir o número e a cidade." };
  return {
    ok: true,
    endereco: achado.endereco,
    lat: String(achado.lat),
    lng: String(achado.lng),
    exatidao: achado.exatidao,
    origem: "endereco"
  };
}

/* ------------------------ localização ------------------------- */

function montarLinks_(cfg) {
  const temCoord = coordValida_(cfg.LOCAL_LAT, cfg.LOCAL_LNG);
  const endereco = cfg.LOCAL_ENDERECO || "";
  const linkManual = cfg.LOCAL_LINK || "";
  const destino = temCoord ? (parseFloat(cfg.LOCAL_LAT) + "," + parseFloat(cfg.LOCAL_LNG)) : endereco;

  let rota = "", mapa = "", waze = "";
  if (destino) {
    rota = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(destino);
    mapa = linkManual || ("https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(destino));
    waze = temCoord
      ? ("https://waze.com/ul?ll=" + encodeURIComponent(destino) + "&navigate=yes")
      : ("https://waze.com/ul?q=" + encodeURIComponent(destino) + "&navigate=yes");
  } else if (linkManual) {
    rota = linkManual;
    mapa = linkManual;
  }
  return { rota: rota, mapa: mapa, waze: waze, temCoord: temCoord };
}

function localizacaoPublica_() {
  const cfg = lerConfig_();
  const links = montarLinks_(cfg);
  if (!sim_(cfg.LOCAL_PUBLICADO) || !links.rota) {
    return { ok: true, liberado: false };
  }
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

/**
 * Salva o endereço. Se "publicar" vier como SIM, os convidados passam a ver na hora.
 * Se faltar o endereço ou as coordenadas, o backend completa o que der usando o Maps.
 */
function salvar_(d) {
  const novo = {
    LOCAL_ENDERECO: String(d.endereco || "").trim(),
    LOCAL_LINK: String(d.link || "").trim(),
    LOCAL_LAT: String(d.lat || "").trim(),
    LOCAL_LNG: String(d.lng || "").trim(),
    LOCAL_MENSAGEM: String(d.mensagem || "").trim()
  };

  const temCoord = coordValida_(novo.LOCAL_LAT, novo.LOCAL_LNG);

  // completa o que estiver faltando
  if (temCoord && !novo.LOCAL_ENDERECO) {
    novo.LOCAL_ENDERECO = enderecoDasCoords_(novo.LOCAL_LAT, novo.LOCAL_LNG);
  } else if (!temCoord && novo.LOCAL_ENDERECO) {
    const achado = coordsDoEndereco_(novo.LOCAL_ENDERECO);
    if (achado) {
      novo.LOCAL_LAT = String(achado.lat);
      novo.LOCAL_LNG = String(achado.lng);
      novo.LOCAL_ENDERECO = achado.endereco;
    }
  }

  if (!montarLinks_(novo).rota) {
    return { ok: false, error: "Informe o endereço, o GPS ou um link de mapa." };
  }

  novo.LOCAL_PUBLICADO = sim_(d.publicar) ? "SIM" : "NAO";
  novo.LOCAL_ABRIR_AUTOMATICO = sim_(d.abrirAutomatico) ? "SIM" : "NAO";
  novo.LOCAL_ATUALIZADO_EM = agora_();
  gravarConfig_(novo);

  return { ok: true, config: lerConfig_(), publicada: localizacaoPublica_(), atualizadoEm: novo.LOCAL_ATUALIZADO_EM };
}

function publicar_() {
  const cfg = lerConfig_();
  if (!montarLinks_(cfg).rota) {
    return { ok: false, error: "Não há endereço salvo para publicar." };
  }
  gravarConfig_({ LOCAL_PUBLICADO: "SIM", LOCAL_ATUALIZADO_EM: agora_() });
  return { ok: true, config: lerConfig_(), publicada: localizacaoPublica_() };
}

function ocultar_() {
  gravarConfig_({ LOCAL_PUBLICADO: "NAO" });
  return { ok: true, config: lerConfig_(), publicada: localizacaoPublica_() };
}

function excluir_() {
  const limpo = {};
  CHAVES.forEach(function (k) { limpo[k] = ""; });
  limpo.LOCAL_PUBLICADO = "NAO";
  gravarConfig_(limpo);
  return { ok: true, config: lerConfig_(), publicada: localizacaoPublica_() };
}

/* ------------------------ confirmações ------------------------ */

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
  const valores = abaRsvp_().getDataRange().getValues();
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

/* ------------------------- roteamento ------------------------- */

function tratar_(d) {
  switch (String(d.action || "").trim()) {
    case "ping":       return { ok: true, versao: 3 };
    case "location":   return localizacaoPublica_();
    case "rsvp":       return salvarRsvp_(d);
    case "traduzir":   return traduzir_(d);
    case "save":       return salvar_(d);
    case "publish":    return publicar_();
    case "hide":       return ocultar_();
    case "delete":     return excluir_();
    case "list":       return listarRsvps_();
    case "status":     return { ok: true, config: lerConfig_(), publicada: localizacaoPublica_() };
    default:           return { ok: true, service: "Missão Aydan", versao: 3 };
  }
}

function doPost(e) {
  try {
    return json_(tratar_(JSON.parse((e && e.postData && e.postData.contents) || "{}")));
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

/* Rode uma vez no editor para criar as abas. */
function instalar() {
  abaRsvp_();
  abaConfig_();
  SpreadsheetApp.getActiveSpreadsheet().toast("Abas Confirmacoes e Config prontas.");
}
