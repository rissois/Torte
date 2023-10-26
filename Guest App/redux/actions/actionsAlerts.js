export const doAlertAdd = (header, text, options, dismiss, isHeaderRed, isRowOfOptions) => {
    return async function (dispatch, getState) {
        dispatch(doAlertAddDispatch({
            header,
            text,
            options,
            dismiss,
            isHeaderRed,
            isRowOfOptions,
            clearAlert: () => dispatch(doAlertRemove())
        }))
    }
}

const doAlertAddDispatch = (alert) => {
    return { type: 'alerts/ADD_ALERT', alert }
}

export const doAlertRemove = () => {
    return { type: 'alerts/REMOVE_ALERT' }
}

export const doAlertsReset = () => {
    return { type: 'alerts/RESET_ALERTS' }
}
