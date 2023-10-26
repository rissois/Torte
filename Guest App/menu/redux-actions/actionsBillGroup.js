import firestore from '@react-native-firebase/firestore'
import { doAlertAdd } from "../../redux/actions/actionsAlerts"
import { doSelectionsInitialize } from "../../redux/actions/actionsSelections"
import { doTrackersSet } from "../../redux/actions/actionsTrackers"
import { createBillItemAnalytics } from "../../utils/functions/analyticsHelpers"
import { indexesToPosition } from "../functions/indexesToPosition"
import { selectionsToCaptions } from "../../utils/functions/summarizeSelections"
import { selectionsToSubtotal } from "../functions/selectionsToSubtotal"

/*
Well the items do need the selections so the server can adjust things.
But the ORDER transaction can verify all the items, promotions, timing, in one fell swoop.
with each order, just save the user_id and the groups they want. Then you can do transaction.getAll
*/

const doStartBillGroup = (id) => {
    return { type: 'firestore/START_BILL_GROUP', id }
}

export const doSuccessBillGroup = (id) => {
    return { type: 'firestore/SUCCESS_BILL_GROUP', id }
}

export const doFailBillGroup = (id) => {
    return { type: 'firestore/FAIL_BILL_GROUP', id }
}

export const doTransactBillGroup = (quantity, comment, bill_group_id) => {
    return async function (dispatch, getState) {

        const { trackers, selections, user: { user: { id: myID } }, } = getState()
        const {
            restaurant_id,
            bill_id,
            item_id,
            variant_id,
            menuPosition,
            dotw_id,
            period_id,
            meal_id,
            menu_id,
            panel_id,
            section_id,
        } = trackers

        const billRef = firestore().collection('Restaurants').doc(restaurant_id)
            .collection('Bills').doc(bill_id)


        const groupRef = !!bill_group_id ? billRef.collection('BillGroups').doc(bill_group_id) : billRef.collection('BillGroups').doc()

        dispatch(doStartBillGroup(groupRef.id))

        let name = undefined
        let course = undefined
        let position = undefined

        if (!bill_group_id) {
            const restaurant = getState().restaurants[restaurant_id]

            const menu = restaurant.menus[menu_id]
            const section = restaurant.sections[section_id]
            const item = restaurant.items[item_id]

            // DON'T YOU NEED .variants?
            const variant = { ...item, ...item?.[variant_id] }

            name = variant.name
            course = variant.course // NOTE: Will become a selection
            position = menuPosition + indexesToPosition(
                menu.section_order.indexOf(section_id),
                section.item_order.findIndex(item => item.item_id === item_id && item.variant_id === variant_id))
        }

        try {
            await firestore().runTransaction(async transaction => {
                // FUTURE: make sure bill is still accepting orders
                const billDoc = (await transaction.get(billRef)).data()

                if (bill_group_id) {
                    if (!billDoc.cart_status.bill_group_ids.includes(bill_group_id)) {
                        // Either deleted OR pending order OR completed order
                        throw 'Group cannot be edited'
                    }
                }

                transaction.set(billRef, {
                    cart_status: {
                        bill_group_ids: firestore.FieldValue.arrayUnion(groupRef.id)
                    }
                }, { merge: true })

                const { bill_order_id } = billDoc.order_status
                // might be a little stale... but unlikely and fine if fails
                if (bill_order_id && getState().bill.billOrders[bill_order_id]?.wait_user_ids?.includes(myID)) {
                    transaction.set(billRef.collection('BillOrders').doc(bill_order_id), {
                        timestamps: {
                            last_activity: firestore.FieldValue.serverTimestamp()
                        }
                    }, { merge: true })
                }

                if (bill_group_id) {
                    transaction.update(groupRef, {
                        quantity,
                        summary: {
                            subtotal: selectionsToSubtotal(selections),
                        },
                        comment,
                        captions: selectionsToCaptions(selections),

                        is_asap: false,

                        size: selections.size,
                        modifiers: selections.modifiers,
                        filters: selections.filters,
                        upsells: selections.upsells,

                        analytics_helper: createBillItemAnalytics(selections, billDoc.analytics_helper.day_id, billDoc.analytics_helper.day_created, !!panel_id),
                    })
                }
                else {
                    transaction.set(groupRef,
                        {
                            quantity,
                            summary: {
                                subtotal: selectionsToSubtotal(selections),
                            },
                            comment,
                            captions: selectionsToCaptions(selections),

                            is_asap: false,

                            size: selections.size,
                            modifiers: selections.modifiers,
                            filters: selections.filters,
                            upsells: selections.upsells,

                            analytics_helper: createBillItemAnalytics(selections, billDoc.analytics_helper.day_id, billDoc.analytics_helper.day_created, !!panel_id),
                            // Can simplify to ...selections

                            ...!bill_group_id && {
                                id: groupRef.id,
                                restaurant_id,
                                user_id: myID,
                                bill_id,
                                table_id: billDoc.table.id,

                                reference_ids: { dotw_id, period_id, meal_id, menu_id, section_id, panel_id, item_id, variant_id, },
                                name,
                                position,
                                timestamps: {
                                    cart: firestore.FieldValue.serverTimestamp(),
                                    ordered: null,
                                    itemized: null,
                                },
                                course, // will become a selection
                            }
                        })
                }
            })

            dispatch(doSuccessBillGroup(groupRef.id))
        }
        catch (error) {
            console.log('writeBillGroup error: ', error)
            dispatch(doAlertAdd('Unable to save item', 'Please try again and let us know if the issue persists.'))
            // NOTE: In the future, consider an on-screen error. 
            // You can even re-submit with all the stored details
            dispatch(doFailBillGroup(groupRef.id))
        }
    }
}

