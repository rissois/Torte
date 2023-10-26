export const SET_CART = 'SET_CART'
export const DELETE_CART = 'DELETE_CART'

export function setCart(bill_id, data) {
    // console.log('set cart: ', bill_id)
    return { type: SET_CART, bill_id, data }
}

export function deleteCart(bill_id) {
    // console.log('delete cart: ', bill_id)
    return { type: DELETE_CART, bill_id }
}