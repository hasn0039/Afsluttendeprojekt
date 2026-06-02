require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require("express");
const session = require("express-session");
const path = require("path");
const { pca, REDIRECT_URI } = require("./controllers/auth");
const connectDB = require('./scripts/db');
connectDB();


const controlRoutes = require('./controllers/controlRoutes');

const app = express();
app.use(express.json()); //  nødvendigt for at modtage JSON i POST/PUT requests
app.use(express.static(path.join(__dirname, "view"))); // korrekt mappe til HTML og assets
app.use('/js', express.static(path.join(__dirname, 'view', 'js')));
app.use(express.static("public"));

app.use(session({
    secret: "your-session-secret",
    resave: false,
    saveUninitialized: false,
}));

// Tilføj dine API-routes her:
app.use('/api/controls', controlRoutes);

// Frontend routes:
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "view", "index.html"));
});

app.get("/login", (req, res) => {
    const authCodeUrlParameters = {
        scopes: ["user.read"],
        redirectUri: REDIRECT_URI,
    };

    pca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
        res.redirect(response);
    }).catch((error) => res.status(500).send(error));
});

app.get("/redirect", (req, res) => {
    console.log("REDIRECT ROUTE RAMT");

    const tokenRequest = {
        code: req.query.code,
        scopes: ["user.read"],
        redirectUri: REDIRECT_URI,
    };

    pca.acquireTokenByCode(tokenRequest).then((response) => {
        console.log("LOGIN RESPONSE ACCOUNT:", response.account);
        console.log("ID TOKEN CLAIMS:", response.idTokenClaims);

        const azureRole = response.idTokenClaims?.roles?.[0];

        const roleMap = {
            "admin@test.dk": "admin",
            "editor@test.dk": "editor",
            "viewer@test.dk": "viewer"
        };

        const email = response.account.username;

        req.session.user = {
            name: response.account.name,
            email: email,
            role: azureRole ? azureRole.toLowerCase() : (roleMap[email] || 'viewer')
        };

        console.log("SESSION USER:", req.session.user);

        res.redirect("/dashboard");
    }).catch((error) => {
        console.error("LOGIN ERROR:", error);
        res.status(500).send(error);
    });
});

app.get("/dashboard", (req, res) => {
    if (!req.session.user) return res.redirect("/");
    res.sendFile(path.join(__dirname, "view", "dashboard.html"));
});

app.get("/api/session", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "Not logged in" });
    }

    res.json({
        name: req.session.user.name,
        email: req.session.user.email,
        role: req.session.user.role
    });
});

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
