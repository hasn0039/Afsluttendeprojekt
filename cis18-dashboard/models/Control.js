const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ControlSchema = new Schema({
    id: String,
    name: String,
    avgScore: Number,
    subControls: [{ type: Schema.Types.ObjectId, ref: 'SubControl' }]
});

module.exports = mongoose.model('Control', ControlSchema);
