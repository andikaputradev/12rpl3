-- Migration 0016: Pembaruan Nama & Username Super Admin
-- Memperbarui profil super_admin menjadi Prof. Andika Putra Ph., D. dan slug andikaputra
UPDATE "public"."profiles"
SET
  "full_name" = 'Prof. Andika Putra Ph., D.',
  "slug" = 'andikaputra'
WHERE "role" = 'super_admin';
