const https = require('https');
const axios = require('axios');

const token = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJtb292cmlzay5wcm9kdWNhbyIsImlhdCI6MTc1MzI3NzE3NywiZXhwIjoxNzUzMjc4OTc3fQ.rAU13w0E8NZHdcxlTuAO1c27xNtyteSQmtEO8MUOa4P5ym_E3j1c9A_0khc5HV0zkHzOwhunnqyfLGyXNsnSCQ';

axios.post(
  'https://api.predictus.com.br/predictus-api/processos/judiciais/buscarPorCPFParte',
  { cpf: '02392552916', limiteResultados: 10 },
  {
    headers: {
      'Authorization': `Bearer ${token.trim()}`,
      'Content-Type': 'application/json',
    },
    validateStatus: null 
  }
)
.then(resp => {
  console.log('Status:', resp.status);
  console.log('Resposta:', JSON.stringify(resp.data, null, 2));
})
.catch(err => {
  console.error('Erro:', err.message);
  if (err.response) {
    console.error('Detalhes:', err.response.status, err.response.data);
  }
});