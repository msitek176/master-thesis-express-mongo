/* eslint-disable prettier/prettier */
const csvtojson = require('csvtojson');
const { Transaction } = require('./../models/transactionModel');
const Customer = require('./../models/customerModel');
const factory = require('./handlerFactory');

exports.getAllTransactions = factory.getAll(Customer);
exports.getTranscation = factory.getOne(Customer);
exports.createTransaction = factory.createOne(Customer);
exports.updateTransaction = factory.updateOne(Customer);
exports.deleteTransaction = factory.deleteOne(Customer);

function changeDate(oldDate) {
  if (oldDate !== undefined && oldDate !== null) {
    const dateArray = oldDate.split('/');
    const month = dateArray[0];
    const day = dateArray[1];
    const year = dateArray[2];

    const newDate = `${day}/${month}/${year}`;
    return newDate;
  }
  return oldDate;
}

exports.addTransactions = async (req, res) => {
  try {
    const csvData = await csvtojson().fromFile(
      'C:\\Users\\Mateusz\\Desktop\\bank_transactions-master.csv'
    );

    const newCsv = csvData
      .filter(data => {
        const values = Object.values(data);

        const hasText = values.some(value => {
          if (typeof value === 'string') {
            const pattern = /"/;
            return pattern.test(value);
          }
          return false;
        });
        return (
          !values.includes(null) &&
          !values.includes(undefined) &&
          !values.includes('nan') &&
          !values.includes('') &&
          !values.includes('1/1/1800') &&
          !hasText
        );
      })
      .map(data => {
        const CustomerDOB = changeDate(data.CustomerDOB);
        const TransactionDate = changeDate(data.TransactionDate);
        return { ...data, TransactionDate, CustomerDOB };
      })
      .filter(val => val !== undefined);
      const customers = new Map();

      // eslint-disable-next-line no-restricted-syntax
      for (const data of newCsv) {
        const {
          CustomerID,
          CustomerDOB,
          CustGender,
          CustLocation,
          CustAccountBalance,
          ...transactionData
        } = data;
      
        const transaction = new Transaction(transactionData);
      
        let customer = customers.get(CustomerID);
      
        if (customer) {
          customer.transactions.push(transaction);
        } else {
          customer = new Customer({
            CustomerID,
            CustomerDOB,
            CustGender,
            CustLocation,
            CustAccountBalance,
            transactions: transaction
          });
      
          customers.set(CustomerID, customer);
        }
      
        await customer.save();
      }

    res.status(200).json({
      status: 'success',
      data: {
        data: newCsv
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    });
  }
};
// 1. Zliczanie wartości transakcji na poszczególne dni

exports.sumOfTransactionAmountPerDay = async (req, res) => {
  try {
    const result = await Customer.aggregate([
      {
        $unwind: '$transactions'
      },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: '$transactions.TransactionDate' },
            month: { $month: '$transactions.TransactionDate' },
            year: { $year: '$transactions.TransactionDate' }
          },
          totalAmount: { $sum: '$transactions.TransactionAmount' }
        }
      },
      {
        $project: {
          _id: 0,
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          totalAmount: 1
        }
      }
    ]);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
};
// 2. Customerzy powyzej 40 roku zycia powyzej 1000 inr
exports.filteredCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({
      $and: [
        { CustomerDOB: { $lte: new Date('1983-04-14') } },
        { CustAccountBalance: { $gte: 1000 } }
      ]
    });

    res
      .status(200)
      .json({ success: true, result: customers.length, data: customers });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
};

// 3. Sortowanie alfabetyczne nazw miejscowości
exports.getLocations = async (req, res) => {
  try {
    const locations = await Customer.distinct('CustLocation').sort();

    res.status(200).json({ success: true, data: locations });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
};

// 4. Grupowanie po lokacjach, wypisac te ktore maja wiecej niz x customerow, posortować
exports.getLocationsWithMultipleCustomers = async (req, res) => {
  try {
    const locations = await Customer.aggregate([
      {
        $group: {
          _id: '$CustLocation',
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 2 }
        }
      },
      {
        $sort: {
          _id: 1
        }
      }
    ]);

    res.status(200).json({ success: true, data: locations });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
};

// 5. Suma transakcji kobiet i meżczyzn
exports.getTransactionAmountByGender = async (req, res) => {
  try {
    const result = await Customer.aggregate([
      {
        $unwind: '$transactions'
      },
      {
        $group: {
          _id: '$CustGender',
          totalAmount: { $sum: '$transactions.TransactionAmount' }
        }
      }
    ]);

    const maleAmount = result.find(item => item._id === 'M')
      ? result.find(item => item._id === 'M').totalAmount
      : 0;
    const femaleAmount = result.find(item => item._id === 'F')
      ? result.find(item => item._id === 'F').totalAmount
      : 0;

    res.status(200).json({ success: true, data: { maleAmount, femaleAmount } });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
};

// 6. Wyliczenie ile lat ma customer
exports.getCustomerAge = async (req, res) => {
  try {
    const customers = await Customer.aggregate([
      {
        $addFields: {
          age: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), '$CustomerDOB'] },
                1000 * 60 * 60 * 24 * 365
              ]
            }
          }
        }
      }
    ]);

    res.status(200).json({ success: true, data: customers });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
};
