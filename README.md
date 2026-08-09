# Chá de Bebê do Aydan - Arquivos Atualizados

Aqui estão os seus arquivos atualizados e prontos para enviar pro Git! 🚀

## O que foi feito:
1. **admin.html**: Inserida a proteção de senha. A senha definida é `aydan1234`. Se a pessoa errar, ela é expulsa de volta para o `index.html`. Também foi colocado o botão de pegar a localização atual.
2. **index.html**: A página agora tem uma área inteligente que carrega a localização salva automaticamente para os convidados.
3. **script.js**: Fiz toda a mágica aqui dentro, tanto a função do botão de buscar a localização pelo GPS quanto a de mostrar para os convidados.
4. **google-apps-script.gs**: Deixei pronto o código do banco de dados (Google Sheets) pra você.

## Como usar agora:
- **Para testar rápido**: Você já pode jogar esses arquivos no Git. Quando você acessar o `admin.html`, digitar a senha e clicar no botão, ele vai salvar a localização no seu navegador e o `index.html` vai funcionar perfeitamente pra você.
- **Para todos os convidados verem**: Como o site está na internet, a localização do seu celular precisa ir para a nuvem para que os celulares dos convidados também vejam. Para isso:
  1. Crie uma planilha no Google Sheets.
  2. Vá em `Extensões > Apps Script` e cole o código do arquivo `google-apps-script.gs`.
  3. Publique como Aplicativo da Web (Web App) para "Qualquer Pessoa".
  4. Copie a URL gerada e cole lá na primeira linha do arquivo `script.js` (onde está escrito `const URL_API = "";`).
