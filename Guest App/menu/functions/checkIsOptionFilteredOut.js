export default checkIsOptionFilteredOut = (filters, activeFilterKeys) => activeFilterKeys.some(filter_key => !filters[filter_key])