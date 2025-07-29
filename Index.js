const { exec } = require('child_process');
const fs = require('fs');
const readline = require('readline');


function perguntarCPF(callback) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Digite o CPF (com ou sem pontuação): ', (cpf) => {
    rl.close();
    callback(cpf.trim());
  });
}


function verificarToken(callback) {
  const maxTentativas = 5;
  let tentativas = 0;

  const checar = () => {
    if (fs.existsSync('token.json')) {
      const { token, expiresAt } = JSON.parse(fs.readFileSync('token.json', 'utf-8'));
      if (token && Date.now() < expiresAt) {
        return callback(true);
      }
    }

    tentativas++;
    if (tentativas < maxTentativas) {
      setTimeout(checar, 1000);
    } else {
      callback(false);
    }
  };

  checar();
}


perguntarCPF((cpf) => {
  if (!cpf) {
    console.log(' CPF não fornecido. Encerrando.');
    return;
  }

  console.log(' Autenticando...');
  exec('node auth.js', (erroAuth, stdoutAuth, stderrAuth) => {
    if (erroAuth) {
      console.error('Erro na autenticação:', stderrAuth || erroAuth.message);
      return;
    }

    console.log(stdoutAuth);

    verificarToken((sucesso) => {
      if (!sucesso) {
        console.error(' Token inválido. Autenticação falhou.');
        return;
      }

      console.log(' Executando consulta...');
      exec(`node consulta.js ${cpf}`, (erroConsulta, stdoutConsulta, stderrConsulta) => {
        if (erroConsulta) {
          console.error('Erro na consulta:', stderrConsulta || erroConsulta.message);
          return;
        }

        console.log(stdoutConsulta);
      });
    });
  });
});
