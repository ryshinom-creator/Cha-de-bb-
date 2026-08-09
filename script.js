// COLE AQUI A URL /exec DO GOOGLE APPS SCRIPT
const API_URL = "";

const form = document.getElementById("rsvpForm");
const statusEl = document.getElementById("status");
const guestsWrap = document.getElementById("guestsWrap");
const locationButton = document.getElementById("locationButton");
const locationText = document.getElementById("locationText");

document.querySelectorAll('input[name="attending"]').forEach(r => {
  r.addEventListener("change", () => {
    guestsWrap.style.display = r.value === "sim" && r.checked ? "block" : 
      (document.querySelector('input[name="attending"]:checked')?.value === "sim" ? "block" : "none");
  });
});

async function loadLocation(){
  if(!API_URL) return;
  try{
    const r=await fetch(API_URL+"?action=location");
    const d=await r.json();
    if(d.link){
      locationText.textContent=d.text || "Localização liberada pelo organizador.";
      locationButton.href=d.link;
      locationButton.classList.remove("disabled");
    }
  }catch(e){}
}
loadLocation();

form.addEventListener("submit", async e=>{
  e.preventDefault();
  const data={
    action:"rsvp",
    name:document.getElementById("name").value.trim(),
    attending:document.querySelector('input[name="attending"]:checked')?.value,
    guests:document.getElementById("guests").value,
    message:document.getElementById("message").value.trim()
  };
  if(!data.name || !data.attending) return;
  const btn=document.getElementById("submitBtn"); btn.disabled=true; statusEl.textContent="Enviando confirmação...";
  if(!API_URL){
    const arr=JSON.parse(localStorage.getItem("aydan_rsvps")||"[]"); arr.push(data); localStorage.setItem("aydan_rsvps",JSON.stringify(arr));
    success(data); return;
  }
  try{
    await fetch(API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(data),mode:"no-cors"});
    success(data);
  }catch(err){statusEl.textContent="Erro ao enviar. Tente novamente.";btn.disabled=false;}
});
function success(data){
  statusEl.textContent=data.attending==="sim"?"Presença confirmada! 🚀💙":"Obrigado por avisar! 🌙💙";
  form.reset(); guestsWrap.style.display="block"; document.getElementById("submitBtn").disabled=false;
}
