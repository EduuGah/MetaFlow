-- MetaFlow · 21/08/2026
-- Duas colunas em `tasks`: anotação livre e ordem manual.
--
-- Rode este arquivo inteiro no SQL Editor do Supabase ANTES de publicar a
-- versão do app que usa esses campos. Tudo aqui é idempotente: rodar duas
-- vezes não faz estrago.

alter table public.tasks add column if not exists notes text;
alter table public.tasks add column if not exists position integer;

-- A ordem que já existe na tela é a de criação. O backfill congela essa mesma
-- ordem em números, dentro de cada projeto e de cada tarefa-pai, para que
-- nada mude de lugar na primeira vez que alguém abrir a lista.
-- `id` entra no desempate porque duas linhas podem nascer no mesmo instante.
with ordenado as (
  select
    id,
    row_number() over (partition by project_id, parent_id order by created_at, id) as posicao
  from public.tasks
)
update public.tasks as t
set position = ordenado.posicao
from ordenado
where ordenado.id = t.id
  and t.position is null;

-- A leitura da lista sempre filtra por projeto e ordena por posição.
create index if not exists tasks_project_parent_position_idx
  on public.tasks (project_id, parent_id, position);

-- As políticas de RLS já existentes cobrem as colunas novas: elas valem por
-- linha, não por coluna. Nada a acrescentar aqui.
