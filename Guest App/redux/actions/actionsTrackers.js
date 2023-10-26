export const doTrackersSet = (trackers) => {
    return { type: 'trackers/SET_TRACKERS', trackers }
}

export const doTrackersClearItem = () => {
    return { type: 'trackers/CLEAR_ITEM_TRACKERS' }
}

export const doTrackersClearMenu = () => {
    return { type: 'trackers/CLEAR_MENU_TRACKERS' }
}

export const doTrackersClear = () => {
    return { type: 'trackers/CLEAR_TRACKERS' }
}