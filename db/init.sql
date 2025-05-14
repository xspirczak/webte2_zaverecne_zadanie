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

CREATE TABLE IF NOT EXISTS manual (
                                      id INT AUTO_INCREMENT PRIMARY KEY,
                                      content BLOB
) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

INSERT INTO manual (content) VALUES (
                                        '

                                          <h3>1. Úvod</h3>
                                          <p>Táto príručka slúži ako kompletný návod na používanie aplikácie PDF Správca. Obsahuje popis všetkých funkcionalít dostupných cez používateľské rozhranie (frontend) a rozhranie API (backend).</p>

                                          <h3>2. Funkcionalita aplikácie</h3>
                                          <ul>
                                            <li>Prihlásenie a registrácia používateľov</li>
                                            <li>Editor PDF súborov s 10 funkciami na prácu s PDF:</li>
                                            <ul>
                                              <li><strong>Rozdelenie PDF</strong> – rozdelenie dokumentu na vybrané časti</li>
                                              <li><strong>Zlúčenie PDF</strong> – spojenie viacerých PDF súborov do jedného</li>
                                              <li><strong>Otočenie strán</strong> – rotácia jednotlivých strán PDF o 90°</li>
                                              <li><strong>Komprimovanie PDF</strong> – zmenšenie veľkosti PDF súboru</li>
                                              <li><strong>Extrahovanie strán</strong> – uloženie vybraných strán ako nový PDF</li>
                                              <li><strong>Vymazanie strán</strong> – odstránenie zvolených strán z dokumentu</li>
                                              <li><strong>Zmena poradia strán</strong> – presun stránok do nového poradia</li>
                                              <li><strong>Pridanie vodoznaku</strong> – vizuálne označenie dokumentu</li>
                                              <li><strong>Chránenie heslom</strong> – zabezpečenie PDF prístupovým heslom</li>
                                              <li><strong>Konverzia do textu</strong> – extrakcia textu z PDF ako `.txt` súbor</li>
                                            </ul>
                                            <li>História vykonaných akcií</li>
                                            <li>Úloha a rola používateľa (štandardný / administrátor)</li>
                                            <li>Export používateľskej príručky do PDF</li>
                                          </ul>

                                          <h3>3. Použitie cez frontend</h3>
                                          <p>Po prihlásení sa používateľovi zobrazí dashboard s dostupnými funkciami podľa roly. Každá funkcia má vlastnú podstránku s intuitívnym rozhraním. Používateľ môže:</p>
                                          <ul>
                                            <li>Vybrať PDF súbory na spracovanie pomocou drag & drop</li>
                                            <li>Spustiť konkrétnu operáciu (napr. rozdeliť, otočiť, zlúčiť)</li>
                                            <li>Zobraziť náhľady strán (pri niektorých funkciách)</li>
                                            <li>Stiahnuť výstupný súbor</li>
                                          </ul>

                                          <h3>4. Použitie cez API</h3>
                                          <p>Aplikácia poskytuje rozhranie pre vývojárov na integráciu funkcií do externých systémov. API je dokumentované cez OpenAPI a dostupné na <a href="http://localhost:8000/docs" target="_blank">/docs</a>.</p>
                                          <pre><code>POST /api/user/login
                                      GET  /api/pdf/list
                                      POST /api/pdf/merge
                                      POST /api/pdf/split
                                      POST /api/pdf/rotate
                                      POST /api/pdf/delete-pages
                                      POST /api/pdf/extract-pages
                                      POST /api/pdf/reorder
                                      POST /api/pdf/watermark
                                      POST /api/pdf/protect
                                      POST /api/pdf/compress
                                      POST /api/pdf/to-text</code></pre>

                                          <h3>5. Export príručky</h3>
                                          <p>Obsah tejto príručky je generovaný dynamicky z databázy. Po kliknutí na tlačidlo <strong>„Exportovať do PDF“</strong> sa aktuálny obsah odošle na server, kde sa pomocou PDF generátora prevedie na profesionálne formátovaný PDF dokument. Tento dokument je okamžite pripravený na stiahnutie alebo tlač.</p>'
                                    );