export const stripeCardBrandToFontAwesome = (brand) => {
    switch (brand) {
        case 'AmericanExpress':
        case 'amex':
            return 'cc-amex'
        case 'DinersClub':
        case 'diners':
            return 'cc-diners-club'
        case 'Discover':
        case 'discover':
            return 'cc-discover'
        case 'JCB':
        case 'jcb':
            return 'cc-jcb'
        case 'MasterCard':
        case 'mastercard':
            return 'cc-mastercard'
        case 'Visa':
        case 'visa':
            return 'cc-visa'
        case 'UnionPay':
        case 'Unknown':
        case 'unknown':
        default:
            return 'credit-card-alt'
    }
}