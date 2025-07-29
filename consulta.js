const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_CONSULTA_URL = 'https://api.predictus.com.br/predictus-api/processos/judiciais/buscarPorCPFParte';


function validarCPF(cpf) {
  const cpfNumerico = cpf.replace(/\D/g, '');
  if (cpfNumerico.length !== 11 || /^(\d)\1+$/.test(cpfNumerico)) return false;

  let soma = 0;
  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpfNumerico.substring(i - 1, i)) * (11 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfNumerico.substring(9, 10))) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpfNumerico.substring(i - 1, i)) * (12 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfNumerico.substring(10, 11))) return false;

  return true;
}

function getValidToken() {
  try {
    const data = fs.readFileSync('token.json', 'utf8');
    const { token, expiresAt } = JSON.parse(data);

    if (Date.now() >= expiresAt) {
      console.error(' Token expirado. Execute "node auth.js" para gerar um novo.');
      return null;
    }

    return token;
  } catch (err) {
    console.error(' Falha ao ler token.json:', err.message);
    console.log(' Execute: node auth.js para gerar um novo token.');
    return null;
  }
}


function salvarResultado(cpf, dados) {
  const nomeArquivo = `processos_${cpf}.json`;
  const caminho = path.join(__dirname, nomeArquivo);

  try {
    fs.writeFileSync(caminho, JSON.stringify(dados, null, 2), 'utf-8');
    console.log(` Resultado salvo em: ./${nomeArquivo}`);
  } catch (err) {
    console.error(' Erro ao salvar arquivo JSON:', err.message);
  }
}


async function consultarProcessos(cpf) {
  const cpfNumerico = cpf.replace(/\D/g, '');

  if (!validarCPF(cpfNumerico)) {
    console.error(' CPF inválido. Por favor, insira um CPF com 11 dígitos válidos.');
    return;
  }

  console.log(` Consultando processos para o CPF: ${cpfNumerico}...`);

  const token = getValidToken();
  if (!token) return;

  const payload = {
    cpf: cpfNumerico,
    
    grausProcesso: [1, 2, 3, 4],
    limiteResultados: 10000,
    segmentos: [
  "CNJ",
  "JUSTICA DO TRABALHO",
  "JUSTICA ELEITORAL",
  "JUSTICA ESTADUAL",
  "JUSTICA FEDERAL",
  "JUSTICA MILITAR",
  "STF",
  "STJ",
  "TST",
  "TSE",
  "STM"
],

   camposRetorno: {
      incluir: [
        "numeroProcessoUnico",
        "tribunal",
        "uf",
        "classeProcessual",
        "dataDistribuicao",
        "valorCausa",
        "statusProcesso",
        "partes",
        "advogadosSemParte",
        "classeProcessual",
        "assuntosCNJ",
        "temSentenca",
        "sentenca",
        "urlProcesso",
        "grauProcesso"
      ]
    }
  };

  try {
    console.log(' Enviando requisição à API...');

    const response = await axios.post(API_CONSULTA_URL, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
      validateStatus: null,
    });

    console.log(' Resposta recebida com status:', response.status);

    if (response.status === 204 || !response.data || (Array.isArray(response.data) && response.data.length === 0)) {
      console.log('ℹ Nenhum processo encontrado para este CPF.');
      salvarResultado(cpfNumerico, { cpf: cpfNumerico, totalProcessos: 0, processos: [] });
      return;
    }

    if (response.status === 200) {
      console.log(` Processos encontrados: ${response.data.length}`);
      console.log(JSON.stringify(response.data, null, 2));

      salvarResultado(cpfNumerico, {
        consulta: {
          cpf: cpfNumerico,
          timestamp: new Date().toISOString(),
          totalProcessos: response.data.length
        },
        processos: response.data
      });
      return;
    }

    console.error(' Erro inesperado:', response.status, response.data);
    salvarResultado(cpfNumerico, { erro: `Status ${response.status}`, dados: response.data });

  } catch (error) {
    if (error.response) {
      console.error(' Erro na API:', error.response.status, error.response.data);
      salvarResultado(cpfNumerico, { erro: `API ${error.response.status}`, dados: error.response.data });
    } else if (error.request) {
      console.error(' Nenhuma resposta da API. Timeout ou erro de rede.');
      salvarResultado(cpfNumerico, { erro: 'Sem resposta da API', detalhe: error.message });
    } else {
      console.error(' Erro ao configurar requisição:', error.message);
      salvarResultado(cpfNumerico, { erro: 'Erro interno', detalhe: error.message });
    }
  }
}


const inputCpf = process.argv[2];

if (!inputCpf) {
  console.log(' Nenhum CPF fornecido. Use: node consulta.js 12345678900');
  process.exit(1);
}

consultarProcessos(inputCpf);
