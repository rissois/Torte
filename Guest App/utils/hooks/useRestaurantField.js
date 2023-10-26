import { useSelector, } from 'react-redux';
import { selectRestaurantName } from '../../redux/selectors/selectorsRestaurant';


export function useRestaurantName() {
  return useSelector(selectRestaurantName)
}
