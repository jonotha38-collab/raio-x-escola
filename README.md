# Raio-X Jurídico da Escola

Página de captação de leads para uso em eventos (Geedu Connect e similares),
desenvolvida para a **Clara Machado Advocacia & Consultoria**.

Site estático puro — HTML, CSS e JavaScript sem framework e sem back-end.
Os leads capturados ficam salvos no `localStorage` do próprio dispositivo
usado para aplicar o diagnóstico (ideal: um único tablet/celular dedicado
ao estande).

## Estrutura do projeto

```
raiox-jurico-escola/
├── index.html          → estrutura da página (telas: intro, perguntas, formulário, resultado, painel da equipe)
├── css/
│   └── styles.css      → todo o estilo visual (identidade Clara Machado Advocacia)
├── js/
│   └── app.js          → toda a lógica (perguntas, pontuação, formulário, painel da equipe, CSV)
├── assets/
│   └── logo.png        → logo usada no cabeçalho e como favicon
├── vercel.json          → configuração mínima de deploy (headers de segurança)
└── README.md
```

## Antes de publicar — configurações obrigatórias

Abra `js/app.js` e edite o objeto `CONFIG` no topo do arquivo:

```js
var CONFIG = {
  firmWhatsApp: "5579900000000", // <-- troque pelo WhatsApp comercial real (formato 55DDDNUMERO, só dígitos)
  teamPin: "2026",               // <-- código de acesso do painel da equipe no estande
  storageKey: "raiox_leads_v1"
};
```

Sem isso, o botão "Falar com a equipe agora" do resultado vai abrir um
WhatsApp que não existe.

## Testar localmente

Não precisa de instalação. Duas opções:

**Opção 1 — abrir direto no navegador**
Dê duplo clique em `index.html`.

**Opção 2 — servidor local (recomendado, evita qualquer bloqueio de `file://`)**
```bash
npx serve .
# ou
python3 -m http.server 8080
```
Depois acesse `http://localhost:8080` (ou a porta indicada).

## Deploy no Vercel

**Opção A — pelo painel do Vercel (mais simples, sem terminal)**
1. Acesse [vercel.com](https://vercel.com) e crie uma conta (pode usar GitHub, Google ou e-mail).
2. Clique em **Add New → Project**.
3. Escolha **Deploy sem Git** / arraste a pasta `raiox-jurico-escola` inteira
   para a área de upload (ou importe de um repositório Git, se preferir
   subir o projeto para o GitHub antes).
4. Em "Framework Preset", deixe **Other** (é um site estático, não precisa
   de build).
5. Clique em **Deploy**. Em menos de um minuto você recebe uma URL pública
   (`algo.vercel.app`).

**Opção B — pelo terminal (Vercel CLI)**
```bash
npm install -g vercel     # instala a CLI (uma vez só)
cd raiox-jurico-escola    # entre na pasta do projeto
vercel login              # autentica com sua conta
vercel                    # gera um link de preview
vercel --prod             # publica na URL de produção
```

**Domínio próprio:** depois do primeiro deploy, em
`Project Settings → Domains`, você pode apontar um domínio ou subdomínio
próprio (ex. `raiox.claramachadoadvocacia.com.br`) para esta URL.

## Rotina de uso no evento

1. Abra a URL publicada no tablet/celular que ficará no estande.
2. Deixe a tela na tela inicial ("Iniciar diagnóstico").
3. Ao final de cada atendimento, toque em **Novo diagnóstico** para reiniciar
   para o próximo visitante — os dados do lead anterior já foram salvos.
4. Ao final do evento, toque em **Acesso da equipe** (rodapé), digite o
   código (`teamPin`), e clique em **Baixar CSV** para exportar todos os
   leads do dia. Depois disso, **Limpar todos os dados** deixa o
   dispositivo pronto para o próximo evento.

## Importante sobre os dados

Cada lead é salvo em **dois lugares ao mesmo tempo**:

1. **`localStorage` do dispositivo do estande** — funciona mesmo sem
   internet no local do evento, e é o que alimenta o painel da equipe
   (`Acesso da equipe` → estatísticas, tabela, CSV).
2. **Supabase** (tabela `raiox_leads`) — uma cópia central, em segundo
   plano, disponível de qualquer lugar depois do evento.

Se a internet do estande cair, o lead **não se perde**: continua garantido
no `localStorage` e você exporta o CSV normalmente ao final do dia.

### Configurar o Supabase (uma vez só)

1. No painel do Supabase, vá em **SQL Editor → New query**, cole o
   conteúdo de `supabase/schema.sql` e rode. Isso cria a tabela
   `raiox_leads` já com a segurança (RLS) configurada: o formulário público
   consegue **enviar** leads, mas ninguém consegue **ler** a lista usando a
   chave pública do site.
2. As credenciais já estão plugadas em `js/app.js` (objeto `CONFIG`) e
   também documentadas em `.env` (esse arquivo é só para referência/backup
   — como o site é estático puro, sem Next.js ou build, ele **não é lido
   pelo navegador**; o que realmente conecta é a cópia dentro de
   `js/app.js`).
3. Para conferir os leads depois do evento: Supabase → **Table Editor** →
   `raiox_leads`, ou pelo CSV exportado direto do painel da equipe.

Se um dia quiser trocar de projeto Supabase (ou girar a chave por
segurança), edite `supabaseUrl` e `supabaseKey` em `js/app.js` — é o único
lugar que precisa mudar.
