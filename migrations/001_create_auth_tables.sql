CREATE SCHEMA IF NOT EXISTS user_management;

CREATE TABLE user_management.users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_management.roles (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE user_management.permissions (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE user_management.user_roles (
  user_id BIGINT NOT NULL REFERENCES user_management.users(id) ON DELETE CASCADE,
  role_id BIGINT NOT NULL REFERENCES user_management.roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE user_management.role_permissions (
  role_id BIGINT NOT NULL REFERENCES user_management.roles(id) ON DELETE CASCADE,
  permission_id BIGINT NOT NULL REFERENCES user_management.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON user_management.users(email);
