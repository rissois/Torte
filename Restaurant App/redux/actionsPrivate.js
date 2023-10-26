export const SET_PRIVATE_DOC = 'SET_PRIVATE_DOC'

export function setPrivateDoc(name, data) {
    return ({ type: SET_PRIVATE_DOC, name, data })
}