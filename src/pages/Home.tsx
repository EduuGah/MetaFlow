import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import SiteFooter from '../components/SiteFooter';
import ProgressDial from '../components/ProgressDial';
import { useAuth } from '../context/AuthContext';
import { useSeo } from '../lib/seo';

/**
 * Página pública.
 *
 * Todo o conteúdo aqui descreve o que o aplicativo realmente faz. Não há
 * depoimentos, logotipos de clientes, números de uso, tabela de preços nem
 * selos: nada disso existe neste projeto, e inventar seria mentir para quem lê.
 */

const STEPS = [
  {
    n: '01',
    title: 'Abra um projeto',
    body: 'Um título, uma área e — se existir — uma data-alvo. É o recipiente da meta, não uma ficha para preencher.',
  },
  {
    n: '02',
    title: 'Quebre em etapas',
    body: 'Cada meta recebe tarefas, e cada tarefa pode ter subtarefas. A prioridade fica na própria tarefa, não numa aba separada.',
  },
  {
    n: '03',
    title: 'Acompanhe o mostrador',
    body: 'O percentual vem das tarefas concluídas. Ninguém digita "70% pronto" — o número é consequência do que foi feito.',
  },
];

const CAPABILITIES = [
  {
    term: 'Lista e quadro, mesma informação',
    desc: 'A lista serve para trabalhar item a item; o quadro mostra o que travou em "em andamento". Alternar não muda nem duplica nada.',
  },
  {
    term: 'Tarefas que voltam sozinhas',
    desc: 'Marque uma tarefa como recorrente e, passado o intervalo, ela volta para "a fazer" na próxima vez que você abrir o projeto.',
  },
  {
    term: 'Prazos com leitura direta',
    desc: 'Atrasado, vence hoje, faltam N dias. O painel filtra por essas três situações em vez de exigir que você compare datas.',
  },
  {
    term: 'Áreas em vez de etiquetas soltas',
    desc: 'Trabalho, estudos, saúde — ou as suas próprias. Cada projeto pertence a uma área e o painel filtra por ela.',
  },
  {
    term: 'Instalável como aplicativo',
    desc: 'É um PWA: dá para fixar na tela inicial do celular ou do desktop e abrir direto no painel, sem passar pelo navegador.',
  },
  {
    term: 'Cada conta vê só o que é dela',
    desc: 'A separação é feita no banco de dados, por políticas de Row Level Security, e não por uma verificação na tela.',
  },
];

const FAQ = [
  {
    q: 'Preciso criar uma senha?',
    a: 'Não. O acesso é feito com a sua conta Google. O MetaFlow não guarda senha nenhuma — a autenticação fica com o Google e com o Supabase.',
  },
  {
    q: 'Como funciona exatamente uma tarefa recorrente?',
    a: 'Você escolhe o intervalo (de 15 minutos a semanal). Quando conclui a tarefa, a hora fica registrada. Se o intervalo já tiver passado na próxima vez que você abrir o projeto, ela volta para "a fazer" automaticamente. A verificação acontece ao abrir o projeto, não em segundo plano — o app não envia lembrete no horário.',
  },
  {
    q: 'Funciona sem internet?',
    a: 'A interface abre sem conexão, porque o aplicativo fica guardado no dispositivo. Os projetos e tarefas, porém, vivem no servidor: para ver e alterar os dados é preciso estar online.',
  },
  {
    q: 'Uso no celular e no computador ao mesmo tempo?',
    a: 'Sim. Os dados ficam na sua conta, não no aparelho. Entre com o mesmo login e o painel é o mesmo nos dois — recarregue a página para trazer o que mudou do outro lado.',
  },
  {
    q: 'Onde ficam meus dados e quem consegue lê-los?',
    a: 'Em um banco PostgreSQL hospedado no Supabase. O acesso é controlado por políticas no próprio banco, que limitam cada linha ao usuário dono. Detalhes na página de Privacidade.',
  },
];

