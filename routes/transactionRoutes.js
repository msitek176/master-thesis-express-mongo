const express = require('express');
const transactionController = require('./../controllers/transactionController');

const router = express.Router();
/////////////////////////////////////////////////////////////////////
router
  .route('/sum-of-transaction-amount-per-day')
  .get(transactionController.sumOfTransactionAmountPerDay);

router
  .route('/filtered-customers')
  .get(transactionController.filteredCustomers);

router.route('/get-locations').get(transactionController.getLocations);

router
  .route('/get-biggest-locations')
  .get(transactionController.getLocationsWithMultipleCustomers);
router
  .route('/transaction-amount-by-gender')
  .get(transactionController.getTransactionAmountByGender);

router.route('/get-customer-age').get(transactionController.getCustomerAge);
///////////////////////////////////////////////////////////////////
router.route('/add').post(transactionController.addTransactions);

router
  .route('/')
  .get(transactionController.getAllTransactions)
  .post(transactionController.createTransaction);

router
  .route('/:id')
  .get(transactionController.getTranscation)
  .patch(transactionController.updateTransaction)
  .delete(transactionController.deleteTransaction);

module.exports = router;
