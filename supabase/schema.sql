-- ============================================================
-- Raio-X Jurídico da Escola — tabela de leads no Supabase
-- Rode este script uma vez em: Supabase → SQL Editor → New query
-- ============================================================

create table if not exists public.raiox_leads (
  id             bigint generated always as identity primary key,
  created_at     timestamptz not null default now(),
  captured_at    timestamptz,          -- horário registrado no dispositivo do estande
  nome           text not null,
  escola         text not null,
  cargo          text,
  alunos         text,                 -- faixa (ex.: "301 a 600")
  whatsapp       text,
  preocupacao    text,
  indice         int,                  -- 0 a 100
  pontos_atencao int,                  -- quantidade de perguntas "Não"
  pilar_fraco    text,
  pilar_scores   jsonb,                -- pontuação detalhada por pilar
  origem         text default 'geedu-connect'
);

-- Habilita Row Level Security (obrigatório para usar a publishable key com segurança)
alter table public.raiox_leads enable row level security;

-- Permite que o formulário público (usando a publishable key) INSIRA leads...
create policy "Permitir envio de novos leads"
  on public.raiox_leads
  for insert
  to anon
  with check (true);

-- ...mas NINGUÉM consegue LER a lista de leads usando essa mesma chave pública.
-- Só quem acessa pelo painel do Supabase (ou com a service_role key, que nunca
-- deve ir para o navegador) consegue consultar os dados.
-- Ou seja: não é preciso criar nenhuma política de "select" — a ausência dela
-- já bloqueia a leitura por padrão com RLS habilitado.

-- Para consultar os leads depois do evento:
--   Supabase → Table Editor → raiox_leads
-- ou, no SQL Editor:
--   select * from public.raiox_leads order by created_at desc;
