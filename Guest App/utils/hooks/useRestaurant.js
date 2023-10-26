import { useSelector, } from 'react-redux';
import { selectIsRestaurantOffline, selectRestaurantName, selectTrackedRestaurant } from '../../redux/selectors/selectorsRestaurant2';

export function useRestaurant() {
    return useSelector(selectTrackedRestaurant)
}

export function useRestaurantName() {
    return useSelector(selectRestaurantName)
}

export function useIsRestaurantOffline() {
    return useSelector(selectIsRestaurantOffline)
}