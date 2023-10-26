export default getOptionFilterStatus = (filters, activeFilterKeys) => {
    let isNumber = false
    activeFilterKeys.forEach(key => {
        if (filters[key] === false) return { isFilteredOut: true }
        else if (typeof filters[key] === 'number') isNumber = true
    })
    return { isFilterPossible: true }
}