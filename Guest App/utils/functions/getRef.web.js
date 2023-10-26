import { doc, getFirestore } from 'firebase/firestore'
import firebaseApp from '../../firebase/firebase'

const firestore = getFirestore(firebaseApp)

export function getRestaurantRef(restaurant_id) {
  return doc(firestore, 'Restaurants', restaurant_id)
}