export default function Home() {
  const { user } = useAuth();
  useSeo({
    path: '/',
    title: 'metas divididas em tarefas, com progresso calculado',
    description:
      'MetaFlow organiza projetos pessoais em tarefas e subtarefas, com prazos, prioridades, recorrência e quadro kanban. O progresso é calculado a partir do que foi concluído.',
  });

  const heroCtaRef = useRef<HTMLDivElement>(null);
  const [showDock, setShowDock] = useState(false);

  // A barra fixa do celular só aparece depois que o botão do topo sai de vista.
  // Enquanto o CTA original está visível, ela seria apenas ruído sobre o texto.
  useEffect(() => {
    const node = heroCtaRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setShowDock(!entry.isIntersecting), {
      rootMargin: '-72px 0px 0px 0px',
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const primaryHref = user ? '/dashboard' : '/login';
  const primaryLabel = user ? 'Abrir o painel' : 'Entrar com o Google';

  return (
    <div className="min-h-dvh flex flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* ---------------- Abertura ---------------- */}
        <section className="shell pt-14 pb-16 sm:pt-20 sm:pb-24 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
          <div className="max-w-prose">
            <p className="eyebrow">Metas · tarefas · progresso</p>

            <h1 className="text-4xl sm:text-5xl mt-5">
              Uma meta só avança quando vira <span className="text-signal">tarefa</span>.
            </h1>

            <p className="text-lg text-fg-muted mt-6">
              O MetaFlow guarda os seus projetos, quebra cada um em tarefas e subtarefas e calcula sozinho o quanto
              já andou. Nada de barra de progresso que você mesmo arrasta.
            </p>

            <div ref={heroCtaRef} className="flex flex-col sm:flex-row gap-3 mt-9">
              <Link to={primaryHref} className="btn btn-primary btn-lg">
                {primaryLabel}
              </Link>
              <a href="#como-funciona" className="btn btn-secondary btn-lg">
                Ver como funciona
              </a>
            </div>

            <p className="text-sm text-fg-soft mt-5">
              Acesso pela conta Google. Sem senha nova, sem cadastro em duas etapas.
            </p>
          </div>

          {/* Amostra da interface real: os mesmos componentes usados no painel,
              com conteúdo de exemplo declarado como tal. */}
          <figure className="panel overflow-hidden">
            <figcaption className="px-4 py-2.5 border-b border-edge text-2xs font-mono uppercase tracking-[0.14em] text-fg-soft">
              Exemplo de uma linha do painel
            </figcaption>
            <ul className="divide-y divide-edge">
              {[
                { title: 'Reforma da cozinha', area: 'Pessoal', done: 3, total: 8, tag: 'Faltam 6 dias', tone: 'flow' },
                { title: 'TCC — capítulo 2', area: 'Estudos', done: 9, total: 10, tag: 'Vence hoje', tone: 'signal' },
                { title: 'Treino de força', area: 'Saúde', done: 2, total: 12, tag: 'semanal', tone: null },
              ].map((row) => (
                <li key={row.title} className="flex items-center gap-3.5 px-4 py-4">
                  <ProgressDial
                    value={Math.round((row.done / row.total) * 100)}
                    size={46}
                    label={`Exemplo: ${row.title}`}
                    tone={row.done === 0 ? 'signal' : 'flow'}
                  />
                  {/* Mesma anatomia da linha real do painel: título e prazo na
                      primeira linha, leitura numérica embaixo. */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{row.title}</p>
                      <span
                        className="chip chip-static text-2xs"
                        style={
                          row.tone === 'signal'
                            ? { color: 'var(--c-signal)', borderColor: 'var(--c-signal)' }
                            : row.tone === 'flow'
                              ? { color: 'var(--c-flow)', borderColor: 'var(--c-flow-soft)' }
                              : undefined
                        }
                      >
                        {row.tag}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-fg-soft mt-1.5">
                      {row.area} · {row.done}/{row.total} tarefas
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </figure>
        </section>

        {/* ---------------- Como funciona ---------------- */}
        <section id="como-funciona" className="panel-flush py-16 sm:py-20 scroll-mt-16">
          <div className="shell">
            <h2 className="text-2xl sm:text-3xl max-w-narrow">Três passos, e o número passa a se manter sozinho</h2>

            <ol className="mt-12 grid gap-px sm:grid-cols-3 bg-edge">
              {STEPS.map((step) => (
                <li key={step.n} className="bg-panel p-6 sm:p-7">
                  <span className="font-mono text-sm text-signal">{step.n}</span>
                  <h3 className="text-lg mt-3">{step.title}</h3>
                  <p className="text-sm text-fg-muted mt-2.5">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------------- O que tem dentro ---------------- */}
        <section className="shell py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl max-w-narrow">O que existe no aplicativo hoje</h2>
          <p className="text-fg-muted mt-4 max-w-prose">
            A lista abaixo descreve funções que já estão no ar. Não há nada aqui esperando por uma versão futura.
          </p>

          <dl className="mt-10 grid sm:grid-cols-2 gap-x-12">
            {CAPABILITIES.map((item) => (
              <div key={item.term} className="hairline py-5">
                <dt className="font-display font-semibold">{item.term}</dt>
                <dd className="text-sm text-fg-muted mt-1.5">{item.desc}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ---------------- Perguntas ---------------- */}
        <section className="shell pb-8 sm:pb-12">
          <h2 className="text-2xl sm:text-3xl">Perguntas que aparecem antes do primeiro projeto</h2>

          <div className="mt-8 max-w-narrow">
            {FAQ.map((item) => (
              <details key={item.q} className="group hairline">
                <summary className="flex items-start justify-between gap-4 py-5 cursor-pointer list-none rounded-md">
                  <span className="font-medium">{item.q}</span>
                  <span
                    aria-hidden="true"
                    className="mt-1 shrink-0 text-fg-soft transition-transform duration-200 group-open:rotate-45"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <p className="text-sm text-fg-muted pb-6 pr-10 max-w-prose">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ---------------- Fecho ---------------- */}
        <section className="shell pb-4">
          <div className="panel p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h2 className="text-xl">Comece pelo projeto que está parado há mais tempo</h2>
              <p className="text-sm text-fg-muted mt-2">
                Leva menos de um minuto: entrar, dar um nome ao projeto e listar as três primeiras tarefas.
              </p>
            </div>
            <Link to={primaryHref} className="btn btn-primary btn-lg shrink-0">
              {primaryLabel}
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />

      {/* Reserva a altura da barra fixa para que ela nunca cubra o rodapé. */}
      <div
        aria-hidden="true"
        className="sm:hidden"
        style={{ height: 'calc(var(--dock-h) + env(safe-area-inset-bottom, 0px))' }}
      />

      {/* Barra fixa só no celular, só depois do primeiro CTA sair da tela. */}
      <div
        className="sm:hidden fixed inset-x-0 bottom-0 z-40 border-t border-edge shadow-dock transition-transform duration-200"
        style={{
          background: 'var(--c-panel)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          transform: showDock ? 'none' : 'translateY(110%)',
        }}
        aria-hidden={!showDock}
      >
        <div className="px-4 py-3">
          <Link to={primaryHref} className="btn btn-primary btn-lg w-full" tabIndex={showDock ? 0 : -1}>
            {primaryLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
