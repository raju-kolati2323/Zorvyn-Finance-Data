const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },  
    password: {
        type: String,
        required: true,
    },
    mobileNumber: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['Viewer', 'Analyst', 'Admin'],
        default: 'Viewer',
    },
    isActive: {
        type: Boolean,
        default: true,
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);