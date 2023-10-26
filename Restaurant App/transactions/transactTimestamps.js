import firebase from '../config/Firebase';

export const transactMarkClosed = async (restaurant_id, bill_id, ignoreCart) => {
  let restaurantRef = firebase.firestore()
    .collection('restaurants').doc(restaurant_id)
  let billRef = restaurantRef
    .collection('bills').doc(bill_id)

  return firebase.firestore().runTransaction(async transaction => {
    await checkOrders(transaction, billRef, ignoreCart)

    let billDoc = await transaction.get(billRef)

    if (!billDoc.exists) {
      throw new Error('Bill does not exist')
    }

    let { paid, summary, timestamps: { server_marked_closed, auto_checkout }, ref_code_id, user_summaries, } = billDoc.data()

    if (server_marked_closed) {
      return null
    }

    if (auto_checkout) {
      throw new Error('Bill already checkout out')
    }

    let amountUnpaid = (summary.total ?? 0) - (paid?.total ?? 0)
    if (amountUnpaid > 0) {
      throw { amountUnpaid }
    }

    // Only close refCode if still the same bill_id
    // Bill may have been reopened when the refCode was reassigned
    const refCodeRef = restaurantRef.collection('refCodes').doc(ref_code_id)
    let refCodeDoc = await transaction.get(refCodeRef)
    if (refCodeDoc.data().bill_id === bill_id) {
      transaction.update(refCodeDoc.ref, {
        closed: firebase.firestore.FieldValue.serverTimestamp()
      })
    }

    transaction.set(billRef.collection('billOrders').doc('cart'), {
      timestamps: {
        server_marked_closed: firebase.firestore.FieldValue.serverTimestamp(),
        server_marked_unpaid: null,
      }
    }, { merge: true })

    transaction.set(billRef, {
      timestamps: {
        server_marked_closed: firebase.firestore.FieldValue.serverTimestamp(),
        server_marked_unpaid: null,
        restaurant_confirmed_unpaid: null,
      }
    }, { merge: true })

    let user_ids = []

    Object.keys(user_summaries).forEach(user_key => {
      if (!user_summaries[user_key].paid || user_summaries[user_key].paid === 'initiating') {
        user_ids.push(user_key)
      }
    })

    firebase.functions().httpsCallable('closeBill-closeBill')({ bill_id, user_ids })
  })
}


export const transactMarkUnpaid = async (restaurant_id, bill_id, ignoreCart, ignorePaid) => {
  let restaurantRef = firebase.firestore()
    .collection('restaurants').doc(restaurant_id)
  let billRef = restaurantRef
    .collection('bills').doc(bill_id)

  return firebase.firestore().runTransaction(async transaction => {
    await checkOrders(transaction, billRef, ignoreCart)

    let billDoc = await transaction.get(billRef)

    if (!billDoc.exists) {
      throw new Error('Bill does not exist')
    }

    let { paid, summary, timestamps: { created, server_marked_unpaid, auto_checkout }, server_details, cash_or_card, user_statuses } = billDoc.data()

    if (server_marked_unpaid) {
      return null
    }
    if (auto_checkout) {
      throw new Error('Bill already checkout out')
    }

    if (!ignorePaid && !(summary.total - (paid?.total ?? 0))) {
      throw { isPaid: true }
    }

    transaction.set(billRef.collection('billOrders').doc('cart'), {
      timestamps: {
        server_marked_closed: null,
        server_marked_unpaid: firebase.firestore.FieldValue.serverTimestamp(),
      }
    }, { merge: true })

    transaction.set(billRef, {
      timestamps: {
        server_marked_closed: null,
        server_marked_unpaid: firebase.firestore.FieldValue.serverTimestamp(),
        restaurant_confirmed_unpaid: null,
      }
    }, { merge: true })
  })
}

export const transactConfirmUnpaid = async (restaurant_id, bill_id, ignorePaid) => {
  let restaurantRef = firebase.firestore()
    .collection('restaurants').doc(restaurant_id)
  let billRef = restaurantRef
    .collection('bills').doc(bill_id)

  return firebase.firestore().runTransaction(async transaction => {

    let billDoc = await transaction.get(billRef)

    if (!billDoc.exists) {
      throw new Error('Bill does not exist')
    }

    let { paid, summary, timestamps: { server_marked_closed, server_marked_unpaid, restaurant_confirmed_unpaid, auto_checkout } } = billDoc.data()

    if (restaurant_confirmed_unpaid) {
      return null
    }
    if (auto_checkout) {
      throw new Error('Bill already checkout out')
    }

    if (!ignorePaid && !(summary.total - (paid?.total ?? 0))) {
      throw { isPaid: true }
    }

    transaction.set(billRef, {
      timestamps: {
        restaurant_confirmed_unpaid: firebase.firestore.FieldValue.serverTimestamp(),
      }
    }, { merge: true })
  })
}

