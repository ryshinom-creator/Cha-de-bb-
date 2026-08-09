// --- CONFIGURAÇÃO DO BACKEND ---
// Sua URL do Google Apps Script já está aqui!
const URL_API = "https://script.google.com/macros/s/AKfycbzRyEtUbEfFxPo6ADqQjDLkW-m8Dd_zgB5bS8iIat6JPP8UvKKSmZHOC3RKp5kxKCyl/exec"; 

// ==========================================
// LÓGICA DO PAINEL ADMIN (admin.html)
// ==========================================
const btnLocalizacao = document.getElementById('btn-localizacao');
const resultadoMapa = document.getElementById('resultado-mapa');

if (btnLocalizacao) {
    btnLocalizacao.addEventListener('click', () => {
        if (navigator.geolocation) {
            resultadoMapa.innerHTML = "<p>Buscando sua localização pelo GPS...</p>";
            
            navigator.geolocation.getCurrentPosition(
                async (posicao) => {
                    const lat = posicao.coords.latitude;
                    const lon = posicao.coords.longitude;
                    const linkGoogleMaps = `https://www.google.com/maps?q=${lat},${lon}`;
                    
                    resultadoMapa.innerHTML = "<p>Salvando localização na base de dados (Google Sheets)...</p>";
                    
                    // Salvamento temporário no navegador
                    localStorage.setItem('linkMapaAydan', linkGoogleMaps);

                    // Envia a localização para a sua planilha do Google
                    if (URL_API !== "") {
                        try {
                            await fetch(URL_API, {
                                method: 'POST',
                                mode: 'no-cors',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'saveLocation', link: linkGoogleMaps })
                            });
                        } catch (error) {
                            console.error("Erro ao salvar no Google Sheets", error);
                        }
                    }
                    
                    resultadoMapa.innerHTML = `
                        <p style="color: green;">✅ Localização salva com sucesso na nuvem!</p>
                        <a href="${linkGoogleMaps}" target="_blank" class="link-mapa" style="display:inline-block; margin-top:10px; padding:10px; background:#2196F3; color:white; text-decoration:none; border-radius:5px;">📍 Testar Localização</a>
                    `;
                },
                (erro) => {
                    resultadoMapa.innerHTML = "<p style='color: red;'>Erro ao acessar o GPS. Verifique se a localização do seu aparelho está ativada.</p>";
                }
            );
        } else {
            resultadoMapa.innerHTML = "<p style='color: red;'>Seu aparelho não suporta busca de GPS.</p>";
        }
    });
}

// ==========================================
// LÓGICA DA PÁGINA DOS CONVIDADOS (TEMA ASTRONAUTA)
// ==========================================
const locationText = document.getElementById('locationText');
const locationButton = document.getElementById('locationButton');

if (locationText && locationButton) {
    async function carregarLocalizacao() {
        let linkEncontrado = null;

        // Tenta buscar da Planilha do Google
        if (URL_API !== "") {
            try {
                const response = await fetch(URL_API + "?action=getLocation");
                const data = await response.json();
                if (data.link) {
                    linkEncontrado = data.link;
                }
            } catch (e) {
                console.log("Ainda não conectou ao Google Sheets, tentando memória local...");
            }
        }

        // Se não achou na planilha, busca na memória local do celular/pc
        if (!linkEncontrado) {
            linkEncontrado = localStorage.getItem('linkMapaAydan');
        }

        // Se o link foi encontrado no Google Sheets, ativa o botão do Astronauta!
        if (linkEncontrado) {
            locationText.innerText = "Localização liberada! Pressione o botão abaixo para abrir a rota intergaláctica.";
            locationButton.href = linkEncontrado;
            locationButton.classList.remove("disabled");
        }
    }

    carregarLocalizacao();
}
