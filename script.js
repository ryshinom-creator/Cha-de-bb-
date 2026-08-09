// URL oficial da sua planilha
const URL_API = "https://script.google.com/macros/s/AKfycbzRyEtUbEfFxPo6ADqQjDLkW-m8Dd_zgB5bS8iIat6JPP8UvKKSmZHOC3RKp5kxKCyl/exec";

// ==========================================
// 1. CARREGAR A LOCALIZAÇÃO NA TELA DO ASTRONAUTA
// ==========================================
const locationText = document.getElementById('locationText');
const locationButton = document.getElementById('locationButton');

if (locationText && locationButton) {
    async function carregarLocalizacao() {
        try {
            const response = await fetch(URL_API + "?action=getLocation");
            const data = await response.json();
            
            // Se o Link foi encontrado, libera o botão!
            if (data.link && data.link.trim() !== "") {
                locationText.innerText = "Localização liberada! Pressione o botão abaixo para abrir a rota intergaláctica.";
                locationButton.href = data.link;
                locationButton.classList.remove("disabled");
            }
        } catch (e) {
            console.log("Aguardando configuração de localização na central.");
        }
    }
    carregarLocalizacao();
}

// ==========================================
// 2. ENVIAR FORMULÁRIO DE PRESENÇA (RSVP)
// ==========================================
const rsvpForm = document.getElementById('rsvpForm');
const statusMsg = document.getElementById('status');
const submitBtn = document.getElementById('submitBtn');

if (rsvpForm) {
    rsvpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        submitBtn.innerHTML = "ENVIANDO... 🚀";
        submitBtn.disabled = true;

        const formData = {
            action: 'rsvp',
            name: document.getElementById('name').value,
            attending: document.querySelector('input[name="attending"]:checked').value,
            guests: document.getElementById('guests').value,
            message: document.getElementById('message').value
        };

        try {
            const response = await fetch(URL_API, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.ok) {
                statusMsg.innerHTML = "✅ Confirmação enviada para a central!";
                statusMsg.style.color = "#71e2b0";
                rsvpForm.reset();
            } else {
                throw new Error("Erro no servidor");
            }
        } catch (error) {
            statusMsg.innerHTML = "❌ Erro ao enviar mensagem. Tente novamente.";
            statusMsg.style.color = "#ff9eaa";
        }
        
        submitBtn.innerHTML = "CONFIRMAR PRESENÇA <b>→</b>";
        submitBtn.disabled = false;
    });
}
