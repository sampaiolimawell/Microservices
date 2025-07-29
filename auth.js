const axios = require('axios');
const fs = require('fs');


const USERNAME = 'moovrisk.teste';
const PASSWORD = 'z{C-xJG=169+L8Ak1kJ9n?HJKJHMS];GGskgDg6}JMD&5Om3?v71{:;!rq~/4xY^A9+e73gUqQ.^t{VZX-~{';

const API_AUTH_URL = 'https://api.predictus.com.br/auth';

const authenticate = async () => {
  try {
    console.log(' Autenticando com usuário:', USERNAME);

    const response = await axios.post(
      API_AUTH_URL,
      { username: USERNAME, password: PASSWORD },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const { accessToken, expiresIn } = response.data;

    if (!accessToken) {
      throw new Error('Campo "accessToken" não encontrado na resposta.');
    }

    const expiresAt = Date.now() + (expiresIn || 1800) * 1000;

   
    fs.writeFileSync('token.json', JSON.stringify({ token: accessToken, expiresAt }, null, 2));

    console.log('Token gerado com sucesso!');
    console.log(` Token: ${accessToken.substring(0, 10)}...${accessToken.slice(-10)}`);
    console.log(` Expira em: ${new Date(expiresAt).toLocaleString()}`);
  } catch (error) {
    if (error.response) {
      console.error(' Erro na API:', error.response.status, error.response.data);
      if (error.response.status === 401) {
        console.error(' Verifique o username e password. Credenciais inválidas.');
      }
    } else {
      console.error(' Erro de conexão:', error.message);
    }
  }
};

authenticate();