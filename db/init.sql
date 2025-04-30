USE zaverecne_zadanie;

CREATE TABLE IF NOT EXISTS users (
                                     id INT AUTO_INCREMENT PRIMARY KEY,
                                     username VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    hashed_password VARCHAR(255),
    role VARCHAR(50),
    created_at DATETIME
    );

CREATE TABLE IF NOT EXISTS history (
                                       id INT AUTO_INCREMENT PRIMARY KEY,
                                       user_email VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    timestamp DATETIME,
    access_type VARCHAR(50),
    city VARCHAR(255),
    country VARCHAR(255)
    );

-- Predvolení používatelia
-- admin@admin.com heslo: admin
-- user@user.com heslo: user
INSERT INTO users (id, username, email, hashed_password, role, created_at) VALUES
                                                                               (1, 'user', 'user@user.com', '$2b$12$0UfIcrQzcAqvKuNwQvHPxOwKlrvuxHkMzGypYZ0DrfT33b/gbpplW', 'user', '2025-04-30 19:34:17'),
                                                                               (2, 'admin', 'admin@admin.com', '$2b$12$w8aXhE6Jr126FGYrf0ZvOO/wy4EHlgvvOPz4cNmdzynehBjuQyUEu', 'admin', '2025-04-30 19:43:31');
