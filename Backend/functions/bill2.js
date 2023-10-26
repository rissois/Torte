/* eslint-disable no-await-in-loop */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const { createBill, } = require('./helpers/billTemplate');
const { createBillUser } = require('./helpers/billUserTemplate');
const { dateToString } = require('./helpers/functions');
const { getSnapshotData, reportErrors } = require('./helpers/callableFns');

const BILL_CODE_RANGE = 9999

/*
 * Do you want a more secure restaurant query?
 * Returns only restaurant ID, name, and address, is_order_enabled, is_pay_enabled?
 */

/**
 * Function that determines whether bill is a test
 *
 * @param {Object} restaurant contents of restaurant document.
 * @param {Object} table contents of table document.
 */
const determineTestMode = (restaurant, table) => {
    return restaurant.is_hidden || !restaurant.is_live || table.is_test
}


/**
 * Function that creates a new bill via a transaction
 * (optional) add user to bill
 * Returns the bill
 *
 * @param {Object} restaurantRef Firestore reference to restaurant.
 * @param {String} table_id 
 * @param {String} user_id (optional)
 * @param {String} name (optional) name of user.
 */
const transactCreateBill = async (restaurantRef, table_id, user_id, name) => {
    return admin.firestore().runTransaction(async transaction => {
        const restaurant = await getSnapshotData(restaurantRef, transaction)
        const table = await getSnapshotData(restaurantRef.collection('Tables').doc(table_id), transaction)

        const is_test = determineTestMode(restaurant, table)
        const automatic_gratuity_percent = restaurant.gratuities.automatic.default_option

        // Restaurant-wide bill number
        const billCountRef = restaurantRef.collection('Counts').doc('BillCount')
        const { [is_test ? 'bill_count_test' : 'bill_count']: bill_count } = await getSnapshotData(billCountRef, transaction)

        // Most recent Days document for analytics
        // ??? Store this in restaurant document instead of query? Less precise
        const daysQuerySnapshot = await restaurantRef
            .collection('Days')
            .where('is_test', '==', is_test)
            .where('timestamps.created', '<=', admin.firestore.Timestamp.fromMillis(Date.now()))
            .orderBy('timestamps.created', 'desc')
            .limit(1)
            .get()

        if (!daysQuerySnapshot.size) throw new functions.https.HttpsError('not-found', 'Restaurant records are not properly set up.')
        const daySnapshot = daysQuerySnapshot.docs[0]

        const billRef = restaurantRef.collection('Bills').doc()

        // Generate a bill_code
        // Ensures code is not currently used by another bill at restaurant
        let bill_code = null
        let randomBillNumber = Math.ceil(Math.random() * BILL_CODE_RANGE)
        while (!bill_code) {
            const randomBillCode = randomBillNumber.toString().padStart(4, '0')

            const billsQuerySnapshot = await restaurantRef.collection('Bills')
                .where('bill_code', '==', randomBillCode)
                .where('timestamps.closed', '!=', null)
                // .orderBy('timestamps.closed', 'desc') Can be used to limit time that a bill code is valid
                .limit(1)
                .get()

            if (billsQuerySnapshot.empty) {
                bill_code = randomBillCode
            }
            // CONSIDER allowing bill_code if different table or old timestamps.created
            else {
                randomBillNumber++
                if (randomBillNumber > 9999) {
                    randomBillNumber = 1
                }
            }
        }

        // Create bill and add user
        let bill = createBill({
            id: billRef.id,
            restaurant_id: restaurantRef.id,
            bill_number: bill_count + 1,
            bill_code,
            restaurant: table.restaurant,
            table: { id: table.id, name: table.name, code: table.code },
            analytics_helper: {
                day_id: daySnapshot.id,
                day_created: daySnapshot.data().timestamps.created || null,
            },
            gratuities: { percent: automatic_gratuity_percent },
            is_test,
            ...user_id && {
                user_ids: [user_id],
                user_status: { [user_id]: { order_total: 0, paid_total: 0, number_of_payments: 0, name } },
            },
        })

        bill.timestamps.created = admin.firestore.Timestamp.now()

        transaction.set(billRef, bill)

        if (user_id) { // ??? Call joinBill instead?
            transaction.set(
                billRef.collection('BillUsers').doc(user_id),
                createBillUser(bill, { id: user_id, name })
            )

            transaction.update(
                admin.firestore().collection('UsersPOS').doc(user_id),
                {
                    'torte.open_bills': admin.firestore.FieldValue.arrayUnion({
                        bill_id: bill.id,
                        restaurant: table.restaurant,
                        date: dateToString(bill.timestamps.created.toDate()), // cannot use serverTimestamp in array :(, and Timestamp.now is not reproducible
                        // created: bill.timestamps.created // 
                    })
                }
            )
        }

        transaction.update(
            billCountRef,
            { [is_test ? 'bill_count_test' : 'bill_count']: admin.firestore.FieldValue.increment(1) }
        )

        transaction.set(daySnapshot.ref, {
            bill_ids: admin.firestore.FieldValue.arrayUnion(bill.id),
            usage: {
                devices: {
                    joined: admin.firestore.FieldValue.increment(1)
                },
                tables: admin.firestore.FieldValue.increment(1)
            }
        }, { merge: true })

        return { bill, created: true }
    })
        .catch(reportErrors('bill2', 'transactCreateBill'))
}

