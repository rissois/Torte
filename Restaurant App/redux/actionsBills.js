import { Audio } from 'expo-av';

export const SET_BILL = 'SET_BILL'
export const DELETE_BILL = 'DELETE_BILL'
export const SET_MINI_BILL = 'SET_MINI_BILL'
export const ALERT_BILL = 'ALERT_BILL'

const startSound = require('../assets/Paying.wav')
const completeSound = require('../assets/Finished.wav')

export function processBill(bill_id, data, initializedWithPayment = false) {
    return async function (dispatch, getState) {
        dispatch(setBill(bill_id, data))

        const alerts = getState().alerts[bill_id]

        const {
            pay: { format_locked },
            summary,
            paid,
            timestamps: { server_marked_unpaid }
        } = data

        if (!alerts?.payment_started && Object.keys(format_locked).some(key => format_locked[key]) && !server_marked_unpaid) {
            if (!initializedWithPayment) {
                try {
                    const { sound } = await Audio.Sound.createAsync(startSound);
                    console.log('DING! Payment start');
                    await sound.playAsync();
                }
                catch (error) {
                    console.log('LOCKED SOUND ERROR: ', error)
                }
            }
            dispatch(alertBill(bill_id, 'payment_started'))
        }

        if (!alerts?.payment_completed && paid?.total >= summary.total && !server_marked_unpaid) {
            if (!initializedWithPayment) {
                try {
                    const { sound } = await Audio.Sound.createAsync(completeSound);
                    console.log('DING! Payment Complete');
                    await sound.playAsync();
                }
                catch (error) {
                    console.log('Payment SOUND ERROR: ', error)
                }
            }
            dispatch(alertBill(bill_id, 'payment_completed'))
        }
    }
}

export function alertBill(bill_id, field, value = true) {
    return { type: ALERT_BILL, bill_id, field, value }
}

export function setBill(bill_id, data) {
    const {
        server_details: { id: server_id },
        table_details: { id: table_id },
        ref_code,
        timestamps: {
            auto_checkout,
            restaurant_confirmed_unpaid,
            server_marked_closed,
            server_marked_unpaid,
            created
        } } = data

    const mini = {
        bill_id,
        server_id,
        table_id,
        ref_code,
        status: auto_checkout || server_marked_closed ? 'closed' : server_marked_unpaid || restaurant_confirmed_unpaid ? 'unpaid' : 'open',
        created: created.toMillis(),
        marked: (auto_checkout || restaurant_confirmed_unpaid || server_marked_unpaid || server_marked_closed)?.toMillis() ?? null
    }

    return { type: SET_BILL, bill_id, data, mini }
}

export function deleteBill(bill_id) {
    return { type: DELETE_BILL, bill_id }
}