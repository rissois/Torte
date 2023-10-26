import firebase from '../config/Firebase';


export default async function transactRefund(restaurant_id, bill_id, user_id, amount, reason, server_id, ignoreRepeat) {
  let billRef = firebase.firestore()
    .collection('restaurants').doc(restaurant_id)
    .collection('bills').doc(bill_id)

  return firebase.firestore().runTransaction(async transaction => {
    let billDoc = await transaction.get(billRef)

    const { refunds = {}, user_summaries: { [user_id]: { paid: user_paid } } } = billDoc.data()

    if (Object.keys(refunds).some(refund_id => refunds[refund_id].user_id === user_id && refunds[refund_id].status === 'processing')) {
      throw new Error('Already processing refund for this user')
    }

    // Prevent exceeding available amount
    if (amount > user_paid.final - (user_paid.discounts || 0) - (user_paid.refunds || 0)) {
      throw new Error('Refund exceeds available')
    }

    // If this value is a repeat of a previous value, confirm intention
    if (!ignoreRepeat && Object.keys(refunds).some(refund_id => refunds[refund_id].amount === amount && refunds[refund_id].user_id === user_id && refunds[refund_id].status !== 'failed')) {
      throw 'repeat'
    }

    let refundRef = billRef.collection('billRefunds').doc()

    transaction.set(refundRef, {
      user_id,
      amount,
      server_reason: reason,
      server_id,
      initiated: firebase.firestore.FieldValue.serverTimestamp(),
      bill_created: billDoc.data().timestamps.created,
      status: 'processing'
    })

    transaction.set(billRef, {
      refunds: {
        [refundRef.id]: {
          user_id,
          amount,
          server_reason: reason,
          initiated: firebase.firestore.FieldValue.serverTimestamp(),
          status: 'processing'
        }
      }
    }, { merge: true })

  })
}


