require("dotenv").config();
const msal = require("@azure/msal-node");

const config = {
    auth: {
        clientId: process.env.CLIENT_ID,
        authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
        clientSecret: process.env.CLIENT_SECRET,
    },
};

const REDIRECT_URI = process.env.REDIRECT_URI;

const pca = new msal.ConfidentialClientApplication(config);

module.exports = {
    pca,
    REDIRECT_URI,
};