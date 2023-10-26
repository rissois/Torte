exports.centsToDollar = (cents) => {
    if (isNaN(cents)) return '$0.00'
    return (cents < 0 ? '-$' : '$') + (Math.abs(cents) / 100).toFixed(2);
}

exports.dateToString = (date) => {
    return date.getMonth() + 1 + '/' + date.getDate()
}

exports.parentAndVariantFields = (fieldName, fieldID, obj,) => ({
    ...obj,
    [fieldName]: {
        [fieldID || 'default']: { ...obj }
    }
})

exports.arrayToCommaList = (arr, or) => {
    if (!arr) return ''
    let copy = [...arr]
    if (!copy.length) return ''
    if (copy.length === 1) return copy[0]
    const last = copy.pop();
    return copy.join(', ') + (copy.length >= 2 ? ',' : '') + (or ? ' or ' : ' and ') + last;
}

// DOES NOT HANDLE FIELDVALUES!!!
exports.mergeDeep = (target, ...sources) => {
    const recursion = (target, ...sources) => {

        if (!sources.length) return target

        const source = sources.shift()

        if (isObject(target) && isObject(source)) {
            for (const key in source) {
                if (isObject(source[key])) {
                    if (!target[key]) Object.assign(target, { [key]: {} });
                    recursion(target[key], source[key]);
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }

        return recursion(target, ...sources);
    }

    return recursion(target, ...sources)
}

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}
