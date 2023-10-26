export const stripeCardBrandToFontAwesome = (brand) => {
    switch (brand) {
        case 'AmericanExpress':
            return 'cc-amex'
        case 'DinersClub':
            return 'cc-diners-club'
        case 'Discover':
            return 'cc-discover'
        case 'JCB':
            return 'cc-jcb'
        case 'MasterCard':
            return 'cc-mastercard'
        case 'Visa':
            return 'cc-visa'
        case 'UnionPay':
        case 'Unknown':
        default:
            return 'credit-card-alt'
    }
}