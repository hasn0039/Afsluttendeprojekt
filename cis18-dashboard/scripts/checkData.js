const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const Control = require('../models/Control');
const SubControl = require('../models/SubControl');

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const controls = await Control.countDocuments();
        const subControls = await SubControl.countDocuments();
        
        console.log(`Controls: ${controls}`);
        console.log(`SubControls: ${subControls}`);
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

checkData();