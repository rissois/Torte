
export const doSuccessAdd = () => {
    return { type: 'success/ADD_SUCCESS' }
}

export const doSuccessRemove = (time) => {
    return { type: 'success/REMOVE_SUCCESS', time }
}

export const doSuccessReset = () => {
    return { type: 'success/RESET_SUCCESS' }
}
