import { useSelector, } from 'react-redux';
import firebase from 'firebase';
import { selectRestaurant } from '../../redux/selectors/selectorsRestaurant';

export function useRestaurant() {
  return useSelector(selectRestaurant)
}

export function useRestaurantID() {
  return useSelector(state => state.restaurant.id)
}

export function useRestaurantName() {
  return useSelector(state => state.restaurant.name)
}

export function useRestaurantIsTestMode() {
  return useSelector(state => state.restaurant.is_hidden || !state.restaurant.is_live)
}

export function useIsRestaurantTestMode() {
  return useSelector(state => state.restaurant.is_hidden || !state.restaurant.is_live)
}

export function useRestaurantRef() {
  const restaurant_id = useRestaurantID()
  if (!restaurant_id) return null
  return firebase.firestore().collection('Restaurants').doc(restaurant_id)
}