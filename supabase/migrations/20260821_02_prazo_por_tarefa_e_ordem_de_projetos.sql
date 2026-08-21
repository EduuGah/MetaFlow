-- MetaFlow · 21/08/2026
-- Prazo em cada tarefa, e ordem manual na lista de projetos.
--
-- Rode este arquivo inteiro no SQL Editor do Supabase ANTES de publicar a
-- versão do app que usa esses campos. Tudo aqui é idempotente: rodar duas
-- vezes não faz estrago. Não depende do arquivo 01 nem ele deste.

alter table public.tasks    add column if not exists deadline date;
alter table public.projects add column if not exists position integer;

-- O painel hoje mostra os projetos do mais novo para o mais velho. O backfill
-- congela exatamente essa ordem em números, para que nada troque de lugar na
-- primeira vez que a tela abrir com a ordenação manual ligada.
-- `id` entra no desempate porque duas linhas podem nascer no mesmo instante.
with ordenado as (
  select
    id,
    row_number() over (partition by user_id order by created_at desc, id) as posicao
  from public.projects
)
update public.projects as p
set position = ordenado.posicao
from ordenado
where ordenado.id = p.id
  and p.position is null;

-- A listagem do painel é sempre "os projetos desta conta, em ordem".
create index if not exists projects_user_position_idx
  on public.projects (user_id, position);

-- `deadline` é `date`, não `timestamptz`, pelo mesmo motivo de projects.deadline:
-- prazo aqui é dia de calendário. Guardar hora traria fuso horário junto e
-- faria "vence hoje" mudar de resposta conforme onde a pessoa está.

-- As políticas de RLS já existentes cobrem as colunas novas: elas valem por
-- linha, não por coluna. Nada a acrescentar aqui.
