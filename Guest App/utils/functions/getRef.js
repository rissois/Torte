import firestore from '@react-native-firebase/firestore'

export function getRestaurantRef(restaurant_id) {
  return firestore().collection('Restaurants').doc(restaurant_id)
}