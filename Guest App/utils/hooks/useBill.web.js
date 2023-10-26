import { useSelector, } from 'react-redux';
import { selectBillCode, selectBillID, selectIsMenuOnly, selectIsOrderEnabled, selectRestaurantID, selectRestaurantName, selectTableName } from '../../redux/selectors/selectorsBill';
import { doc, getFirestore } from 'firebase/firestore'
import { selectTrackedRestaurantID } from '../../redux/selectors/selectorsRestaurant2';
import firebaseApp from '../../firebase/firebase';

const firestore = getFirestore(firebaseApp)

export function useBillID() {
    return useSelector(selectBillID)
}

export function useBillRef() {
    const bill_id = useSelector(selectBillID)
    const restaurantRef = useRestaurantRef()

    return restaurantRef && bill_id ? doc(restaurantRef, 'Bills', bill_id) : null
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
    return restaurant_id ? doc(firestore, 'Restaurants', restaurant_id) : null
}

export function useIsMenuOnly() {
    return useSelector(selectIsMenuOnly)
}

export function useIsOrderEnabled() {
    return useSelector(selectIsOrderEnabled)
}