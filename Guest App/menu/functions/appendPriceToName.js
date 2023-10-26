import centsToDollar from "../../utils/functions/centsToDollar"

export const appendPriceToName = (name, price, plus = true) => {
    if (!price) {
        return name
    }
    return name + (plus ? ' (+' : ' (') + centsToDollar(price) + ')'
    // if (!name || price == null) return 'Missing value'
    // if (price) return name + ' (' + centsToDollar(price) + ')'
    // if (zeroToFree) return name + ' (free)'
    // if (hideFree) return name
    // return name + ' (' + centsToDollar(price) + ')'
}