const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  TransactionID: {
    type: String,
    unique: true
  },
  TransactionDate: {
    type: Date
  },
  TransactionTime: {
    type: Number
  },
  TransactionAmount: {
    type: Number
  }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = { Transaction, transactionSchema };
