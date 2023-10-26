import { useSelector, } from 'react-redux';
import { selectBillCode, selectBillID, selectIsMenuOnly, selectRestaurantID, selectRestaurantName, selectTableName } from '../../redux/selectors/selectorsBill';
import firestore from '@react-native-firebase/firestore'
import { selectTrackedRestaurantID } from '../../redux/selectors/selectorsRestaurant2';

export function useBillID() {
    return useSelector(selectBillID)
}

export function useBillRef() {
    const bill_id = useSelector(selectBillID)
    const restaurantRef = useRestaurantRef()

    return restaurantRef && bill_id ? restaurantRef?.collection('Bills').doc(bill_id) : null
}

export function useTableName() {
    return useSelector(selectTableName)
}

export function useBillCode() {
    return useSelector(selectBillCode)
}

export function useRestaurantID() {
    return useSelector(selectTrackedRestaurantID)
}

export function useRestaurantName() {
    return useSelector(selectRestaurantName)
}

export function useRestaurantRef() {
    const restaurant_id = useSelector(selectRestaurantID)
    return restaurant_id ? firestore().collection('Restaurants').doc(restaurant_id) : null
}

export function useIsMenuOnly() {
    return useSelector(selectIsMenuOnly)
}