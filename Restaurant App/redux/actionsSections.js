export const SET_SECTION = 'SET_SECTION'
export const DELETE_SECTION = 'DELETE_SECTION'

export function setSection(section_id, data) {
    // console.log('set section: ', section_id)
    return { type: SET_SECTION, section_id, data }
}

export function deleteSection(section_id) {
    // console.log('delete section: ', section_id)
    return { type: DELETE_SECTION, section_id }
}