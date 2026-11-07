# TAO Planilhas

Aplicação de planejamento de corrida da TAO Performance, construída com HTML, CSS e JavaScript.

## Executar

Requer Node.js 22 ou superior (versão recomendada em `.nvmrc`).

```sh
npm start
```

Abra http://127.0.0.1:3000. Não é necessário instalar dependências.
Para escolher outra porta, defina a variável de ambiente `PORT`.
O servidor local atende somente o computador atual por padrão.

## Verificar

```sh
npm run check
```

Confere a estrutura básica do HTML e a sintaxe dos scripts. A mesma verificação roda no GitHub Actions em pushes e pull requests. Esta verificação não substitui testes funcionais no navegador.

## Estrutura

- `index.html`: entrada principal, com a aplicação original.
- `Tao performance-(2).html`: arquivo original preservado como referência. Alterações futuras devem ser feitas em `index.html`.
- `scripts/serve.mjs`: servidor local sem dependências.
- `scripts/check.mjs`: verificação do código.

## Dados e acesso

No navegador comum, os dados são salvos no localStorage, na chave `passada_v1`. São específicos do navegador e da origem (protocolo, domínio e porta); não há sincronização entre dispositivos. Limpar os dados do navegador pode apagar os registros. Ao mudar o endereço de acesso, os registros existentes não são transferidos automaticamente.

A alternância entre professor e aluno é uma função de interface, não um sistema de autenticação. O projeto atual não possui backend, contas individuais ou banco de dados remoto.

Fontes do Google Fonts e gráficos do Chart.js 4.4.0 são carregados por serviços externos e precisam de internet.

## Hospedagem

O projeto é estático: basta servir `index.html` na raiz de uma hospedagem HTTPS. Não há etapa de build nem variáveis secretas a configurar. Esta configuração não publica o sistema automaticamente.

Antes de usar dados reais em um ambiente compartilhado, implemente autenticação, autorização e armazenamento adequado no servidor.
