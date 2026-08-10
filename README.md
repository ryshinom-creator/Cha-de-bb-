# 🚀 Chá de Bebê do Aydan — versão astronauta

Site de confirmação de presença + painel do organizador, com **Google Sheets** como banco de dados
(via Google Apps Script). Não precisa de servidor pago.

- `index.html` — site que os convidados abrem
- `admin.html` — seu painel (senha)
- `google-apps-script.gs` — o backend que vive dentro da planilha

---

## 1. Criar a planilha e colar o backend

1. Crie uma planilha nova no Google Sheets.
2. **Extensões → Apps Script**.
3. Apague o código de exemplo e cole **todo** o conteúdo de `google-apps-script.gs`.
4. Troque `TROQUE-ESTA-SENHA-123` pela sua senha.
5. Salve (💾) e rode a função **`instalar`** uma vez (botão ▶). Autorize quando o Google pedir.
   Isso cria as duas abas:
   - **Confirmacoes** — cada resposta dos convidados
   - **Config** — a localização do evento

## 2. Publicar o backend

No Apps Script: **Implantar → Nova implantação → Aplicativo da Web**
- Executar como: **eu**
- Quem tem acesso: **qualquer pessoa**
- **Implantar** e copie a URL que termina em `/exec`.

> Sempre que você editar o código depois, use
> **Implantar → Gerenciar implantações → lápis → Versão: Nova → Implantar**.
> Se criar uma implantação nova, a URL muda e você precisa atualizar os arquivos.

## 3. Ligar o site ao backend

Cole a mesma URL nos dois arquivos:

- `script.js`, primeira linha útil: `const API_URL = "https://script.google.com/.../exec";`
- `admin.html`, dentro do `<script>`: `const API_URL = "https://script.google.com/.../exec";`

## 4. Publicar no GitHub Pages

Suba `index.html`, `admin.html`, `script.js` e `styles.css`.
**Settings → Pages → Deploy from branch → main → / (root)**.

Seu painel fica em `https://SEU-USUARIO.github.io/SEU-REPO/admin.html`.
Não divulgue esse endereço no convite.

---

## Como publicar a localização no dia

No painel, digite a senha e use **uma** das três formas (pode combinar):

| Forma | Quando usar |
|---|---|
| **📡 Usar minha localização atual (GPS)** | Você está no local. Preenche latitude/longitude — é o modo mais preciso para a rota. |
| **Link do Google Maps** | Você já tem o link do salão/casa. Se o link tiver coordenadas, elas são extraídas automaticamente. |
| **Endereço escrito** | Sempre bom preencher: é o texto que os convidados leem na tela. |

Opções:
- **Liberar somente a partir de** — agende (ex.: 22/08 às 12:00) e o site solta o endereço sozinho na hora marcada. Vazio = libera na hora em que você clicar em publicar.
- **Abrir a rota automaticamente** — quando o convidado entra no site, aparece “Abrindo a rota em 6s…” e o celular vai direto para o Google Maps já navegando. Ele pode cancelar, e isso só acontece uma vez por aparelho no dia.
- **Ocultar dos convidados** — volta a esconder o endereço.

O bloco de status mostra exatamente o que os convidados estão vendo e um link para você testar a rota.

## O que o convidado vê

Enquanto não há localização: *“LOCALIZAÇÃO AINDA NÃO LIBERADA”*.
Depois de publicar, sem precisar recarregar (o site checa a cada 20 segundos):
- o endereço no cartão **LOCAL** e na Central de Navegação;
- **🧭 Abrir rota até o evento** (Google Maps em modo navegação);
- **🗺️ Ver no mapa** e **🚗 Abrir no Waze**.

## Editando direto na planilha

Tudo na aba **Config** é editável à mão, se preferir:

| Chave | Para que serve |
|---|---|
| `LOCAL_ENDERECO` | Endereço mostrado aos convidados |
| `LOCAL_LINK` | Link do Maps (opcional) |
| `LOCAL_LAT` / `LOCAL_LNG` | Coordenadas usadas para montar a rota |
| `LOCAL_MENSAGEM` | Recado exibido junto do endereço |
| `LOCAL_PUBLICADO` | `SIM` mostra, `NAO` esconde |
| `LOCAL_LIBERAR_EM` | Data/hora no formato `2026-08-22T12:00` |
| `LOCAL_ABRIR_AUTOMATICO` | `SIM` abre a rota sozinho |

## Se algo não funcionar

- **“Senha incorreta”** — a senha do painel tem que ser idêntica à do `ADMIN_PASSWORD` no Apps Script.
- **Painel não carrega nada** — o `API_URL` não foi colado, ou a implantação não está como “qualquer pessoa”.
- **Mudei o código e nada mudou** — falta criar uma nova *versão* da implantação (passo 2).
- **GPS não abre** — o navegador só libera GPS em endereço `https://`. No GitHub Pages funciona; abrindo o arquivo local, não.
- **Link curto (`maps.app.goo.gl`)** — funciona como botão, mas não dá coordenadas. Para a rota ficar exata, use o GPS ou o endereço completo.

## Observação sobre privacidade

Guarde a senha só com você: qualquer pessoa com ela pode ver a lista de convidados e trocar o endereço.
E a localização em tempo real do WhatsApp não pode ser lida por um site — o que este painel faz é publicar
o ponto que você escolher (GPS, link ou endereço), e você pode atualizá-lo quantas vezes quiser.