/**
 * Setter function to add user an an existing bill
 * Returns the bill
 *
 * @param {Object} transaction Existing transaction object
 * @param {Object} bill Firestore document for bill
 * @param {String} user_id
 * @param {String} name Name of user
 */
const joinBill = async (transaction, bill, user_id, name) => {
    const restaurantRef = admin.firestore().collection('Restaurants').doc(bill.restaurant_id)
    const billRef = restaurantRef.collection('Bills').doc(bill.id)

    transaction.set(
        billRef,
        {
            user_ids: admin.firestore.FieldValue.arrayUnion(user_id),
            user_status: { [user_id]: { order_total: 0, paid_total: 0, number_of_payments: 0, name } }
        },
        { merge: true }
    )

    transaction.set(
        billRef.collection('BillUsers').doc(user_id),
        createBillUser(bill, { id: user_id, name })
    )

    transaction.update(
        admin.firestore().collection('UsersPOS').doc(user_id),
        {
            'torte.open_bills': admin.firestore.FieldValue.arrayUnion({
                bill_id: billRef.id,
                restaurant: bill.restaurant,
                date: dateToString(bill.timestamps.created.toDate()),
            })
        }
    )

    const dayRef = restaurantRef.collection('Days').doc(bill.analytics_helper.day_id)
    transaction.set(dayRef, {
        usage: {
            devices: {
                joined: admin.firestore.FieldValue.increment(1)
            },
        }
    }, { merge: true })

    return { bill, joined: true }
}

/**
 * Query to find table matching user-input code
 * Returns the tableSnapshot
 *
 * @param {Object} restaurantRef Firestore reference to restaurant.
 * @param {String} table_code User-provided table code (case enforced client-side)
 */
const getTableWithCode = async (restaurantRef, table_code) => {
    const tablesQuerySnapshot = await restaurantRef
        .collection('Tables')
        .where('code', '==', table_code)
        .get()

    if (!tablesQuerySnapshot.size) {
        throw new functions.https.HttpsError('invalid-argument', `This restaurant does not have a table with code ${table_code}.`)
    }

    return tablesQuerySnapshot.docs[0]
}

/**
 * Query to find table matching provided ID
 * Returns the tableSnapshot
 *
 * @param {Object} restaurantRef Firestore reference to restaurant.
 * @param {String} table_id ID of table
 */
const getTableWithID = async (restaurantRef, table_id) => {
    const tableSnapshot = await restaurantRef
        .collection('Tables')
        .doc(table_id)
        .get()

    if (!tableSnapshot.exists) {
        throw new functions.https.HttpsError('invalid-argument', `This restaurant does not have a table with id ${table_id}.`)
    }

    return tableSnapshot
}

/**
 * Checks table for existing open bills
 * Returns the querySnapshot
 *
 * @param {Object} restaurantRef Firestore reference to restaurant.
 * @param {String} table_id ID of table
 */
const findOpenBillsOnTable = async (restaurantRef, table_id) => {
    return await restaurantRef
        .collection('Bills')
        .where('table.id', '==', table_id)
        .where('timestamps.closed', '==', null)
        .orderBy('timestamps.created', 'desc')
        .get()
}

/**
 * Checks provided table information and automates response/alert
 * If anonymous user -> return {table, unnamed: true} (CLIENT: Request user name and create account)
 * ??? Warn if open bill at ANY table? Or just this table?
 * If user already has bill at table -> return {bill, table, previous: true} (CLIENT: Alert user to previous bill for input)
 * If empty, server-created bill at table -> return {table, empty: emptyBill.id} (CLIENT: Alert user for input)
 * If other bills exist at table -> return {table, occupied: true} (CLIENT: bill number input)
 * Else transactCreateBill (CLIENT: enter bill)
 *
 * @param {String} restaurant_id ID of restaurant
 * @param {String} table_code User-provided code for table
 * @param {String} table_id ID of table
 * @param {String} name (optional) name of user
 */
exports.tableFromCodeOrID = functions.https.onCall(async (data, context) => {
    const user_id = context.auth && context.auth.uid;

    const {
        restaurant_id,
        table_code,
        table_id,
        name,
    } = data

    const restaurantRef = admin.firestore().collection('Restaurants').doc(restaurant_id)

    const tableSnapshot = table_id ? await getTableWithID(restaurantRef, table_id) : await getTableWithCode(restaurantRef, table_code)
    if (!user_id || !name) return { table: tableSnapshot.data(), unnamed: true }

    const openBills = await findOpenBillsOnTable(restaurantRef, tableSnapshot.id)

    // if (!ignorePrevious) 
    const previousBill = openBills.docs.find(doc => doc.data().user_ids.includes(user_id))
    if (previousBill) return { bill: previousBill.data(), table: tableSnapshot.data(), previous: true, }

    const emptyBill = openBills.docs.find(doc => !doc.data().user_ids.length)
    if (emptyBill) return { table: tableSnapshot.data(), empty: emptyBill.id }

    if (openBills.size) return { table: tableSnapshot.data(), occupied: true, }

    return await transactCreateBill(restaurantRef, tableSnapshot.id, user_id, name)
})

