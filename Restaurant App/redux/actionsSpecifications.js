export const SET_SPEC = 'SET_SPEC'
export const DELETE_SPEC = 'DELETE_SPEC'

export function setSpecification(specification_id, data) {
    // console.log('set spec: ', specification_id)
    return { type: SET_SPEC, specification_id, data }
}

export function deleteSpecification(specification_id) {
    // console.log('delete spec: ', specification_id)
    return { type: DELETE_SPEC, specification_id }
}