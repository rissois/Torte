export const doListenerStarted = (category, listener) => {
    return { type: 'listeners/SET_LISTENER', category, listener }
}

export const doListenerChildrenUnsubscribe = () => {
    return async function (dispatch, getState) {
        const existingListeners = getState().listeners
        let nulledFields = {}

        Object.keys(existingListeners).forEach(category => {
            if (!!existingListeners[category]) {
                existingListeners[category]()
            }
            nulledFields[category] = null
        })

        dispatch(doListenerRemoved(nulledFields))
    }
}

const doListenerRemoved = (nulledFields) => {
    return { type: 'listeners/REMOVE_LISTENER', nulledFields }
}
