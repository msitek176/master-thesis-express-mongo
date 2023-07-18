const mongoose = require('mongoose');
const { transactionSchema } = require('./transactionModel');

const customerSchema = new mongoose.Schema({
  CustomerID: {
    type: String,
    unique: true
  },
  CustomerDOB: {
    type: Date
  },
  CustGender: {
    type: String
  },
  CustLocation: {
    type: String
  },
  CustAccountBalance: {
    type: Number
  },
  transactions: [transactionSchema]
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
