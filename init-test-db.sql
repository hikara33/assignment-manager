-- init-test-db.sql
DO
$body$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'assignment_test') THEN
      CREATE DATABASE assignment_test;
   END IF;
END
$body$;