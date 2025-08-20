# Book Reviews (Monorepo)

Full‑stack solution for the "Book Reviews" requirement:
- Backend: Node 18 + Moleculer (moleculer-web) + MongoDB and Mongoose.
- Frontend: Nuxt 3 (SPA) + Pinia + Sass (from scratch).
- Integrates with OpenLibrary API.
- Optional Basic Auth for API and Front.

## Structure
- apps/api – Moleculer API (services + API Gateway)
  - Services: health, books
  - API Gateway: moleculer-web exposing routes "/" and "/api"
- apps/web – Nuxt 3 SPA

## Prerequisites
- Node 18+
- MongoDB running locally (default URI: mongodb://localhost:27017/bookreviews)

## Setup
1. Install dependencies at repo root (uses npm workspaces):
   npm install

2. Configure environment:
   - API: copy apps/api/.env.sample to apps/api/.env and adjust as needed.
   - Web: copy apps/web/.env.example to apps/web/.env and adjust API base if not default.

3. Run in development (API on 3001, Web on 3000):
   npm run dev

Or run separately:
- API: npm run dev:api
- Web: npm run dev:web

## Ejecutar con Docker (docker-compose)

Requisitos:
- Docker y Docker Compose instalados.

Comando rápido (construye imágenes y levanta todo):
- docker compose up --build

Servicios y puertos:
- Web (Nuxt): http://localhost:3000
- API (Node/Moleculer): http://localhost:3001
- MongoDB: localhost:27017

Basic Auth por defecto (habilitado):
- Usuario: demo
- Contraseña: 123456
Para sobrescribir credenciales (antes de ejecutar docker compose):
- export BASIC_AUTH_USER=tu_usuario
- export BASIC_AUTH_PASS=tu_password

Apagar y limpiar contenedores:
- docker compose down

Ver logs:
- docker compose logs -f api web

Notas:
- La Web usa NUXT_PUBLIC_API_BASE=http://localhost:3001/api para el cliente y NUXT_API_BASE_INTERNAL=http://api:3001/api para SSR en el contenedor.
- La API expone PORT=3001 y se conecta a MongoDB en mongodb:27017.

## API (apps/api)
- GET /health – health check
- GET /api/books/search?q=term – search up to 10 results in OpenLibrary. If a result is already saved in "mi biblioteca", its cover is served from our endpoint instead of OpenLibrary.
- GET /api/books/last-search – returns the last 5 search terms.
- POST /api/books/my-library – save a book with review (<=500 chars), rating (1–5) and cover stored as base64. Accepts either `coverBase64` or `coverUrl`.
- GET /api/books/my-library – list saved books with filters:
  - q – query in title or authors
  - sortRating – asc|desc
  - excludeNoReview – true to hide items without review
- GET /api/books/my-library/:id – get saved book details
- PUT /api/books/my-library/:id – update review and/or rating
- DELETE /api/books/my-library/:id – remove book
- GET /api/books/library/front-cover/:id – serves stored cover image

Logging: Each endpoint logs to console the method, path, and key details.

Basic Auth: habilitado por defecto (demo/123456). Para cambiar credenciales, define BASIC_AUTH_USER y BASIC_AUTH_PASS. La SPA envía credenciales vía NUXT_PUBLIC_BASIC_AUTH_USER/PASS.

## Frontend (apps/web)
- First screen: centered book search input with placeholder "Escribe el nombre de un Libro para continuar" and last 5 searches as quick buttons.
- Search results: up to 10 items with Title and Cover. Shows "no encontramos libros con el título ingresado" if none.
- Selecting a book opens detail screen with Title, Authors, Year, and Cover, plus:
  - Review textarea (max 500 chars)
  - Rating control (1–5)
  - Save button with success message on completion
- "Mi biblioteca":
  - Always accessible via top-right button
  - List of saved books with all info
  - Search by title/author, sort by rating asc/desc, exclude without review
  - Edit review/rating inline and delete with confirmation

## Environment files
- apps/api/.env.sample – example API env
- apps/web/.env.example – example Web env (public runtime config)

## Notes
- This project uses minimal custom CSS/Sass.
- The optional Basic Auth login UI is not implemented; credentials can be provided via environment variables to the SPA.


## Bruno collection (manual API tests)
A ready-to-use Bruno collection is included to manually test the API endpoints.

Location: bruno/

How to use:
- Prerequisites: MongoDB running locally; API started on http://localhost:3001
- Start the project:
  1) npm install
  2) npm run dev:api (or npm run dev to launch API + Web)
- Open Bruno (https://www.usebruno.com/) and choose “Open Collection”, then select the bruno folder in this repo.
- In the collection variables (collection.bru), adjust as needed:
  - API: http://localhost:3001/api
  - API_BASE: http://localhost:3001
  - BASIC_AUTH_USER / BASIC_AUTH_PASS (por defecto demo/123456; puedes cambiarlos)
  - SAMPLE_ID: leave empty initially; set it after creating an item

Suggested order to run requests:
1) Health – GET /health
2) Books - Search – GET /api/books/search (edit Q if desired)
3) Books - Last Search – GET /api/books/last-search
4) My Library - Create – POST /api/books/my-library
   - Uses a sample coverUrl to fetch and store the cover as base64.
   - Copy the returned id into the collection variable SAMPLE_ID.
5) My Library - Get by ID – GET /api/books/my-library/:id (uses SAMPLE_ID)
6) My Library - List – GET /api/books/my-library with optional filters
7) My Library - Update – PUT /api/books/my-library/:id (uses SAMPLE_ID)
8) Library - Front Cover Image – GET /api/books/library/front-cover/:id (uses SAMPLE_ID)
9) My Library - Delete – DELETE /api/books/my-library/:id (uses SAMPLE_ID)

Notes:
- Basic Auth: enabled by default (demo/123456). If you change BASIC_AUTH_USER & BASIC_AUTH_PASS, set the same values in the Nuxt public env for the SPA and in Bruno collection variables.
- The Web SPA runs at http://localhost:3000 (Nuxt 3) and consumes the same API.
