const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Customer = require('./../models/customerModel');

const getTransactionById = async (transactionId, next) => {
  try {
    const customer = await Customer.findOne({
      'transactions._id': transactionId
    });

    const transaction = customer.transactions.id(transactionId);
    if (!transaction) {
      return next(new AppError('No document found with that ID', 404));
    }

    return transaction;
  } catch (err) {
    console.error(err);
    return next(new AppError('Server error', 500));
  }
};

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const transaction = await getTransactionById(req.params.id, next);

    if (!transaction) {
      return next(new AppError('No found with that ID', 404));
    }

    const customer = await Model.findOne({
      'transactions._id': req.params.id
    });

    await customer.transactions.id(req.params.id).remove();
    await customer.save();
    res.status(204).json({
      status: 'success',
      data: null
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const customer = await Model.findOne({
      'transactions._id': req.params.id
    });

    if (!customer) {
      return { error: 'Customer not found' };
    }

    const transaction = customer.transactions.find(
      t => t._id.toString() === req.params.id
    );

    Object.keys(req.body).forEach(key => {
      transaction[key] = req.body[key];
    });

    await customer.save();

    res.status(200).json({
      status: 'success',
      data: {
        transaction
      }
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const existingCustomer = await Model.findOne({
      CustomerID: req.body.CustomerID
    });

    if (existingCustomer) {
      // Customer already exists, so only add the new transaction to the existing customer
      existingCustomer.transactions.push(req.body.transactions[0]);
      await existingCustomer.save();

      res.status(201).json({
        status: 'success',
        data: {
          data: existingCustomer
        }
      });
    } else {
      // Customer doesn't exist, so create a new customer with the provided data
      const doc = await Model.create(req.body);

      res.status(201).json({
        status: 'success',
        data: {
          data: doc
        }
      });
    }
  });

exports.getOne = () =>
  catchAsync(async (req, res, next) => {
    const transaction = await getTransactionById(req.params.id, next);

    res.status(200).json({
      status: 'success',
      data: {
        transaction
      }
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.find().select('transactions');

    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc
      }
    });
  });
