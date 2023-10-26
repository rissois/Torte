export const CLEAR_TRACKER = 'CLEAR_TRACKER'
export const SET_TRACKER = 'SET_TRACKER'
export const REMOVE_TRACKER = 'REMOVE_TRACKER'

export function clearTracker() {
    // console.log('clear tracker',)
    return ({ type: CLEAR_TRACKER, })
}

export function setTracker(payload) {
    // console.log('set tracker: ', JSON.stringify(payload))
    return { type: SET_TRACKER, payload }
}

export function removeTracker(category) {
    // console.log('remove tracker from: ', category)
    return { type: REMOVE_TRACKER, category }
}