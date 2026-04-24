const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const fs = require('fs');
const Control = require('../models/Control');
const SubControl = require('../models/SubControl');

const mongoUri = process.env.MONGODB_URI;
const dataPath = path.join(__dirname, '../assets/controls.json');
const controlsData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

async function importData() {
    try {
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        await Control.deleteMany();

        await Control.insertMany(controlsData);
        console.log('✅ Controls importeret korrekt!');
        process.exit();
    } catch (err) {
        console.error('❌ Fejl under import:', err);
        process.exit(1);
    }
}

importData();