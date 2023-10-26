import firebase from '../config/Firebase';


export default async function writePin(restaurant_id, server_id, pin) {
  return firebase.firestore().collection('restaurants').doc(restaurant_id)
    .collection('restaurantEmployees').doc(server_id)
    .update({ pin })
}