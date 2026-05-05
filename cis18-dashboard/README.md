# CIS18 Dashboard

Dette dokument forklarer `cis18-dashboard` for en begynder.

## Hvad er projektet?
`cis18-dashboard` er et lille webprojekt, der viser et dashboard for CIS18-kontroller.
Projektet bruger en Node.js/Express-server, en MongoDB-database og en frontend i HTML/JavaScript.
Dashboardet viser kontrolpunkter og tillader opdatering af status, fuldførelsesgrad og kommentarer.
Det indeholder også en Microsoft-loginflow og en enkel PDF-rapportfunktion.

## Projektstruktur

- `server.js` - startsiden for serveren, ruter og login
- `controllers/auth.js` - Microsoft OAuth-login (MSAL)
- `controllers/controlRoutes.js` - backend API for kontroldata
- `models/Control.js` - MongoDB-model for hovedkontroller
- `models/SubControl.js` - MongoDB-model for underkontroller
- `scripts/db.js` - forbinder til MongoDB
- `scripts/importControls.js` - importerer `assets/controls.json` til databasen
- `assets/controls.json` - data om CIS18-kontroller og subkontroller
- `view/index.html` - startsiden med login-knap
- `view/dashboard.html` - dashboard-siden, som loader frontend-logik
- `view/js/dashboard.js` - frontend-kode der henter data og viser UI

## Hvordan fungerer systemet?

### Serveren (`server.js`)
Serveren er bygget med Express.

- `require('dotenv').config()` læser konfiguration fra `.env`.
- `connectDB()` forbinder til MongoDB via `scripts/db.js`.
- `app.use(express.json())` aktiverer JSON-body parsing til API-opdateringer.
- `app.use(express.static(path.join(__dirname, "view")))` gør filer i `view/` tilgængelige via browseren.
- Session-støtte er sat op med `express-session`.
- API-ruter under `/api/controls` håndteres af `controllers/controlRoutes.js`.
- Root-ruten `/` sender `view/index.html`.
- `/login` starter Microsoft-login ved hjælp af `auth.js`.
- `/redirect` håndterer svar fra Microsoft efter login.
- `/dashboard` viser dashboardet, men kræver at brugeren er logget ind.
- `/api/session` returnerer brugerens sessionnavn.
- `/logout` sletter session og sender brugeren tilbage til forsiden.

### Login (`controllers/auth.js`)
Her ligger MSAL-konfigurationen til Microsoft OAuth.

- `CLIENT_ID`, `TENANT_ID`, `CLIENT_SECRET`, `REDIRECT_URI` kommer fra `.env`.
- `pca` er MSAL-klienten, der bruges til at oprette login-URL og hente token.
- Efter login gemmes brugerens konto i `req.session.account`.

### Kontrol-API (`controllers/controlRoutes.js`)
Dette er backend-API'et til dashboarddata.

- `GET /api/controls` henter alle kontroller og deres `subControls`.
- `GET /api/controls/:id` henter én control efter dens `id`.
- `PUT /api/controls/:controlId/subcontrols/:subId` opdaterer en enkelt subcontrol.

API'et tillader kun opdatering af `status`, `fulfillment`, `impactScore` og `comment`.

### Database-modeller

- `models/Control.js`
  - `id` (f.eks. "1" eller "2")
  - `name` (kontrollens navn)
  - `avgScore` (gennemsnitlig score)
  - `subControls` (array af object-id'er til `SubControl`)

- `models/SubControl.js`
  - indeholder `name`, `description`, `status`, `fulfillment`, `impactScore`, `securityFunction`, `implementationGroup` og `comment`
  - timestamps gemmer hvornår dokumentet oprettes og opdateres

### Databaseforbindelse (`scripts/db.js`)
Denne fil forbinder til MongoDB med `process.env.MONGODB_URI`.
Hvis forbindelsen fejler, stopper appen.

### Import af data (`scripts/importControls.js`)
Denne fil læser `assets/controls.json` og importerer data til MongoDB.

> Bemærk: `Control`-modellen forventer `subControls` som object-id'er, men JSON-filen indeholder objekter. Det betyder, at dataimport kan kræve ekstra tilpasning, hvis du vil have relationerne til at fungere korrekt.

## Frontend

### Startside (`view/index.html`)
Index-siden er landingssiden med:
- titel og beskrivelse
- en video-banner
- en login-knap til Microsoft-login (`/login`)

### Dashboard (`view/dashboard.html`)
Dashboard-siden indeholder:
- et felt til at vise brugerens navn
- et `div` med `id="root"` hvor dashboardet bygges
- en reference til `view/js/dashboard.js`

### JavaScript (`view/js/dashboard.js`)
Denne fil indeholder brugergrænsefladen og al interaktion.

Hovedflowet er:
- `window.addEventListener('DOMContentLoaded', ...)` starter når siden er læst
- `fetchAndRenderControls()` henter kontroller fra `/api/controls`
- brugerens navn vises med data fra session
- der oprettes en tema-knap til dark mode
- der beregnes gennemsnitlige scores og vises som cirkel-diagrammer
- der oprettes et filter til at vise kontroller efter status
- der genereres en PDF-rapport med `html2pdf`
- hver control og subcontrol vises i UI
- klik på en subcontrol åbner detaljer og giver mulighed for at redigere
- klik på `Save` sender en `PUT` til backend for at opdatere subcontrol

### Bemærkninger
- Filen forsøger at loade `cis18_descriptions.json` fra roden. I dette projekt ligger den i `assets/`, så den vil muligvis ikke blive fundet uden ændring i serverens static-ruter.
- `dashboard.js` bruger `sessionStorage.getItem('userName')` til at vise navnet. Men serveren returnerer også brugerens navn via `/api/session`.

## Sådan kører du projektet

1. Opret en `.env`-fil i rodmappen `cis18-dashboard`
2. Sæt disse variabler:
   - `MONGODB_URI`
   - `CLIENT_ID`
   - `TENANT_ID`
   - `CLIENT_SECRET`
   - `REDIRECT_URI`
3. Installer afhængigheder:
   - `npm install`
4. Start serveren:
   - `node server.js`
5. Åbn browseren og gå til:
   - `http://localhost:3000`

## Hvad kan du ændre som begynder?

- Skift tekst i `view/index.html` og `view/dashboard.html`
- Opdater data i `assets/controls.json`
- Tilføj flere kontroller eller subcontroles i JSON-filen
- Tilpas farver og layout i `view/js/dashboard.js`
- Gør loginflowet lettere ved at fjerne `/login` og `/redirect` hvis du ikke bruger Microsoft-login

## Kort forklaring af nøgleroller

- `server.js` er backendens startpunkt
- `controllers/auth.js` håndterer login
- `controllers/controlRoutes.js` håndterer data-API
- `models/*` definerer, hvordan data gemmes i MongoDB
- `view/*` er frontend HTML og styling
- `view/js/dashboard.js` er den vigtigste frontend-logik
- `assets/controls.json` er selve CIS18-dataene

## Afsluttende tip
Hvis du er ny, er det gode sted at starte at læse `server.js` og `view/js/dashboard.js`, fordi de viser hvordan data flyder fra databasen til brugerfladen.

God fornøjelse med at udforske `cis18-dashboard`!