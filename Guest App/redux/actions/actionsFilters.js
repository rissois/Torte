export const doFilterToggle = (key) => {
    return { type: 'filters/TOGGLE_FILTER', key }
}

export const doFiltersReset = () => {
    return { type: 'filters/RESET_FILTERS' }
}