/**
 * Attempt to join a bill based on ID
 * If user already in bill -> return {bill, rejoined: true} (CLIENT: enter bill)
 * Else joinBill (CLIENT: enter bill)
 *
 * @param {String} restaurant_id ID of restaurant
 * @param {String} bill_id ID of bill
 * @param {String} name (optional) name of user
 */
exports.billFromID = functions.https.onCall(async (data, context) => {
    const user_id = context.auth && context.auth.uid;

    const {
        restaurant_id,
        bill_id,
        name,
    } = data

    const restaurantRef = admin.firestore().collection('Restaurants').doc(restaurant_id)
    const billRef = restaurantRef.collection('Bills').doc(bill_id)

    return admin.firestore().runTransaction(async transaction => {
        const bill = await getSnapshotData(billRef, transaction)

        if (!user_id || !name) {
            const table = await getSnapshotData(restaurantRef.collection('Tables').doc(bill.table.id), transaction)
            return { table, unnamed: true }
        }

        if (bill.user_ids.includes(user_id)) return { bill, rejoined: true }
        return await joinBill(transaction, bill, user_id, name) // transaction
    })
        .catch(reportErrors('bill2', 'billFromID'))
})

/**
 * Attempt to join a bill based on code
 * Preconditions: User has already provided their name and retrieved the table_id
 * If user already in bill -> return {bill, rejoined: true} (CLIENT: enter bill)
 * Else joinBill (CLIENT: enter bill)
 *
 * @param {String} restaurant_id ID of restaurant
 * @param {String} table_id ID of table
 * @param {String} bill_code User-inputted code for bill
 * @param {String} name Name of user
 */
exports.billFromCode = functions.https.onCall(async (data, context) => {
    const user_id = context.auth && context.auth.uid;

    const {
        restaurant_id,
        table_id,
        bill_code,
        name,
    } = data

    const restaurantRef = admin.firestore().collection('Restaurants').doc(restaurant_id)

    const billQuerySnapshot = await restaurantRef.collection('Bills')
        .where('bill_code', '==', bill_code)
        .where('table.id', '==', table_id)
        .where('timestamps.closed', '==', null)
        .orderBy('timestamps.created', 'desc')
        .limit(1)
        .get()

    if (!billQuerySnapshot.size) throw new functions.https.HttpsError('invalid-argument', `There is no bill at this table with code ${bill_code}.`)
    if (billQuerySnapshot.docs[0].data().user_ids.includes(user_id)) return { bill: billQuerySnapshot.docs[0].data(), rejoined: true }

    return admin.firestore().runTransaction(async transaction => {
        const bill = await getSnapshotData(billQuerySnapshot.docs[0].ref, transaction)

        // Repeat checks under transaction
        if (bill.timestamps.closed) throw new functions.https.HttpsError('failed-precondition', 'This bill was already closed by a server.')
        if (bill.user_ids.includes(user_id)) return { bill, rejoined: true }

        return await joinBill(transaction, bill, user_id, name) // transaction
    })
        .catch(reportErrors('bill2', 'billFromCode'))
})

/**
 * User requests a new bill for their table
 *
 * @param {String} restaurant_id ID of restaurant
 * @param {String} table_id ID of table
 * @param {String} name Name of user
 */
exports.createBillAtTable = functions.https.onCall(async (data, context) => {
    const user_id = context.auth && context.auth.uid;

    if (!user_id) throw new functions.https.HttpsError('unauthenticated', 'You must have an account to create a bill.')

    const {
        restaurant_id,
        table_id,
        name,
    } = data

    if (!name) throw new functions.https.HttpsError('permission-denied', 'Your account needs a name to create a bill.')

    return await transactCreateBill(admin.firestore().collection('Restaurants').doc(restaurant_id), table_id, user_id, name)
})

/**
 * Restaurant requests a new bill
 * Returned number of existing bills at table or creates a new bill
 *
 * @param {String} restaurant_id ID of restaurant
 * @param {String} table_id ID of table
 * @param {String} ignoreOpenBills Allow multiple bills at a single table
 */
exports.createEmptyBillAtTable = functions.https.onCall(async (data, context) => {
    // Allowed Torte demo override control
    const is_admin = context.auth && context.auth.token.is_admin
    const user_id = context.auth && context.auth.uid;

    const {
        restaurant_id,
        table_id,
        ignoreOpenBills,
    } = data

    if (user_id !== restaurant_id && !is_admin) throw new functions.https.HttpsError('permission-denied', 'You do not have permission to create a bill.')

    const restaurantRef = admin.firestore().collection('Restaurants').doc(restaurant_id)

    if (!ignoreOpenBills) {
        const openBills = await findOpenBillsOnTable(restaurantRef, table_id)
        if (openBills.size) return { occupied: openBills.size }
    }

    return await transactCreateBill(restaurantRef, table_id)
})