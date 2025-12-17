import mongoose from 'mongoose';

const inspectionSchema = new mongoose.Schema({
    inspectorName: { type: String, required: true },
    timestamp: { type: Number, default: Date.now },
    header: {
        vehicleReg: String,
        date: String,
        roadWorthiness: String,
        insurance: String
    },
    sectionA: [{
        id: String,
        label: String,
        type: { type: String, enum: ['check', 'input'] },
        status: { type: String, enum: ['OK', 'DEFECTIVE'], required: false },
        remarks: String,
        value: String
    }],
    sectionB: [{
        id: String,
        label: String,
        type: { type: String, enum: ['check', 'input'] },
        status: { type: String, enum: ['OK', 'DEFECTIVE'], required: false },
        remarks: String,
        value: String
    }],
    isCompleted: { type: Boolean, default: false }
}, {
    timestamps: true
});

// Force model rebuild to ensure schema updates are applied
if (mongoose.models.Inspection) {
    delete mongoose.models.Inspection;
}
export const Inspection = mongoose.model('Inspection', inspectionSchema);
