export const doTrackersSet = (trackers) => {
    return { type: 'trackers/SET_TRACKERS', trackers }
}

export const doTrackersClearSpecific = (field) => {
    return { type: 'trackers/CLEAR_SPECIFIC', field }
}

export const doTrackersClearAll = () => {
    return { type: 'trackers/CLEAR_ALL' }
}