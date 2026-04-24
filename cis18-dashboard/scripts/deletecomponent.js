const mongoose = require('mongoose');
const Control = require('../models/Control'); // eller dit schema navn
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    await Control.deleteMany(); // sletter alt i samlingen
    console.log('Alle gamle safeguards slettet');
    process.exit();
})();