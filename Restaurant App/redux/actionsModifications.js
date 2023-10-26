export const SET_MOD = 'SET_MOD'
export const DELETE_MOD = 'DELETE_MOD'

export function setModification(modification_id, data) {
    // console.log('set modification: ', modification_id)
    return { type: SET_MOD, modification_id, data }
}

export function deleteModification(modification_id) {
    // console.log('delete modification: ', modification_id)
    return { type: DELETE_MOD, modification_id }
}