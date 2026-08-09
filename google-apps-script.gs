/**
 * BACKEND DA MISSÃO AYDAN - CHÁ DE BEBÊ
 * Crie uma planilha no Google Sheets > Extensões > Apps Script.
 * Cole este código.
 *
 * Depois: Implantar > Nova implantação > Aplicativo da Web
 * Executar como: você
 * Quem tem acesso: Qualquer pessoa
 */
const ADMIN_PASSWORD = "TROQUE-ESTA-SENHA-123";

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateSheet(name) {
  let ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function setupSheets() {
  // Aba de RSVPs
  let rsvpSheet = getOrCreateSheet("Respostas");
  if (rsvpSheet.getLastRow() === 0) {
    rsvpSheet.appendRow(["Data", "Nome", "Vai?", "Pessoas", "Mensagem"]);
  }
  
  // Aba de Configurações (Localização)
  let configSheet = getOrCreateSheet("Config");
  if (configSheet.getLastRow() === 0) {
    configSheet.appendRow(["Chave", "Valor"]);
    configSheet.appendRow(["localizacao", "https://maps.google.com/"]);
  }
}

function doPost(e) {
  setupSheets();
  try {
    let data = JSON.parse(e.postData.contents || "{}");
    
    if (data.action === "rsvp") {
      let sheet = getOrCreateSheet("Respostas");
      sheet.appendRow([
        new Date(),
        data.name || "",
        data.attending === "sim" ? "SIM" : "NÃO",
        data.attending === "sim" ? (data.guests || 1) : 0,
        data.message || ""
      ]);
      return ContentService.createTextOutput(JSON.stringify({ok: true}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === "saveLoc") {
      if (data.password !== ADMIN_PASSWORD) {
        return ContentService.createTextOutput(JSON.stringify({ok: false, error: "Senha incorreta."}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      let sheet = getOrCreateSheet("Config");
      let values = sheet.getDataRange().getValues();
      let updated = false;
      for (let i = 1; i < values.length; i++) {
        if (values[i][0] === "localizacao") {
          sheet.getRange(i + 1, 2).setValue(data.localizacao || "");
          updated = true;
          break;
        }
      }
      if (!updated) {
        sheet.appendRow(["localizacao", data.localizacao || ""]);
      }
      return ContentService.createTextOutput(JSON.stringify({ok: true}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ok: false, error: "Ação desconhecida."}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ok: false, error: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  setupSheets();
  let action = e.parameter.action || "";
  
  if (action === "getLoc") {
    let sheet = getOrCreateSheet("Config");
    let values = sheet.getDataRange().getValues();
    let loc = "https://maps.google.com/";
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === "localizacao") {
        loc = values[i][1] || "https://maps.google.com/";
        break;
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ok: true, localizacao: loc}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === "list") {
    if (e.parameter.password !== ADMIN_PASSWORD) {
      return ContentService.createTextOutput(JSON.stringify({ok: false, error: "Senha incorreta."}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    let sheet = getOrCreateSheet("Respostas");
    let values = sheet.getDataRange().getValues();
    let items = values.slice(1).map(r => ({
      date: r[0] ? Utilities.formatDate(new Date(r[0]), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm") : "",
      name: r[1],
      attending: String(r[2]).toLowerCase() === "sim" ? "sim" : "nao",
      guests: r[3],
      message: r[4]
    }));
    return ContentService.createTextOutput(JSON.stringify({ok: true, items: items}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ok: true, service: "Missão Aydan - Chá de Bebê"}))
    .setMimeType(ContentService.MimeType.JSON);
}
