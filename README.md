<div align="center">

<img src="public/icon.svg" width="72" alt="Marca do MetaFlow: um mostrador de progresso" />

# MetaFlow

**Uma meta só avança quando vira tarefa.**

Aplicativo web para dividir projetos pessoais em tarefas e subtarefas.
O percentual de progresso é calculado a partir do que foi concluído — não existe barra para arrastar.

[Como executar](#como-executar) · [Arquitetura](#arquitetura) · [Decisões](#decisões-de-projeto) · [Publicação](#publicação)

</div>

![Painel do MetaFlow, com o resumo de tarefas, os filtros de prazo e a lista de projetos](docs/painel.png)

<sub>Painel com projetos de exemplo.</sub>

---

## O que ele faz

| | |
| --- | --- |
| **Projetos com prazo e área** | Cada projeto pertence a uma área (Trabalho, Estudos, Saúde… ou as suas) e pode ter uma data-alvo. |
| **Tarefas em três níveis** | Tarefa → etapa → subetapa. Cada nível tem recuo, peso de texto e fio próprios; o limite é de leitura, não técnico. |
| **Progresso calculado** | O percentual vem da razão entre tarefas concluídas e totais. Ninguém digita "70% pronto". |
| **Importação de markdown** | Cole um plano gerado numa conversa — títulos com `#`, itens `- [ ]` — e ele vira projeto com a hierarquia montada. Prévia antes de gravar. |
| **Prazo por tarefa** | Independente do prazo do projeto, com a mesma leitura: atrasado, vence hoje, faltam N dias. |
| **Notas, ordem manual e desfazer** | Anotação livre em qualquer linha, ordem por setas ou arrastando, e exclusão reversível por oito segundos. |
| **Tarefas recorrentes** | Sete intervalos, de 15 minutos a semanal. Vencido o intervalo, a tarefa volta para "a fazer" ao abrir o projeto. |
| **Lista e quadro kanban** | A mesma informação em duas leituras: lista para trabalhar item a item, quadro para ver o que travou. |
| **Busca e filtros** | Busca no painel alcança título, área e os títulos das tarefas dentro de cada projeto. Os filtros do projeto mostram quantas linhas cada opção tem. |
| **Avisos de prazo** | Notificação do sistema, uma por dia, ao abrir o painel. Sem servidor de push — é o que dá para prometer. |
| **Instalável (PWA)** | Abre direto no painel a partir da tela inicial do celular ou do desktop. |
| **Isolamento por conta** | Feito por Row Level Security no PostgreSQL, não por verificação na interface. |

---

## Pilha

| Camada | Escolha | Por quê |
| --- | --- | --- |
| Interface | React 19 · TypeScript estrito · Vite 8 | Build rápido, tipos verificados no `npm run build`. |
| Rotas | react-router-dom 7 | Divisão de código por rota, com as telas autenticadas sob demanda. |
| Estilo | Tailwind CSS 3 sobre tokens em CSS custom properties | Um vocabulário só, consumido por Tailwind e por CSS puro. |
| Tipografia | Archivo (variável) · IBM Plex Sans · IBM Plex Mono | Auto-hospedadas: nenhuma requisição a terceiros. |
| Dados e sessão | Supabase — PostgreSQL, Auth com Google (PKCE), RLS | Back-end gerenciado com autorização no banco. |
| PWA | vite-plugin-pwa (Workbox) | Instalação e casca offline. |
| Qualidade | oxlint · vitest | Lint e testes da lógica de negócio. |

**Sete dependências de runtime** — três delas são arquivos de fonte. Não há biblioteca de ícones
(os ícones em uso estão em `src/components/Icon.tsx`, todos na mesma grade de 24px), nem
biblioteca de animação (o movimento é CSS), nem utilitário de classes (são seis linhas em
`src/lib/utils.ts`), nem biblioteca de arrastar-e-soltar (é a API do próprio navegador, sempre
com um caminho alternativo por teclado e toque ao lado).

---

## Como executar

Requisitos: Node.js 20 ou superior e um projeto no Supabase.

```bash
git clone https://github.com/EduuGah/metaflow.git
cd metaflow
npm install
cp .env.local.exemple .env.local   # preencha as variáveis
npm run dev
```

### Migrações do banco

Antes de subir o app, rode os arquivos de `supabase/migrations/` no **SQL Editor** do seu
projeto Supabase, em ordem. São idempotentes: rodar de novo não faz estrago.

| Arquivo | O que acrescenta |
| --- | --- |
| `20260821_01_tarefas_notas_e_ordem.sql` | `tasks.notes`, `tasks.position` |
| `20260821_02_prazo_por_tarefa_e_ordem_de_projetos.sql` | `tasks.deadline`, `projects.position` |

Sem eles o app abre, mas salvar nota, prazo de tarefa ou nova ordem devolve erro do banco.

### Variáveis de ambiente

```bash
# Obrigatórias
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<chave anon>

# Opcional — o domínio de produção, com esquema. Gera as URLs canônicas, as
# tags Open Graph e o sitemap.xml no build. Deixe vazia em desenvolvimento:
# sem ela o app usa a origem atual do navegador, que é o correto localmente.
VITE_SITE_URL=https://<seu-dominio>
```

> [!IMPORTANT]
> Use **somente** a chave `anon`. Ela é pública por desenho — identifica o projeto, não o
> usuário — e todo o controle de acesso mora nas políticas do banco. A chave `service_role`
> ignora essas políticas e nunca deve chegar ao navegador.
> O `.env.local` já é ignorado pelo git (regra `*.local`).

Sem as variáveis o app não quebra em tela branca: exibe uma tela explicando o que falta.

### Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Checagem de tipos (`tsc -b`) e build de produção |
| `npm run preview` | Serve o build local |
| `npm run lint` | oxlint |
| `npm test` | 65 testes unitários de prazos, recorrência, progresso, ordenação, árvore, importação e redação de logs |

---

## Arquitetura

```
src/
├── components/          peças de interface reutilizáveis
│   └── task/            lista, quadro e selos de tarefa
├── context/             AuthContext (sessão) · ToastContext (avisos)
├── lib/                 lógica pura e integrações — sem JSX
│   └── __tests__/       testes da lógica de negócio
├── pages/               uma por rota
├── types/               contratos das tabelas
└── index.css            tokens do design system

supabase/migrations/     SQL a rodar no painel do Supabase
```

**`src/lib` não conhece React.** Classificação de prazo, reabertura de tarefas recorrentes,
cálculo de progresso, ordenação, percurso da árvore, leitura de markdown e redação de dados
sensíveis em log são funções puras — por isso são testáveis sem montar componente nem subir
banco. É onde mora quase toda a regra do produto:

| Módulo | Responsabilidade |
| --- | --- |
| `deadline.ts` | Atrasado, vence hoje, faltam N dias — a partir de um dia de calendário |
| `recurrence.ts` | Quais tarefas recorrentes já venceram o intervalo |
| `progress.ts` | Concluídas sobre totais, sem dividir por zero |
| `order.ts` | Ordem manual: posição, mover, índice de encaixe ao arrastar |
| `tree.ts` | Descendentes de uma tarefa, à prova de vínculo circular |
| `markdownImport.ts` | Documento colado → árvore de projeto |
| `deadlineAlerts.ts` | Texto do aviso de prazo e o limite de um por dia |

**Uma assinatura de sessão para o app inteiro.** `AuthProvider` resolve a sessão uma vez e
propaga; o cliente do Supabase entra por import dinâmico, então a página pública não carrega
os 208 kB dele para renderizar texto.

<table>
<tr>
<td width="66%"><img src="docs/projeto.png" alt="Tela de projeto: mostrador de progresso, campo de nova tarefa, filtros e lista com subtarefas" /></td>
<td width="34%"><img src="docs/celular.png" alt="A mesma tela de projeto no celular, com as ações reorganizadas para o toque" /></td>
</tr>
<tr>
<td align="center"><sub>Tela de projeto — visão em lista</sub></td>
<td align="center"><sub>A mesma tela no celular</sub></td>
</tr>
</table>

**Rotas**

| Rota | Acesso |
| --- | --- |
| `/` | pública — apresentação do produto |
| `/login` | pública |
| `/privacidade`, `/termos` | públicas |
| `/dashboard` | autenticada |
| `/dashboard/:id` | autenticada |
| `*` | página 404 própria |

### Banco de dados

Duas tabelas, `projects` e `tasks`, com RLS ligado. As políticas limitam cada linha ao seu
dono (`auth.uid() = user_id` em `projects`; em `tasks`, pelo vínculo com `project_id`).
A aplicação nunca filtra por usuário no cliente — quem separa as contas é o banco.

`tasks.parent_id` aponta para a linha de cima e é o que forma a árvore: a mesma coluna serve
para etapa e para subetapa, então o banco aceitaria qualquer profundidade — o teto de três
níveis é decisão de interface, não do esquema (`MAX_DEPTH`, em `src/lib/tree.ts`).

`position` guarda a ordem manual em ambas as tabelas, e é 0-based no app: só a comparação
entre irmãos importa, nunca o valor absoluto. Linha sem posição vai para o fim entre tarefas
e para o topo entre projetos — os dois padrões estão travados por teste em `order.test.ts`,
porque a assimetria parece defeito quando lida fora de contexto.

---

## Decisões de projeto

<details>
<summary><strong>O mostrador é o produto, não um enfeite</strong></summary>

<br>

O anel de progresso aparece em três lugares — resumo do painel, linha de projeto e cabeçalho
do projeto — sempre lendo a mesma coisa. As marcações só são desenhadas acima de 44px, porque
abaixo disso viram ruído. O número fica em mono tabular, então não "dança" ao ir de 9% para 10%.
A marca do produto é esse mesmo desenho congelado em 72%: o logotipo é a peça de interface
mais usada, não um símbolo à parte.

</details>

<details>
<summary><strong>Três acentos, significado fixo</strong></summary>

<br>

Âmbar é ação e atenção. Ciano é progresso e conclusão. Coral é risco. Nenhuma cor entra por
decoração, e só a ação principal da tela recebe âmbar. Todos os pares texto/superfície foram
medidos: mínimo de 4.5:1 para texto e 3:1 para bordas de controle. Os valores medidos estão
comentados ao lado de cada token em `src/index.css`.

</details>

<details>
<summary><strong>O celular não é o desktop espremido</strong></summary>

<br>

Diálogos sobem como folha inferior, ao alcance do polegar. A ação principal do painel vira
barra fixa no rodapé, respeitando a área segura. O quadro kanban rola na horizontal com
encaixe e deixa uma fresta da próxima coluna à mostra. Descrições de projeto somem — cortadas
em uma linha não informam nada e o espaço vale mais para o título.

</details>

<details>
<summary><strong>Aviso só quando há algo a dizer</strong></summary>

<br>

Marcar uma tarefa não dispara aviso na tela: o sucesso já está visível na caixa marcada, e
quem conclui dez subtarefas seguidas não quer dez mensagens. A alteração é otimista e desfaz
sozinha se a escrita falhar. Para leitores de tela, cada mudança é anunciada em uma região
`aria-live`. Avisos idênticos em sequência viram um só, e a contagem para desaparecer pausa
com o ponteiro ou o foco em cima.

</details>

<details>
<summary><strong>Erro do banco não vai cru para a tela</strong></summary>

<br>

Mensagens do PostgreSQL revelam nomes de tabela, coluna e política. Tudo passa por
`src/lib/logger.ts`, que traduz os códigos conhecidos para linguagem comum e redige
token, senha e e-mail antes de qualquer escrita em log. O mesmo módulo tem um ponto de
extensão para um coletor externo, sem tocar em nenhum componente.

</details>

<details>
<summary><strong>Movimento que funciona desligado</strong></summary>

<br>

Nenhuma animação carrega informação sozinha. Transições existem para estados — foco, seleção,
carregamento, entrada de diálogo — e duram entre 130 e 260 ms. `prefers-reduced-motion`
desliga tudo, menos o giro dos indicadores de carregamento, que comunicam que algo está em
curso. O layout foi desenhado para ficar bom parado.

</details>

<details>
<summary><strong>Arrastar é atalho, nunca o único caminho</strong></summary>

<br>

Dá para arrastar cards entre colunas do quadro e linhas dentro da lista. Nenhuma das duas
coisas é a única forma de fazer aquilo: o card tem um seletor de coluna no pé, e a tarefa de
topo tem setas de subir e descer. Arrastar não existe no toque e não é alcançável pelo
teclado — uma função que só se acessa segurando o botão do mouse é uma função que parte dos
usuários não tem.

O lado do encaixe é calculado da geometria no momento da soltura, e não lido de estado do
React. `dragover` é evento contínuo: seu `setState` não é descarregado na hora, e num arrasto
rápido a soltura acontecia com o valor ainda vazio — falhava em silêncio, de vez em quando.

</details>

<details>
<summary><strong>O importador lê a bagunça que existe, não o markdown ideal</strong></summary>

<br>

Planos escritos por assistente de conversa saem com os níveis desalinhados: `#` para o título
e também para algumas seções, `##` para outras. Calcular profundidade contando `#` funciona no
documento de exemplo e erra no documento real — foi o que aconteceu, e o resultado punha
`### 1.2` dentro de `### 1.1`.

A profundidade vem de uma pilha: um título entra sob o último título mais raso que ele, como
qualquer sumário se monta. Prosa, tabela, citação e bloco de código são ignorados, porque num
plano eles explicam e não são tarefa. O que passa do terceiro nível vira anotação na etapa
acima, em vez de sumir ou de virar irmão de quem era seu pai.

</details>

---

## Qualidade

| | |
| --- | --- |
| **Tipos** | `strict` ligado; a build falha em erro de tipo |
| **Testes** | 65 testes sobre a lógica de negócio, incluindo o caso de fuso horário que fazia prazos recuarem um dia e o documento de níveis desalinhados que quebrava o importador |
| **Acessibilidade** | Navegação por teclado, foco preso em diálogos com devolução ao elemento de origem, rótulo em todo campo, `aria-live` para mudanças silenciosas, zoom liberado, contraste AA |
| **Responsividade** | Verificada de 320px a 1920px, sem overflow horizontal |
| **Performance** | 83 kB gzip no carregamento inicial; cliente do Supabase em pedaço separado, sob demanda |
| **Segurança** | CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` e COOP; OAuth por PKCE |
| **SEO** | Título, descrição e canônica por rota; Open Graph; `robots.txt`; sitemap gerado no build; dados estruturados |

---

## Publicação

Preparado para Vercel. O `vercel.json` traz o rewrite de SPA, os cabeçalhos de segurança e o
cache imutável dos arquivos com hash.

1. Defina `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `VITE_SITE_URL` nas variáveis do projeto.
2. Inclua a URL de produção na lista de redirecionamentos permitidos do Supabase Auth.
3. As telas autenticadas já saem com `noindex`; o `robots.txt` mantém os rastreadores fora delas.

---

<div align="center">
<sub>Feito por <a href="https://github.com/EduuGah">Eduardo</a></sub>
</div>
