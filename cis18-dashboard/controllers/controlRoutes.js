const express = require('express');
const router = express.Router();
const Control = require('../models/Control');
const SubControl = require('../models/SubControl');

// Hent alle controls
// Hent alle controls
router.get('/', async (req, res) => {
    try {
        const controls = await Control.find({}).populate('subControls'); // <-- VIGTIGT
        res.json(controls);
    } catch (err) {
        res.status(500).json({ error: 'Kunne ikke hente controls' });
    }
});


// Hent én control med id (ikke MongoDB _id)
router.get('/:id', async (req, res) => {
    try {
        const control = await Control.findOne({ id: req.params.id });
        if (!control) return res.status(404).json({ error: 'Ikke fundet' });
        res.json(control);
    } catch (err) {
        res.status(500).json({ error: 'Fejl under hentning' });
    }
});



router.put('/:controlId/subcontrols/:subId', async (req, res) => {
    try {
        const { subId } = req.params;

        // Kun tilladte felter må opdateres
        const allowedFields = ['status', 'fulfillment', 'impactScore', 'comment'];
        const updateData = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        const subControl = await SubControl.findByIdAndUpdate(subId, updateData, { new: true });
        if (!subControl) return res.status(404).json({ error: 'SubControl ikke fundet' });

        res.json({ message: 'SubControl opdateret', subControl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Fejl under opdatering' });
    }
});


module.exports = router;