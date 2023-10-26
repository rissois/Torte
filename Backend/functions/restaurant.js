const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { dayTemplate } = require('./helpers/dayTemplate');
const moment = require('moment-timezone');

exports.createRestaurant = functions.https.onCall(async (data, context) => {
    if (!context.auth.token.is_admin) {
        return {
            error: 'Request not authorized. User must be a moderator to create a restaurant.'
        }
    }

    const { name, email, password } = data

    const restaurantRef = admin.firestore().collection('Restaurants').doc()
    const restaurant_id = restaurantRef.id

    try {
        await admin.auth().createUser({
            email,
            name,
            password,
        })

        return admin.firestore().runTransaction(async transaction => {
            let restaurantCountRef = admin.firestore().collection('Torte').doc('RestaurantCount')
            let { count } = (await transaction.get(restaurantCountRef)).data()
            transaction.update(restaurantCountRef, {
                count: count + 1
            })

            transaction.set(restaurantRef, {
                is_order_enabled: false,
                is_pay_enabled: true,
                is_pickup_enabled: false,
                address: {
                    city: '',
                    line1: '',
                    line2: '',
                    state: '',
                    zip_code: '',
                },
                code: '',
                cuisine: '',
                days: {
                    '0': {
                        earliest: '',
                        hours: [],
                        is_closed: false,
                        is_overnight: false,
                        latest: '',
                        was_overnight: false,
                    },
                    '1': {
                        earliest: '',
                        hours: [],
                        is_closed: false,
                        is_overnight: false,
                        latest: '',
                        was_overnight: false,
                    },
                    '2': {
                        earliest: '',
                        hours: [],
                        is_closed: false,
                        is_overnight: false,
                        latest: '',
                        was_overnight: false,
                    },
                    '3': {
                        earliest: '',
                        hours: [],
                        is_closed: false,
                        is_overnight: false,
                        latest: '',
                        was_overnight: false,
                    },
                    '4': {
                        earliest: '',
                        hours: [],
                        is_closed: false,
                        is_overnight: false,
                        latest: '',
                        was_overnight: false,
                    },
                    '5': {
                        earliest: '',
                        hours: [],
                        is_closed: false,
                        is_overnight: false,
                        latest: '',
                        was_overnight: false,
                    },
                    '6': {
                        earliest: '',
                        hours: [],
                        is_closed: false,
                        is_overnight: false,
                        latest: '',
                        was_overnight: false,
                    },
                },
                description: '',
                email: '',
                geo: {
                    geohash: '',
                    geopoint: null,
                    latitude: '',
                    longitude: '',
                },
                gratuities: {
                    automatic: {
                        default_option: 18,
                        options: [18, 20, 25],
                        party_size: 6,
                    },
                    charge: {
                        default_option: 20,
                    },
                    is_automatic_tip_enabled: true,
                    is_charge_tip_enabled: true,
                    is_tip_enabled: true,
                    prompts: {
                        cents: {
                            default_option: 0,
                            options: [100, 150, 200]
                        },
                        is_no_tip_warned: true,
                        is_percent_based: true,
                        percent: {
                            default_option: 20,
                            options: [18, 20, 25]
                        },
                    }
                },
                id: restaurant_id,
                is_hidden: true,
                is_live: false,
                logo: {
                    date_modified: null,
                    name: 'logo',
                },
                meals: {},
                name,
                phone: '',
                price_range: 2,
                status: {
                    last_changed: null,
                    state: 'offline',
                },
                stripe: {
                    live: {
                        connect_id: '',
                    },
                    text: {
                        connect_id: '',
                    },
                },
                tags: [],
                tax_rates: {},
                time: {
                    day_timezone: 'America/New_York',
                    timezone: 'America/New_York',
                },
                website: {
                    menus: [],
                    url: '',
                }
            })

            transaction.set(restaurantRef.collection('Private').doc('Contact'), {
                auth_email: email,
                date_joined: admin.firestore.FieldValue.serverTimestamp(),
                email: '',
                id: 'Contact',
                restaurant_id,
                phone: '',
                restaurant_no: count + 1,
            })

            const today = moment.tz('America/New_York').add(1, 'days').startOf('day')
            const tomorrow = moment.tz('America/New_York').startOf('day')

            const todayRef = restaurantRef.collection('Days').doc()
            const tomorrowRef = restaurantRef.collection('Days').doc()

            transaction.set(todayRef, {
                ...dayTemplate(),
                id: todayRef.id,
                restaurant_id,
                timestamps: {
                    created: admin.firestore.Timestamp.fromMillis(today),
                },
                is_test: false,
            })
            transaction.set(todayRef.parent.doc(todayRef.id + '_test'), {
                ...dayTemplate(),
                id: todayRef.id + '_test',
                restaurant_id,
                timestamps: {
                    created: admin.firestore.Timestamp.fromMillis(today),
                },
                is_test: true,
            })

            transaction.set(tomorrowRef, {
                ...dayTemplate(),
                id: tomorrowRef.id,
                restaurant_id,
                timestamps: {
                    created: admin.firestore.Timestamp.fromMillis(tomorrow),
                },
                is_test: false,
            })
            transaction.set(tomorrowRef.parent.doc(tomorrowRef.id + '_test'), {
                ...dayTemplate(),
                id: tomorrowRef.id + '_test',
                restaurant_id,
                timestamps: {
                    created: admin.firestore.Timestamp.fromMillis(tomorrow),
                },
                is_test: true,
            })

            return { restaurant_id }
        })
    }
    catch (error) {
        console.log(error)
        return { error: 'Failed to create restaurant' }
    }


})