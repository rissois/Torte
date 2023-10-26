import firebase from '../config/Firebase';
const db = firebase.firestore();


export default async function writeAutoGratuity(restaurant_id, bill_id, auto_gratuity) {
  db.collection('restaurants').doc(restaurant_id)
    .collection('bills').doc(bill_id).set(
      {
        auto_gratuity
      }, { merge: true }
    )


  // const billRef = db.collection('restaurants').doc(restaurant_id)
  //   .collection('bills').doc(bill_id)

  // return db.runTransaction(async transaction => {

  //   // const billDoc = await transaction.get(billRef)

  //   // if (!billDoc.exists) {
  //   //   throw 'Bill does not exist'
  //   // }

  //   transaction.set(
  //     billRef,
  //     {
  //       auto_gratuity
  //     },
  //     { merge: true }
  //   )
  // })
}

