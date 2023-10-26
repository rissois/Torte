/*
https://stackoverflow.com/a/52743902/12825811
Initialization in index.js allowed for initialization in all other files
... functions might be worth importing in separate files if multiple files do not use functions
*/


// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin');
admin.initializeApp();

const bill2 = require('./bill2');
const close = require('./close');
const charges = require('./charges');
const coupons = require('./coupons');
const demo = require('./demo');
const dailyDays = require('./dailyDays')
const feedback = require('./feedback');
const payments = require('./payments');
const itemAnalytics = require('./itemAnalytics');
const onRestaurantStatusChanged = require('./onRestaurantStatusChanged')
const order2 = require('./order2');
const stripeCustomer = require('./stripeCustomer')
const stripePayment = require('./stripePayment')
const stripePaymentMethods = require('./stripePaymentMethods')
const stripeRefund = require('./stripeRefund')
const stripeSetup = require('./stripeSetup')
const userInitializePOS = require('./userInitializePOS')
const restaurant = require('./restaurant')
const stripeTerminal = require('./stripeTerminal')
const test = require('./test');

const userInitialize = require('./userInitialize')
const scanReceipt = require('./scanReceipt');
const dailyBackup = require('./dailyBackup')
const deleteAccount = require('./deleteAccount');

/*
    Separated for ease of reading and global variable causes
*/


exports.bill2 = bill2
exports.close = close
exports.charges = charges
exports.coupons = coupons
exports.demo = demo
exports.dailyDays = dailyDays
exports.feedback = feedback
exports.payments = payments
exports.itemAnalytics = itemAnalytics
exports.onRestaurantStatusChanged = onRestaurantStatusChanged
exports.order2 = order2
exports.userInitializePOS = userInitializePOS
exports.restaurant = restaurant
exports.test = test
exports.stripeCustomer = stripeCustomer
exports.stripePayment = stripePayment
exports.stripePaymentMethods = stripePaymentMethods
exports.stripeRefund = stripeRefund
exports.stripeSetup = stripeSetup
exports.stripeTerminal = stripeTerminal

exports.scanReceipt = scanReceipt
exports.userInitialize = userInitialize
exports.dailyBackup = dailyBackup
exports.deleteAccount = deleteAccount