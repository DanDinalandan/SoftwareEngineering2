-- Demo data for local development.
-- Password for every inserted account below: Password123!
-- Hash generated with bcrypt cost 10; replace before production.

insert into public.providers (id, email, password_hash, first_name, last_name, license, department, phone)
values (
  '11111111-1111-1111-1111-111111111111',
  'provider@unvapeify.test',
  '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiVMVnLr6Y1y7YJk6V5Y70oD9q7JkA2',
  'Nursita',
  'Santos',
  'RN-2026-001',
  'Cessation Clinic',
  '+63 912 345 6789'
) on conflict (email) do nothing;

insert into public.app_users
  (id, email, username, password_hash, role, first_name, last_name, birthday, age, gender, phone, streak, total_points, last_relapse_risk, profile_complete, vape_types)
values
  ('22222222-2222-2222-2222-222222222222', 'louise@unvapeify.test', 'louise', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiVMVnLr6Y1y7YJk6V5Y70oD9q7JkA2', 'Vape User', 'Louise', 'Reyes', '04/12/2004', 22, 'Female', '+63 917 000 0001', 14, 320, 28, true, array['Disposable', 'Pod']),
  ('33333333-3333-3333-3333-333333333333', 'marco@unvapeify.test', 'marco', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiVMVnLr6Y1y7YJk6V5Y70oD9q7JkA2', 'Vape User', 'Marco', 'Kalaw', '08/03/2007', 19, 'Male', '+63 917 000 0002', 0, 90, 78, true, array['Disposable']),
  ('44444444-4444-4444-4444-444444444444', 'ana@unvapeify.test', 'ana', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiVMVnLr6Y1y7YJk6V5Y70oD9q7JkA2', 'Vape User', 'Ana', 'Navarro', '02/20/1998', 28, 'Female', '+63 917 000 0003', 30, 760, 14, true, array['Pod'])
on conflict (email) do nothing;

insert into public.mood_logs
  (user_id, log_date, mood, triggers, craving, vaped, puffs_today, comment, relapse_risk, points, display_timestamp)
values
  ('22222222-2222-2222-2222-222222222222', current_date, 'Okay', array['Stress', 'Social'], 5, false, 0, 'Felt stressed, used breathing exercises.', 45, 25, 'Today 8:14 AM'),
  ('22222222-2222-2222-2222-222222222222', current_date - interval '1 day', 'Bad', array['Boredom'], 7, false, 0, 'Cravings hit hard in the evening.', 61, 25, 'Yesterday 9:03 PM'),
  ('33333333-3333-3333-3333-333333333333', current_date, 'Awful', array['Stress'], 9, true, 12, 'Gave in today. Really struggling.', 78, 10, 'Today 10:42 AM'),
  ('33333333-3333-3333-3333-333333333333', current_date - interval '1 day', 'Awful', array['Stress', 'Sadness'], 9, true, 9, 'Two difficult days in a row.', 82, 10, 'Yesterday 7:45 PM'),
  ('44444444-4444-4444-4444-444444444444', current_date, 'Good', array['Social'], 2, false, 0, 'Feeling proud. 30 days today.', 14, 25, 'Today 6:30 PM'),
  ('44444444-4444-4444-4444-444444444444', current_date - interval '1 day', 'Great', array[]::text[], 1, false, 0, 'Best day in weeks.', 9, 25, 'Yesterday 6:10 PM')
on conflict (user_id, log_date) do nothing;

insert into public.notifications (to_user_id, from_user_id, type, title, icon, message, read, display_timestamp)
values
  ('33333333-3333-3333-3333-333333333333', null, 'alert', 'High relapse risk - Marco K.', '🚨', 'Craving intensity spiked to 9/10. Recommend immediate check-in.', false, 'Today 10:42 AM'),
  ('22222222-2222-2222-2222-222222222222', null, 'info', 'Mood log submitted - Louise R.', '📋', 'Patient completed today''s mood and craving log. Mood: Okay.', false, 'Today 8:14 AM'),
  ('44444444-4444-4444-4444-444444444444', null, 'success', '30-day milestone - Ana N.', '🏆', 'Patient reached 30 vape-free days. Consider a follow-up to reinforce progress.', true, 'Today 6:30 PM');

insert into public.messages (from_user_id, to_user_id, subject, text, display_timestamp, read_by_provider)
values
  ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'Check-in after dinner trigger', 'Hi nurse, I had a tough time at dinner but I did not vape.', 'Today 9:20 PM', false),
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'I missed my log, sorry', 'I forgot to log the past two days. I have been really stressed.', 'Yesterday 11:05 AM', false),
  ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', '30 days', 'I cannot believe I made it to 30 days. Thank you so much!', 'Today 6:45 PM', true);

