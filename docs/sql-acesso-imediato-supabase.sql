-- Ajuste os valores abaixo antes de rodar.
-- Objetivo: garantir clínica, perfil interno e metadata do auth.

insert into public.clinics (name, slug, plan)
values ('teste', 'teste', 'free')
on conflict (slug) do update
set name = excluded.name;

insert into public.users (id, clinic_id, name, email, role)
select
  au.id,
  c.id,
  'Nicolas moreira',
  au.email,
  'owner'
from auth.users au
join public.clinics c on c.slug = 'teste'
where au.email = 'nicoolascf5@gmail.com'
on conflict (id) do update
set
  clinic_id = excluded.clinic_id,
  name = excluded.name,
  email = excluded.email,
  role = excluded.role;

update auth.users
set raw_user_meta_data =
  coalesce(raw_user_meta_data, '{}'::jsonb) ||
  jsonb_build_object(
    'clinic_id', (select id::text from public.clinics where slug = 'teste' limit 1),
    'name', 'Nicolas moreira',
    'role', 'owner'
  )
where email = 'nicoolascf5@gmail.com';
