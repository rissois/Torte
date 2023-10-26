import firebase from '../config/Firebase';


export default async function batchOrderTransferred(restaurant_id, bill_id, order_id, submission_id) {
  let restaurantRef = firebase.firestore().collection('restaurants').doc(restaurant_id)

  const batch = firebase.firestore().batch()

  // edit order
  batch.update(restaurantRef.collection('bills').doc(bill_id).collection('billOrders').doc(order_id), {
    transferred: firebase.firestore.FieldValue.serverTimestamp(),
  })

  // edit cart
  batch.set(restaurantRef.collection('bills').doc(bill_id).collection('billOrders').doc('cart'), {
    submits: { [submission_id]: { transferred: firebase.firestore.FieldValue.serverTimestamp() } }
  }, { merge: true })

  return batch.commit()
}