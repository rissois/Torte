export const SET_RESTAURANT = 'SET_RESTAURANT'

export function setRestaurant(restaurant) {
    return ({ type: SET_RESTAURANT, restaurant })
}