export const transactUnconfirmUnpaid = async (restaurant_id, bill_id) => {
  let restaurantRef = firebase.firestore()
    .collection('restaurants').doc(restaurant_id)
  let billRef = restaurantRef
    .collection('bills').doc(bill_id)

  return firebase.firestore().runTransaction(async transaction => {

    let billDoc = await transaction.get(billRef)

    if (!billDoc.exists) {
      throw new Error('Bill does not exist')
    }

    let { paid, summary, timestamps: { server_marked_closed, server_marked_unpaid, restaurant_confirmed_unpaid, auto_checkout } } = billDoc.data()

    if (!restaurant_confirmed_unpaid) {
      return null
    }
    if (auto_checkout) {
      throw new Error('Bill already checkout out')
    }

    transaction.set(billRef, {
      timestamps: {
        restaurant_confirmed_unpaid: null,
      }
    }, { merge: true })
  })
}

export const transactReopenBill = (restaurant_id, bill_id, ignorePaid) => {
  let restaurantRef = firebase.firestore()
    .collection('restaurants').doc(restaurant_id)
  let billRef = restaurantRef
    .collection('bills').doc(bill_id)

  return firebase.firestore().runTransaction(async transaction => {
    let billDoc = await transaction.get(billRef)

    if (!billDoc.exists) {
      throw new Error('Bill does not exist')
    }

    let { paid, summary, timestamps: { server_marked_closed, server_marked_unpaid, restaurant_confirmed_unpaid, auto_checkout }, ref_code_id, user_summaries } = billDoc.data()

    if (!server_marked_closed && !server_marked_unpaid && !restaurant_confirmed_unpaid) {
      return null
    }

    if (auto_checkout) {
      throw new Error('Bill already checkout out')
    }

    if (!ignorePaid && !(summary.total - (paid?.total ?? 0))) {
      throw { isPaid: true }
    }

    if (server_marked_closed) {
      const refCodeRef = restaurantRef.collection('refCodes').doc(ref_code_id)
      let refCodeDoc = await transaction.get(refCodeRef)
      if (refCodeDoc.data().bill_id === bill_id) {
        transaction.update(refCodeRef, {
          closed: false
        })
      }
    }

    transaction.set(billRef.collection('billOrders').doc('cart'), {
      timestamps: {
        server_marked_closed: null,
        server_marked_unpaid: null,
      }
    }, { merge: true })

    transaction.set(billRef, {
      timestamps: {
        server_marked_closed: null,
        server_marked_unpaid: null,
        restaurant_confirmed_unpaid: null,
      }
    }, { merge: true })

    let user_ids = []

    Object.keys(user_summaries).forEach(user_key => {
      if (!user_summaries[user_key].paid || user_summaries[user_key].paid === 'initiating') {
        user_ids.push(user_key)
      }
    })

    firebase.functions().httpsCallable('closeBill-closeBill')({ bill_id, user_ids, reopen: true })
  })
}

async function checkOrders(transaction, billRef, ignoreCart) {
  let cartRef = billRef.collection('billOrders').doc('cart')
  let cartDoc = await transaction.get(cartRef)

  if (!cartDoc.exists) {
    throw new Error('Cart does not exist')
  }

  let { orders, submits } = cartDoc.data()

  let hasOrders = Object.keys(orders).length
  let arrayUntransferred = []
  let hasCountdown = false

  Object.keys(submits).forEach(submission_id => {
    if (submits[submission_id].submission_status === 'countdown_partial' || submits[submission_id].submission_status === 'countdown_all') {
      hasCountdown = true
    }

    if (submits[submission_id].order_id && !submits[submission_id].transferred) {
      arrayUntransferred.push({
        submission_id,
        order_id: submits[submission_id].order_id
      })
    }
  })

  if (hasCountdown) {
    throw { hasCountdown: true } //'Users are placing an order'
  }
  else if (arrayUntransferred.length) {
    throw { arrayUntransferred }
  }
  else if (hasOrders && !ignoreCart) {
    throw { hasOrders }
  }

  return null
}