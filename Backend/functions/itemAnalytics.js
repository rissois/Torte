/* eslint-disable no-extra-boolean-cast */
/* eslint-disable no-implicit-coercion */
/* eslint-disable no-await-in-loop */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const zeroItem = {
    analytics_helper: { day_id: '', is_panel_click: false },
    captions: { size: '', filters: '', upsells: '', modifiers: '', custom: '' },
    size: { name: '', code: '', price: '' },
    filters: {},
    upsells: [],
    modifiers: {},
    custom: [],
    summary: {
        subtotal: 0,
        tax: 0,
        total: 0,
    },
    reference_ids: {
        item_id: '',
        variant_id: '',
    },
    voided: {
        is_voided: false,
    },
    comped: {
        is_comped: false,
        subtotal: 0,
        tax: 0,
        percent: 0,
    },
}

const zeroUpsell = {
    upsell_first_free: 0,
    quantity: 0,
    price: 0,
}

// modifier_id, name, modifier_first_free, index
const zeroModifier = {
    modifier_first_free: 0,
    mods: []
}

// item_id, option_id, variant_id, name, price, quantity
const zeroMod = {
    price: 0,
    quantity: 0,
    free: 0,
}

const getUpsellFree = ({ upsell_first_free, quantity }) => upsell_first_free > quantity ? quantity : upsell_first_free
const getUpsellPrice = upsell => upsell.price * (upsell.quantity - getUpsellFree(upsell))

const optionsArrayToObject = options => options.reduce((acc, curr) => ({ ...acc, [curr.variant_id || curr.item_id || curr.option_id]: curr }), {})
const optionsArrayWithFree = (options, remainingFree) => options
    .sort((a, b) => b.price - a.price)
    .map(option => {
        if (remainingFree >= option.quantity) {
            remainingFree -= option.quantity
            return { ...option, free: option.quantity }
        }

        let lastFree = remainingFree
        remainingFree = 0
        return { ...option, free: lastFree }
    })

const sanitize = val => val || 0

/**
 * Record analytics for items ordered
 * Separate document from BillItems to avoid units and splitting
 */
