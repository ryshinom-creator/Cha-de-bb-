# 🚀 Chá de Bebê do Aydan — versão astronauta

Site do convite + painel de localização. Backend em Google Sheets (Apps Script), **sem senha**.

## Suba no GitHub apenas estes 4 arquivos

```
index.html   admin.html   script.js   styles.css
```

O `google-apps-script.gs` fica só na planilha — é sua cópia de segurança.

**Settings → Pages → Deploy from branch → main → / (root)**

- Convite: `https://SEU-USUARIO.github.io/SEU-REPO/`
- Painel: `https://SEU-USUARIO.github.io/SEU-REPO/admin.html`

## Antes de tudo: atualize o código na planilha

O backend mudou nesta versão. Na planilha → **Extensões → Apps Script**, apague o
código antigo, cole o `google-apps-script.gs` novo, salve e faça
**Implantar → Gerenciar implantações → lápis → Versão: Nova → Implantar**.
A URL continua a mesma, então os arquivos do site não mudam.

## Como usar o painel

1. **📡 Usar minha localização atual** — estando no local, o painel ouve o GPS por até
   12 segundos e guarda a leitura mais precisa. Depois pergunta ao Google que endereço
   fica naquele ponto e escreve sozinho no campo. Confira o texto: a rota usa as
   coordenadas, então mesmo que o texto saia com o nome de um vizinho, o destino está certo.
2. **🔎 Conferir este endereço no mapa** — se você digitar o endereço em vez de usar o GPS,
   esse botão busca as coordenadas exatas. Ele avisa quando o resultado é no número exato
   (*rooftop*) ou apenas aproximado.
3. **💾 Salvar sem publicar** — guarda o endereço sem mostrar a ninguém.
4. **📍 Publicar agora** — libera na hora. O site dos convidados atualiza sozinho em até
   20 segundos, sem precisar recarregar.
5. **🙈 Ocultar** — esconde mas mantém salvo. **🗑️ Excluir** — apaga o endereço da planilha.

Se a opção *"abrir a rota automaticamente"* estiver marcada, o celular do convidado mostra
"Abrindo a rota em 6s…" e vai direto para o Google Maps navegando. Ele pode cancelar, e isso
acontece uma vez por aparelho no dia.

## Sobre não ter senha

Qualquer pessoa que descubra o endereço do `admin.html` pode trocar ou apagar o local do
evento, e ver a lista de convidados. O endereço não aparece no convite e o Google não
indexa a página, então na prática só quem receber o link entra — mas não coloque esse
endereço em grupo de WhatsApp.

Para voltar a ter senha depois, é só me pedir.

## Aba Config da planilha

Dá para editar tudo à mão por lá:

| Chave | Serve para |
|---|---|
| `LOCAL_ENDERECO` | Texto que os convidados leem |
| `LOCAL_LAT` / `LOCAL_LNG` | Coordenadas usadas na rota |
| `LOCAL_LINK` | Link do Maps, se você preferir usar um |
| `LOCAL_MENSAGEM` | Recado ao lado do endereço |
| `LOCAL_PUBLICADO` | `SIM` mostra, `NAO` esconde |
| `LOCAL_ABRIR_AUTOMATICO` | `SIM` abre a rota sozinho |

## Se algo falhar

- **Painel diz "sem conexão"** — a implantação precisa estar como *Executar como: eu* e
  *Quem tem acesso: **Qualquer pessoa*** (não "qualquer pessoa com Conta do Google").
- **GPS não abre** — só funciona em `https://`. No GitHub Pages sim; abrindo o arquivo do
  computador, não.
- **Mudei o código e nada mudou** — falta criar uma nova *versão* da implantação.
