const initialRestaurant = {
    is_order_disabled: true,
    is_pay_disabled: false,
    is_pickup_disabled: true,
    address: {
        city: '',
        line1: '',
        line2: '',
        state: '',
        zip: '',
    },
    code: '',
    cuisine: '',
    days: {
        '0': { earliest: '', hours: [], is_closed: false, is_overnight: false, latest: '', was_overnight: false },
        '1': { earliest: '', hours: [], is_closed: false, is_overnight: false, latest: '', was_overnight: false },
        '2': { earliest: '', hours: [], is_closed: false, is_overnight: false, latest: '', was_overnight: false },
        '3': { earliest: '', hours: [], is_closed: false, is_overnight: false, latest: '', was_overnight: false },
        '4': { earliest: '', hours: [], is_closed: false, is_overnight: false, latest: '', was_overnight: false },
        '5': { earliest: '', hours: [], is_closed: false, is_overnight: false, latest: '', was_overnight: false },
        '6': { earliest: '', hours: [], is_closed: false, is_overnight: false, latest: '', was_overnight: false },
    },
    description: '',
    email: '',
    geo: { geohash: '', geopoint: null, latitude: '', longitude: '' },
    gratuities: {
        is_tip_enabled: false,
        is_automatic_tip_enabled: true,
        is_charge_tip_enabled: true,

        automatic: { default_option: 18, options: [18, 20, 22], party_size: 6 },
        charge: { default_option: 20, },
        prompts: {
            is_no_tip_warned: true,
            is_percent_based: true,
            cents: { default_option: 0, options: [100, 150, 200], },
            percent: { default_option: 20, options: [15, 18, 20], },
        },
    },
    id: '',
    is_hidden: true,
    is_live: false,
    logo: {
        date_modified: null,
        name: '',
    },
    meals: {},
    name: '',
    phone: '',
    price_range: 3,
    stripe: {
        live: { connect_id: '' },
        test: { connect_id: '' },
    },
    tags: [],
    tax_rates: {},
    time: {
        day_timezone: 'America/New_York',
        timezone: 'America/New_York',
    },
    website: {
        menus: [],
        url: 'tortepay.com'
    },
}

export default function restaurant(state = initialRestaurant, action) {
    switch (action.type) {
        case 'restaurant/UPDATE_RESTAURANT':
            return {
                ...state,
                ...action.data
            }
        case 'app/RESET':
            return initialRestaurant
        default:
            return state;
    }
}
