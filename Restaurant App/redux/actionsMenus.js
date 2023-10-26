export const SET_MENU = 'SET_MENU'
export const DELETE_MENU = 'DELETE_MENU'

export function setMenu(menu_id, data) {
    // console.log('set menu: ', menu_id)
    return { type: SET_MENU, menu_id, data }
}

export function deleteMenu(menu_id) {
    // console.log('delete menu: ', menu_id)
    return { type: DELETE_MENU, menu_id }
}