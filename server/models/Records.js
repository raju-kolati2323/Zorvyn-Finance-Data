const mongoose = require('mongoose');

const RecordsSchema = new mongoose.Schema({
    userId: { //to whome the record belongs to
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    amountType: {
        type: String,
        enum: ['Income', 'Expense'],
        required: true,
    },
    category: {
        type: String,        
        enum:['Salary', 'Bank Interest', 'Pension', 'Rent', 'Stocks', 'Government Benefits', 'Food', 'Entertainment', 'Transportation', 'Education', 'Insurance', 'Shopping', 'Travel', 'Medical', 'Subscriptions', 'Fuel', 'Internet' ,'Other'],
        required: true,
    },
    dateOfTransaction: {
        type: Date,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Record', RecordsSchema);