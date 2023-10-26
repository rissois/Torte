import { useSelector, } from 'react-redux';
import firebase from '../config/Firebase';

export default function useRestaurant() {
  const store_id = useSelector(state => state.restaurant?.restaurant_id)

  return store_id || firebase.auth()?.currentUser?.uid
}