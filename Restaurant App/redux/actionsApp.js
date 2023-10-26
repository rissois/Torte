export const LISTENER_COMPLETE = 'LISTENER_COMPLETE'
export const CHANGE_RESTAURANT = 'CHANGE_RESTAURANT'
export const BULK_SET_CATEGORY = 'BULK_SET_CATEGORY'
export const UPDATE_FROM_CATEGORY = 'UPDATE_FROM_CATEGORY'
export const CLEAR_FROM_CATEGORY = 'CLEAR_FROM_CATEGORY'

// Currently only used for Employees
export function setListenerComplete(category) {
    return { type: LISTENER_COMPLETE, category }
}

export function bulkSetCategory(category, bulk) {
    return { type: BULK_SET_CATEGORY, category, bulk }
}

export function updateFromCategory(category, id, data) {
    return { type: UPDATE_FROM_CATEGORY, category, id, data }
}

export function clearFromCategory(category, id) {
    return { type: CLEAR_FROM_CATEGORY, category, id }
}

export function changeRestaurant(restaurant_id) {
    return { type: CHANGE_RESTAURANT, restaurant_id }
}