import firebase from '../config/Firebase';
import { useSelector, } from 'react-redux';

export const writeTransferBills = async (restaurant_id, bill_ids, server_details, table_details) => {
  // if (!server_details) {
  //   server_details = {
  //     name: '',
  //     id: ''
  //   }
  // }

  if (typeof bill_ids === 'string') {
    bill_ids = [bill_ids]
  }

  let restaurantRef = firebase.firestore()
    .collection('restaurants').doc(restaurant_id)

  return await Promise.all(
    bill_ids.map(async bill_id => {

      const billRef = restaurantRef
        .collection('bills').doc(bill_id)

      // Only transfer the ongoing documents (bill and cart)
      // Do not edit orders already placed

      var batch = firebase.firestore().batch()

      batch.update(billRef, {
        ...server_details && { server_details },
        ...table_details && { table_details },
      })

      batch.update(billRef.collection('billOrders').doc('cart'), {
        ...server_details && { server_details },
        ...table_details && { table_details },
      })

      return await batch.commit()
      // allSettled was not working
    }).map(p => p.catch(e => e)))
}
