-- Fix the organization_id column to accept strings instead of UUID
ALTER TABLE content_library
ALTER COLUMN organization_id TYPE VARCHAR(255)
USING organization_id::VARCHAR(255);