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
                                          <p>Aplikácia poskytuje rozhranie pre vývojárov na integráciu funkcií do externých systémov. API je dokumentované cez OpenAPI a dostupné na <a href="/api/docs" target="_blank">/docs</a>.</p>
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
INSERT INTO manual (content) VALUES (
                                        '
                                        <h3>1. Introduction</h3>
                                        <p>This manual serves as a complete guide to using the PDF Manager application. It includes a description of all features available through the user interface (frontend) and the API interface (backend).</p>

                                        <h3>2. Application Functionality</h3>
                                        <ul>
                                          <li>User login and registration</li>
                                          <li>PDF file editor with 10 functions for working with PDFs:</li>
                                          <ul>
                                            <li><strong>Split PDF</strong> – divide a document into selected parts</li>
                                            <li><strong>Merge PDF</strong> – combine multiple PDF files into one</li>
                                            <li><strong>Rotate Pages</strong> – rotate individual PDF pages by 90°</li>
                                            <li><strong>Compress PDF</strong> – reduce the size of a PDF file</li>
                                            <li><strong>Extract Pages</strong> – save selected pages as a new PDF</li>
                                            <li><strong>Delete Pages</strong> – remove selected pages from the document</li>
                                            <li><strong>Reorder Pages</strong> – rearrange pages into a new order</li>
                                            <li><strong>Add Watermark</strong> – visually mark the document</li>
                                            <li><strong>Password Protection</strong> – secure PDF with a password</li>
                                            <li><strong>Convert to Text</strong> – extract text from a PDF as a `.txt` file</li>
                                          </ul>
                                          <li>History of performed actions</li>
                                          <li>User roles and permissions (standard / administrator)</li>
                                          <li>Export user manual to PDF</li>
                                        </ul>

                                        <h3>3. Using the Frontend</h3>
                                        <p>After logging in, the user is presented with a dashboard showing available functions based on their role. Each function has its own subpage with an intuitive interface. The user can:</p>
                                        <ul>
                                          <li>Select PDF files for processing using drag & drop</li>
                                          <li>Execute a specific operation (e.g. split, rotate, merge)</li>
                                          <li>Preview pages (for certain functions)</li>
                                          <li>Download the output file</li>
                                        </ul>

                                        <h3>4. Using the API</h3>
                                        <p>The application provides an interface for developers to integrate features into external systems. The API is documented using OpenAPI and available at <a href="/api/docs" target="_blank">/docs</a>.</p>
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

                                        <h3>5. Exporting the Manual</h3>
                                        <p>The content of this manual is dynamically generated from the database. After clicking the <strong>“Export to PDF”</strong> button, the current content is sent to the server, where it is converted into a professionally formatted PDF document using a PDF generator. This document is immediately ready for download or printing.</p>
                                        '
                                    );