exports.itemAnalytics = functions.firestore
    .document('Restaurants/{restaurant_id}/Bills/{bill_id}/BillItemAnalytics/{bill_item_id}')
    .onWrite(async (change, context) => {
        const { restaurant_id, bill_id, bill_item_id } = context.params

        const before = change.before.exists && !change.before.data().voided.is_voided ? change.before.data() : zeroItem
        const after = change.after.exists && !change.after.data().voided.is_voided ? change.after.data() : zeroItem

        const day_id = after.analytics_helper.day_id || before.analytics_helper.day_id
        const item_id = after.reference_ids.item_id || before.reference_ids.item_id
        const variant_id = after.reference_ids.variant_id || before.reference_ids.variant_id
        const name = after.name || before.name
        const user_id = after.user_id || before.user_id

        const deltaQuantity = sanitize(!!after.id - !!before.id)
        const deltaSubtotal = sanitize(after.summary.subtotal - before.summary.subtotal)

        const deltaTax = after.summary.tax - before.summary.tax

        const restaurantRef = change.after.ref.parent.parent.parent.parent
        const dayRef = restaurantRef.collection('Days').doc(day_id)

        const created = (await dayRef.get()).data().timestamps.created

        const batch = admin.firestore().batch()

        if (deltaSubtotal || deltaTax) {
            batch.set(dayRef, {
                order_summary: {
                    subtotal: admin.firestore.FieldValue.increment(deltaSubtotal),
                    tax: admin.firestore.FieldValue.increment(deltaTax),
                    total: admin.firestore.FieldValue.increment(deltaSubtotal + deltaTax),
                },
                orders: {
                    [user_id === 'server' ? 'server' : 'user']: {
                        subtotal: admin.firestore.FieldValue.increment(deltaSubtotal),
                        tax: admin.firestore.FieldValue.increment(deltaTax),
                        total: admin.firestore.FieldValue.increment(deltaSubtotal + deltaTax),
                    }
                }
            }, { merge: true })
        }

        if (user_id && user_id !== 'server') {
            const deltaVoidedQuantity = sanitize(after.voided.is_voided - before.voided.is_voided)

            if (deltaVoidedQuantity) {
                batch.set(dayRef, {
                    voids: {
                        quantity: admin.firestore.FieldValue.increment(deltaVoidedQuantity),
                        subtotal: admin.firestore.FieldValue.increment(-deltaSubtotal),
                        tax: admin.firestore.FieldValue.increment(-deltaTax), // not really necessary...
                    }
                }, { merge: true })
            }
        }

        const tax_rate = after.tax_rate || before.tax_rate
        if (deltaTax) {
            await batch.set(dayRef.collection('DayTaxes').doc(tax_rate.id), {
                id: tax_rate.id,
                restaurant_id,
                day_id,
                name: tax_rate.name,
                percent: tax_rate.percent,
                order_summary: {
                    quantity: admin.firestore.FieldValue.increment(deltaQuantity),
                    tax: admin.firestore.FieldValue.increment(deltaTax),
                },
                timestamps: {
                    created,
                }
            }, { merge: true })
        }

        const dayItemRef = dayRef.collection('DayItems').doc(item_id)
        const dayItemVariantRef = dayItemRef.collection('DayItemVariants').doc(variant_id || 'root')


        if (deltaQuantity || deltaSubtotal || deltaTax) {
            let itemRoot = {
                id: item_id,
                restaurant_id,
                day_id,
                name: after.name || before.name,
                order_summary: {
                    quantity: admin.firestore.FieldValue.increment(deltaQuantity),
                    subtotal: admin.firestore.FieldValue.increment(deltaSubtotal),
                    tax: admin.firestore.FieldValue.increment(deltaTax),
                    total: admin.firestore.FieldValue.increment(deltaSubtotal + deltaTax),
                },
                timestamps: {
                    created
                }
            }
            batch.set(dayItemRef, itemRoot, { merge: true })
            batch.set(dayItemVariantRef, { ...itemRoot, id: variant_id, item_id }, { merge: true })
        }

        if (before.captions.size !== after.captions.size) {
            const sizeRoot = {
                sizes: {
                    ...!!before.captions.size && { [before.size.name + before.size.price]: admin.firestore.FieldValue.increment(-1) },
                    ...!!after.captions.size && { [after.size.name + after.size.price]: admin.firestore.FieldValue.increment(1) },
                },
            }

            // NO DAY REF, specific to item
            batch.set(dayItemRef, sizeRoot, { merge: true })
            batch.set(dayItemVariantRef, sizeRoot, { merge: true })
        }

        const deltaComment = !!after.comment - !!before.comment
        if (deltaComment) {
            const commentRoot = {
                comments: {
                    quantity: admin.firestore.FieldValue.increment(deltaComment),
                },
            }
            batch.set(dayRef, commentRoot, { merge: true })
            batch.set(dayItemRef, commentRoot, { merge: true })
            batch.set(dayItemVariantRef, commentRoot, { merge: true })
        }

        const deltaCompSubtotal = after.comped.subtotal - before.comped.subtotal
        const deltaCompTax = after.comped.tax - before.comped.tax
        const deltaCompPercent = after.comped.percent - before.comped.percent

        if (deltaCompSubtotal || deltaCompTax || deltaCompPercent) {
            const compRoot = {
                comps: {
                    quantity: admin.firestore.FieldValue.increment(after.comped.is_comped - before.comped.is_comped),
                    subtotal: admin.firestore.FieldValue.increment(deltaCompSubtotal),
                    tax: admin.firestore.FieldValue.increment(deltaCompTax),
                    percent: admin.firestore.FieldValue.increment(deltaCompPercent), // avg comp
                }
            }
            batch.set(dayRef, compRoot, { merge: true })
            batch.set(dayItemRef, compRoot, { merge: true })
            batch.set(dayItemVariantRef, compRoot, { merge: true })
        }

        const deltaPanel = !!after.analytics_helper.is_panel_click - !!before.analytics_helper.is_panel_click
        if (deltaPanel) {
            const isPanelClickRoot = {
                is_panel_click: {
                    quantity: admin.firestore.FieldValue.increment(deltaComment),
                },
            }
            batch.set(dayRef, isPanelClickRoot, { merge: true })
            batch.set(dayItemRef, isPanelClickRoot, { merge: true })
            batch.set(dayItemVariantRef, isPanelClickRoot, { merge: true })
        }

        // const getPrice = filterValue = typeof filterValue === 'number' ? filterValue : 0
        // if (before.captions.filters !== after.captions.filters) {
        //     // it honestly might be easier to batch each key, before and after, separately...
        //     const filterKeys = Object.keys({ ...before.filters, ...after.filters })
        //     let filterIncrements = { quantity: 0, price: 0, }
        //     Object.keys(filterKeys).forEach(filterKey => {
        //         const deltaPrice = getPrice(after.filters[filterKey]) - getPrice(before.filters[filterKey])
        //         const deltaQuantity = typeof after.filters[filterKey] === 'number' - typeof before.filters[filterKey] === 'number'
        //         if (!deltaPrice && !deltaQuantity) return
        //         filterIncrements.quantity += deltaQuantity
        //         filterIncrements.price += deltaPrice
        //         filterIncrements[filterKey] += deltaQuantity
        //     })

        //     const filterObj = Object.keys(filterIncrements).reduce((acc, curr) => ({ ...acc, [curr]: admin.firestore.FieldValue.increment(filterIncrements[curr]) }), {})
        //     batch.set(dayRef, filterObj, { merge: true })
        //     batch.set(dayItemRef, filterObj, { merge: true })
        //     batch.set(dayItemVariantRef, filterObj, { merge: true })
        // }

        if (before.captions.filters !== after.captions.filters) {
            Object.keys(before.filters).forEach(filterKey => {
                const price = before.filters[filterKey]
                if (typeof price !== 'number') return // precaution against booleans
                const filterRoot = {
                    filters: {
                        quantity: admin.firestore.FieldValue.increment(-1),
                        price: admin.firestore.FieldValue.increment(-price),
                        [filterKey]: {
                            quantity: admin.firestore.FieldValue.increment(-1),
                            price: admin.firestore.FieldValue.increment(-price),
                        }
                    },
                }
                batch.set(dayRef, filterRoot, { merge: true })
                batch.set(dayItemRef, filterRoot, { merge: true })
                batch.set(dayItemVariantRef, filterRoot, { merge: true })
            })

            Object.keys(after.filters).forEach(filterKey => {
                const price = after.filters[filterKey]
                if (typeof price !== 'number') return // precaution against booleans
                const filterRoot = {
                    filters: {
                        quantity: admin.firestore.FieldValue.increment(1),
                        price: admin.firestore.FieldValue.increment(price),
                        [filterKey]: {
                            quantity: admin.firestore.FieldValue.increment(1),
                            price: admin.firestore.FieldValue.increment(price),
                        },
                    },
                }
                batch.set(dayRef, filterRoot, { merge: true })
                batch.set(dayItemRef, filterRoot, { merge: true })
                batch.set(dayItemVariantRef, filterRoot, { merge: true })
            })
        }


        if (before.captions.upsells !== after.captions.upsells) {

            const beforeUpsells = optionsArrayToObject(before.upsells)
            const afterUpsells = optionsArrayToObject(after.upsells)
            const composite = { ...beforeUpsells, ...afterUpsells }
            Object.keys(composite).forEach(upsell_id => {
                const a = afterUpsells[upsell_id] || zeroUpsell
                const b = beforeUpsells[upsell_id] || zeroUpsell

                const deltaQuantity = a.quantity - b.quantity
                const deltaUnique = !!afterUpsells[upsell_id] - !!beforeUpsells[upsell_id]
                const deltaFree = getUpsellFree(a) - getUpsellFree(b)
                const deltaPrice = getUpsellPrice(a) - getUpsellPrice(b)
                if (!deltaQuantity && !deltaFree && !deltaUnique && !deltaPrice) return

                // Parent collections (days, items)
                const upsellRoot = {
                    upsells: {
                        quantity: admin.firestore.FieldValue.increment(deltaQuantity),
                        unique: admin.firestore.FieldValue.increment(deltaUnique),
                        free: admin.firestore.FieldValue.increment(deltaFree),
                        price: admin.firestore.FieldValue.increment(deltaPrice),
                    },
                }
                batch.set(dayRef, upsellRoot, { merge: true })
                batch.set(dayItemRef, upsellRoot, { merge: true })
                batch.set(dayItemVariantRef, upsellRoot, { merge: true })

                const upsell = composite[upsell_id]
                const upsellLeaf = {
                    id: upsell.item_id || upsell.option_id,
                    restaurant_id,
                    day_id,
                    upsell_item_id: upsell.item_id,
                    upsell_option_id: upsell.option_id,
                    upsell_variant_id: upsell.variant_id,
                    name: upsell.name,
                    quantity: admin.firestore.FieldValue.increment(deltaQuantity),
                    unique: admin.firestore.FieldValue.increment(deltaUnique),
                    free: admin.firestore.FieldValue.increment(deltaFree),
                    price: admin.firestore.FieldValue.increment(deltaPrice),
                    timestamps: {
                        created
                    }
                }
                const upsellVariantLeaf = { ...upsellLeaf, id: upsell.variant_id || 'root' }

                const item_variant_id = variant_id || 'root'

                // DAY > ITEM > UPSELL (+ upsell variant)
                const dayItemUpsellRef = dayItemRef.collection('DayItemUpsells').doc(upsellLeaf.id)
                batch.set(dayItemUpsellRef, { ...upsellLeaf, item_item_id: item_id }, { merge: true })
                const dayItemUpsellVariantRef = dayItemUpsellRef.collection('DayItemUpsellVariants').doc(upsellVariantLeaf.id)
                batch.set(dayItemUpsellVariantRef, { ...upsellVariantLeaf, item_item_id: item_id }, { merge: true })

                // DAY > ITEM > VARIANT > UPSELL (+ upsell variant)
                const dayItemVariantUpsellRef = dayItemVariantRef.collection('DayItemVariantUpsells').doc(upsellLeaf.id)
                batch.set(dayItemVariantUpsellRef, { ...upsellLeaf, item_item_id: item_id, item_variant_id }, { merge: true })
                const dayItemVariantUpsellVariantRef = dayItemVariantUpsellRef.collection('DayItemVariantUpsellVariantss').doc(upsellVariantLeaf.id)
                batch.set(dayItemVariantUpsellVariantRef, { ...upsellVariantLeaf, item_item_id: item_id, item_variant_id }, { merge: true })

                const dayUpsellRef = dayRef.collection('DayUpsells').doc(upsellLeaf.id)
                batch.set(dayUpsellRef, upsellLeaf, { merge: true })
                const dayUpsellVariantRef = dayUpsellRef.collection('DayUpsellVariants').doc(upsellVariantLeaf.id)
                batch.set(dayUpsellVariantRef, upsellVariantLeaf, { merge: true })

                const upsellItemLeaf = { ...upsellLeaf, id: item_id, upsell_id, name }
                const dayUpsellItemRef = dayUpsellRef.collection('DayUpsellItems').doc(item_id)
                batch.set(dayUpsellItemRef, upsellItemLeaf, { merge: true })
                const upsellVariantItemLeaf = { ...upsellVariantLeaf, id: item_id, upsell_id, name }
                const dayUpsellVariantItemRef = dayUpsellVariantRef.collection('DayUpsellVariantItems').doc(item_id)
                batch.set(dayUpsellVariantItemRef, upsellVariantItemLeaf, { merge: true })

                const upsellItemVariantLeaf = { ...upsellItemLeaf, id: item_variant_id, item_id }
                const upsellVariantItemVariantLeaf = { ...upsellVariantItemLeaf, id: item_variant_id, item_id }
                const dayUpsellItemVariantRef = dayUpsellItemRef.collection('DayUpsellItemVariants').doc(item_variant_id)
                batch.set(dayUpsellItemVariantRef, upsellItemVariantLeaf, { merge: true })
                const dayUpsellVariantItemVariantRef = dayUpsellItemVariantRef.collection('DayUpsellVariantItemVariants').doc(item_variant_id)
                batch.set(dayUpsellVariantItemVariantRef, upsellVariantItemVariantLeaf, { merge: true })
            })
        }

        /*
            // modifier_id, name, modifier_first_free, index
            const zeroModifier = {
                modifier_first_free: 0,
                mods: []
            }

            // item_id, option_id, variant_id, name, price, quantity
            const zeroMod = {
                price: 0,
                quantity: 0,
            }
        */

        if (before.captions.modifiers !== after.captions.modifiers) {
            const deltaModifiersQuantity = Object.keys(after.modifiers).length - Object.keys(before.modifiers).length
            if (deltaModifiersQuantity) {
                const modifiersRoot = {
                    modifiers: {
                        quantity: admin.firestore.FieldValue.increment(deltaModifiersQuantity),
                    }
                }
                batch.set(dayRef, modifiersRoot, { merge: true })
                batch.set(dayItemRef, modifiersRoot, { merge: true })
                batch.set(dayItemVariantRef, modifiersRoot, { merge: true })
            }

            Object.keys({ ...before.modifiers, ...after.modifiers }).forEach(modifier_id => {
                const dayModifierRef = dayRef.collection('DayModifiers').doc(modifier_id)
                const dayItemModifierRef = dayItemRef.collection('DayModifiers').doc(modifier_id)
                const dayItemVariantModifierRef = dayItemVariantRef.collection('DayModifiers').doc(modifier_id)

                const aModifier = after.modifiers[modifier_id] || zeroModifier
                const bModifier = before.modifiers[modifier_id] || zeroModifier

                const deltaModifierQuantity = !!after.modifiers[modifier_id] - !!before.modifiers[modifier_id]
                let isModifierAltered = !!deltaModifierQuantity

                const aMods = optionsArrayToObject(optionsArrayWithFree(aModifier.mods, aModifier.modifier_first_free))
                const bMods = optionsArrayToObject(optionsArrayWithFree(bModifier.mods, bModifier.modifier_first_free))
                const composite = { ...bMods, ...aMods }
                Object.keys(composite).forEach(mod_id => {
                    const aMod = aMods[mod_id] || zeroMod
                    const bMod = bMods[mod_id] || zeroMod

                    const deltaQuantity = sanitize(aMod.quantity - bMod.quantity)
                    const deltaUnique = sanitize(!!aMods[mod_id] - !!bMods[mod_id])
                    const deltaFree = sanitize(aMod.free - bMod.free)
                    const deltaPrice = sanitize(aMod.price * (aMod.quantity - aMod.free) - bMod.price * (bMod.quantity - bMod.free))

                    if (!deltaQuantity && !deltaUnique && !deltaFree && !deltaPrice) return

                    isModifierAltered = true

                    const modsRoot = {
                        mods: {
                            quantity: admin.firestore.FieldValue.increment(deltaQuantity),
                            unique: admin.firestore.FieldValue.increment(deltaUnique),
                            free: admin.firestore.FieldValue.increment(deltaFree),
                            price: admin.firestore.FieldValue.increment(deltaPrice),
                        }
                    }

                    batch.set(dayRef, { modifiers: modsRoot }, { merge: true })
                    batch.set(dayItemRef, { modifiers: modsRoot }, { merge: true })
                    batch.set(dayItemVariantRef, { modifiers: modsRoot }, { merge: true })

                    batch.set(dayModifierRef, modsRoot, { merge: true })
                    batch.set(dayItemModifierRef, modsRoot, { merge: true })
                    batch.set(dayItemVariantModifierRef, modsRoot, { merge: true })

                    const modName = aMod.name || b.name
                    const modLeaf = {
                        mod: {
                            [mod_id]: {
                                name: modName,
                                quantity: admin.firestore.FieldValue.increment(deltaQuantity),
                                unique: admin.firestore.FieldValue.increment(deltaUnique),
                                free: admin.firestore.FieldValue.increment(deltaFree),
                                price: admin.firestore.FieldValue.increment(deltaPrice),
                            }
                        }
                    }

                    batch.set(dayModifierRef, modLeaf, { merge: true })
                    batch.set(dayItemModifierRef, modLeaf, { merge: true })
                    batch.set(dayItemVariantModifierRef, modLeaf, { merge: true })
                })

                if (isModifierAltered) {
                    const modifierLeaf = {
                        id: modifier_id,
                        restaurant_id,
                        day_id,
                        name: aModifier.name,
                        quantity: admin.firestore.FieldValue.increment(deltaModifierQuantity),
                        timestamps: {
                            created
                        }
                    }

                    batch.set(dayModifierRef, modifierLeaf, { merge: true })
                    batch.set(dayItemModifierRef, modifierLeaf, { merge: true })
                    batch.set(dayItemVariantModifierRef, modifierLeaf, { merge: true })
                }
            })
        }

        return batch.commit()
    })