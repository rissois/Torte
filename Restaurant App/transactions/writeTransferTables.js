import firebase from '../config/Firebase';

export const writeTransferTables = async (restaurant_id, table_ids, employee_id = '', employee_name = '') => {

  if (employee_id && !employee_name) {
    throw 'Cannot get server name'
  }

  // if (typeof table_ids === 'string') {
  //   table_ids = [table_ids]
  // }

  const server_details = {
    name: employee_name,
    id: employee_id
  }

  let restaurantRef = firebase.firestore()
    .collection('restaurants').doc(restaurant_id)


  return await Promise.all(
    table_ids
      .map(async table_id => {
        return await restaurantRef.collection('restaurantTables').doc(table_id).update({ server_details })
          .then(() => undefined).catch(error => {
            console.log('transfer table error: ', error)
            return table_id
          })
      })
      // allSettled was not working
      .map(p => p.catch(e => e))
  )
}
