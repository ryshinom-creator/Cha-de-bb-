// --- CONFIGURAÇÃO DO BACKEND ---
// Cole a URL do seu Google Apps Script aqui depois de publicar!
const URL_API = ""; 

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
                    
                    resultadoMapa.innerHTML = "<p>Salvando localização para os convidados...</p>";
                    
                    // Salvamento temporário no navegador (funciona na hora sem configurar banco)
                    localStorage.setItem('linkMapaAydan', linkGoogleMaps);

                    // Se a URL do Google Script estiver configurada, envia para a planilha
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
                        <p style="color: green;">✅ Localização salva com sucesso!</p>
                        <a href="${linkGoogleMaps}" target="_blank" class="link-mapa">📍 Testar Localização</a>
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
// LÓGICA DA PÁGINA DOS CONVIDADOS (index.html)
// ==========================================
const areaLocalizacao = document.getElementById('area-localizacao');
if (areaLocalizacao) {
    async function carregarLocalizacao() {
        let linkEncontrado = null;

        // Tenta buscar da Planilha do Google primeiro (se estiver configurada)
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

        // Se não achou na planilha, busca na memória do navegador
        if (!linkEncontrado) {
            linkEncontrado = localStorage.getItem('linkMapaAydan');
        }

        // Exibe o botão se encontrou um link
        if (linkEncontrado) {
            areaLocalizacao.innerHTML = `
                <p>A localização do Chá de Bebê já está definida!</p>
                <a href="${linkEncontrado}" target="_blank" class="link-mapa">
                    📍 Clique aqui para abrir a rota no mapa
                </a>
            `;
        } else {
            areaLocalizacao.innerHTML = "<p>A localização do evento ainda não foi definida. Volte mais tarde!</p>";
        }
    }

    carregarLocalizacao();
}