export const doDeleteBillGroup = (bill_group_id) => {
    return async function (dispatch, getState) {

        const {
            restaurant_id,
            bill_id,
        } = getState().trackers

        try {
            await firestore().runTransaction(async transaction => {
                const billRef = firestore().collection('Restaurants').doc(restaurant_id)
                    .collection('Bills').doc(bill_id)

                const billDoc = (await transaction.get(billRef)).data()

                transaction.set(billRef, {
                    cart_status: {
                        bill_group_ids: firestore.FieldValue.arrayRemove(bill_group_id)
                    }
                }, { merge: true })

                const { bill_order_id } = billDoc.order_status
                // might be a little stale... but unlikely and fine if fails
                if (bill_order_id && getState().bill.billOrders[bill_order_id]?.wait_user_ids?.includes(myID)) {
                    transaction.set(billRef.collection('BillOrders').doc(bill_order_id), {
                        timestamps: {
                            last_activity: firestore.FieldValue.serverTimestamp()
                        }
                    }, { merge: true })
                }

                transaction.delete(billRef.collection('BillGroups').doc(bill_group_id))
            })
        }
        catch (error) {
            console.log('deleteBillGroup error: ', error)
            dispatch(doAlertAdd('Unable to delete item(s)', 'Please try again and let us know if the issue persists'))
        }
    }
}

export const doOpenBillGroup = (bill_group_id) => {
    return async function (dispatch, getState) {
        const {
            filters,
            modifiers,
            size,
            upsells,
            reference_ids: { item_id, variant_id }
        } = getState().bill.billGroups[bill_group_id]

        dispatch(doTrackersSet({
            item_id,
            variant_id,
            bill_group_id,
        }))

        dispatch(doSelectionsInitialize({
            size: { ...size },
            filters: { ...filters },
            upsells: upsells.map(upsell => ({ ...upsell })),
            modifiers: Object.keys(modifiers).reduce((obj, id) => {
                return {
                    ...obj, [id]: {
                        ...modifiers[id],
                        mods: modifiers[id].mods.map(option => ({ ...option }))
                    }
                }
            }, {}),
        }))
    }
}


/*
REMOVE FROM CARTGROUPS BUT REQUIRED FOR BILLITEMS:
const tax_rate = restaurant.tax_rates[variant.tax_rate_id]
const tax = Math.round(subtotal * tax_rate.percent / 100)

timestamps: {
    paid: null,
    claimed: null,
}

subtotal // will be equal to price
tax,
tax_rate: {
    id: variant.tax_rate_id,
    ...tax_rate,
},
total: subtotal + tax,
units: {
    available: [{ subtotal, tax }],
    claimed: {},
    paid: {},
},

custom: [],
voided: {
    server_id: '',
    manager_id: '',
},

analytics_helper: {
    paid_user_ids: [],
}
*/