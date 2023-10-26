export const doListenerStarted = (parent, category, listener) => {
    return { type: 'listeners/SET_LISTENER', parent, category, listener }
}

export const doListenerChildrenUnsubscribe = (parent) => {
    return async function (dispatch, getState) {
        const { [parent]: existingListeners } = getState().listeners
        let nulledFields = {}

        Object.keys(existingListeners).forEach(category => {
            if (!!existingListeners[category]) {
                existingListeners[category]()
            }
            nulledFields[category] = null
        })

        dispatch(doListenerRemoved(parent, nulledFields))
    }
}

const doListenerRemoved = (parent, nulledFields) => {
    return { type: 'listeners/REMOVE_LISTENER', parent, nulledFields }
}
