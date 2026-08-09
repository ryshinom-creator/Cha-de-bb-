/**
 * BACKEND DA MISSÃO AYDAN
 * Crie uma planilha Google > Extensões > Apps Script.
 * Cole este código.
 *
 * Depois: Implantar > Nova implantação > Aplicativo da Web
 * Executar como: você
 * Quem tem acesso: Qualquer pessoa
 *
 * Antes de publicar, troque a senha abaixo.
 */
const ADMIN_PASSWORD = "TROQUE-ESTA-SENHA-123";

function sheet(){
  return SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
}
function json(x){
  return ContentService.createTextOutput(JSON.stringify(x)).setMimeType(ContentService.MimeType.JSON);
}
function setup(){
  const s=sheet();
  if(s.getLastRow()===0) s.appendRow(["Data","Nome","Vai?","Pessoas","Mensagem"]);
}
function doPost(e){
  setup();
  const d=JSON.parse(e.postData.contents||"{}");
  if(d.action==="rsvp"){
    sheet().appendRow([new Date(),d.name||"",d.attending==="sim"?"SIM":"NÃO",d.attending==="sim"?(d.guests||1):0,d.message||""]);
    return json({ok:true});
  }
  if(d.action==="setLocation"){
    if(d.password!==ADMIN_PASSWORD) return json({ok:false,error:"Senha incorreta."});
    PropertiesService.getScriptProperties().setProperties({LOCATION_LINK:d.link||"",LOCATION_TEXT:d.text||""});
    return json({ok:true});
  }
  return json({ok:false,error:"Ação inválida."});
}
function doGet(e){
  const a=e.parameter.action||"";
  if(a==="location"){
    const p=PropertiesService.getScriptProperties();
    return json({link:p.getProperty("LOCATION_LINK")||"",text:p.getProperty("LOCATION_TEXT")||""});
  }
  if(a==="list"){
    if(e.parameter.password!==ADMIN_PASSWORD) return json({ok:false,error:"Senha incorreta."});
    const s=sheet(), values=s.getDataRange().getValues();
    const items=values.slice(1).map(r=>({date:r[0]?Utilities.formatDate(new Date(r[0]),Session.getScriptTimeZone(),"dd/MM/yyyy HH:mm"):"",name:r[1],attending:String(r[2]).toLowerCase()==="sim"?"sim":"nao",guests:r[3],message:r[4]}));
    return json({ok:true,items:items});
  }
  return json({ok:true,service:"Missão Aydan"});
}