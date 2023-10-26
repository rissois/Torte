import firebase from '../config/Firebase';

/*
A word on servers editing a bill

Bills cannot be edited once the bill is already split evenly, fully paid, or marked as closed / unpaid

Items can be added, edited, or deleted:

An added item is not assigned to any seat. It is merged with any matching groups
A deleted item is simply removed from all references.
An edited item is also not assigned to any seat. This is largely because my code is crap, and should be changed. 
  It is also merged with with any matching groups.
  The original item is removed from all references.
  An edited item is automatically given a new billItem document
*/


export default async function transactCashCard(restaurant_id, bill_id, new_cc) {
  let billRef = firebase.firestore()
    .collection('restaurants').doc(restaurant_id)
    .collection('bills').doc(bill_id)

  return firebase.firestore().runTransaction(async transaction => {

    let billDoc = await transaction.get(billRef)

    if (!billDoc.exists) {
      throw 'Bill does not exist'
    }

    let { cash_or_card = [], timestamps, paid, summary, server_details } = billDoc.data()

    let new_paid = paid ? { ...paid } : {
      subtotal: 0,
      tax: 0,
      total: 0,
      sum_tip: 0,
      table_tip: 0,
      discounts: 0,
      final: 0,
    }

    if (timestamps.auto_checkout) {
      throw 'auto'
    }
    else if (timestamps.server_marked_closed) {
      throw 'closed'
    }

    let delta_cc = 0

    /*
      Adding / editing server-generated CC payments
    */
    if (new_cc) {
      // subtract all previous cash or card
      // add all new card or card

      cash_or_card.forEach(cc => {
        new_paid.total -= cc.amount
        new_paid.final -= cc.amount
        delta_cc -= cc.amount
        // paid.sum_tip -= cc.tip
      })


      new_cc.forEach(cc => {
        new_paid.total += cc.amount
        new_paid.final += cc.amount
        delta_cc += cc.amount
        // paid.sum_tip += cc.tip
      })

      // Mark cart if the paid in full status changes
      if (new_paid.total >= summary.total && !(paid?.total >= summary.total)) {
        transaction.set(billRef.collection('billOrders').doc('cart'), {
          payments: {
            paid_in_full: true,
          }
        }, { merge: true })
      }
      else if (!(new_paid.total >= summary.total) && paid?.total >= summary.total) {
        transaction.set(billRef.collection('billOrders').doc('cart'), {
          payments: {
            paid_in_full: false,
          }
        }, { merge: true })
      }

      // if paid now empty, set to null
      if (new_paid.total === 0 && new_paid.final === 0) {
        new_paid = null
      }

      transaction.set(billRef, {
        paid: new_paid,
        cash_or_card: new_cc,
      }, { merge: true })
    }
    /*
      Auto-filling paid amount with CC payments
    */
    else {
      transaction.set(billRef.collection('billOrders').doc('cart'), {
        payments: {
          paid_in_full: true,
        }
      }, { merge: true })

      let amountUnpaid = summary.total - (paid?.total ?? 0)
      new_paid.total += amountUnpaid
      new_paid.final += amountUnpaid
      delta_cc += amountUnpaid

      transaction.set(billRef, {
        paid: new_paid,
        cash_or_card: firebase.firestore.FieldValue.arrayUnion({
          name: 'Closing with remaining balance',
          amount: amountUnpaid,
        }),
      }, { merge: true })
    }

    console.log(delta_cc)

    const daysCollection = billRef.parent.parent.collection('restaurantDays')

    transaction.set(daysCollection.doc('cumulative'), {
      cash_or_card: firebase.firestore.FieldValue.increment(delta_cc),
    }, { merge: true })

    const startDayRef = (await daysCollection.where('created', "<=", timestamps.created || new Date()).orderBy('created', 'desc').limit(1).get()).docs[0].ref

    transaction.set(startDayRef, {
      servers: {
        [server_details.id || 'none']: {
          cash_or_card: firebase.firestore.FieldValue.increment(delta_cc),
        }
      },
      cash_or_card: firebase.firestore.FieldValue.increment(delta_cc),
    }, { merge: true })


  })
}





