-- Operator-only, read-only reconciliation after a submission or cleanup outage.
-- Review the results before deleting anything in the Supabase Storage dashboard.
select o.name, o.created_at
from storage.objects as o
left join public.wedding_contributions as c on c.photo_path = o.name
where o.bucket_id = 'wedding-pending'
  and c.id is null
  and o.created_at < now() - interval '1 hour'
order by o.created_at;
