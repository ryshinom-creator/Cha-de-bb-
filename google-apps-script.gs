// Este script deve ser colado no Google Apps Script para salvar a localização 
// para que todos os convidados (em celulares diferentes) possam ver.

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  try {
    var data = JSON.parse(e.postData.contents);
    
    // Quando o admin clica no botão, salva a URL gerada na Célula A1
    if (data.action === 'saveLocation') {
      sheet.getRange('A1').setValue(data.link);
      return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', error: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // Quando o index.html dos convidados abre, ele puxa a URL da Célula A1
  if (e.parameter.action === 'getLocation') {
    var link = sheet.getRange('A1').getValue();
    return ContentService.createTextOutput(JSON.stringify({ link: link })).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput("API do Chá de Bebê está online!");
}