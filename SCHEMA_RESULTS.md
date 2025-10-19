| column_name                 | data_type                |
| --------------------------- | ------------------------ |
| instance_id                 | uuid                     |
| id                          | uuid                     |
| aud                         | character varying        |
| role                        | character varying        |
| email                       | character varying        |
| encrypted_password          | character varying        |
| email_confirmed_at          | timestamp with time zone |
| invited_at                  | timestamp with time zone |
| confirmation_token          | character varying        |
| confirmation_sent_at        | timestamp with time zone |
| recovery_token              | character varying        |
| recovery_sent_at            | timestamp with time zone |
| email_change_token_new      | character varying        |
| email_change                | character varying        |
| email_change_sent_at        | timestamp with time zone |
| last_sign_in_at             | timestamp with time zone |
| raw_app_meta_data           | jsonb                    |
| raw_user_meta_data          | jsonb                    |
| is_super_admin              | boolean                  |
| created_at                  | timestamp with time zone |
| updated_at                  | timestamp with time zone |
| phone                       | text                     |
| phone_confirmed_at          | timestamp with time zone |
| phone_change                | text                     |
| phone_change_token          | character varying        |
| phone_change_sent_at        | timestamp with time zone |
| confirmed_at                | timestamp with time zone |
| email_change_token_current  | character varying        |
| email_change_confirm_status | smallint                 |
| banned_until                | timestamp with time zone |
| reauthentication_token      | character varying        |
| reauthentication_sent_at    | timestamp with time zone |
| is_sso_user                 | boolean                  |
| deleted_at                  | timestamp with time zone |
| is_anonymous                | boolean                  |
