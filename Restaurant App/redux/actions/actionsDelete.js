import firebase from "firebase"
import capitalize from "../../utils/functions/capitalize"
import { doAlertAdd } from "./actionsAlerts"
import arrayToCommaList from "../../utils/functions/arrayToCommaList"


const parents = {
    meals: ['periods'],
    menus: ['meals'],
    sections: ['menus'],
    panels: ['sections'],
    modifiers: ['items'],
    items: ['sections', 'items', 'modifiers'],
    options: ['items', 'modifiers']
}

// Can just pass name as argument
export const doDeleteChild = (category, id, variant_id) => {
    return async function (dispatch, getState) {
        const { id: restaurant_id, } = getState().restaurant

        const doc = category === 'meals' ? getState().restaurant.meals[id] : getState()[category][id]
        const variant_ids = variant_id ? [variant_id] : !doc.variants ? null : Object.keys(doc.variants)
        const fullName = variant_id ? `${doc.variants[variant_id].internal_name}` :
            doc.name + (doc.internal_name ? ` (${doc.internal_name})` : '') + (variant_ids ? ' and all variants' : '')

        dispatch(deleteChildStart(fullName))

        dispatch(doAlertAdd(
            `Delete ${fullName}?`,
            `This will remove ${fullName} from all ${arrayToCommaList(parents[category])}`,
            [
                {
                    text: `Yes, delete ${fullName}`,
                    onPress: async () => {
                        firebase.firestore().runTransaction(async transaction => {
                            const restaurantRef = firebase.firestore().collection('Restaurants').doc(restaurant_id)

                            if (category === 'meals') {
                                await deleteMealsFromPeriods(transaction, restaurantRef, id)
                                return 'unrelated to rest'
                            }

                            const childRef = restaurantRef.collection(capitalize(category)).doc(id)

                            if (variant_ids) {
                                const child = (await transaction.get(childRef)).data()
                                variant_ids.forEach(v_id => {
                                    transaction.set(childRef.collection('DeletedVariants').doc(v_id), {
                                        ...child.variants?.[v_id],
                                        ['root_' + category]: child,
                                    })

                                    transaction.set(childRef, {
                                        variants: {
                                            [v_id]: firebase.firestore.FieldValue.delete()
                                        }
                                    }, { merge: true })
                                })
                            }

                            if (category === 'menus') await deleteMenuFromMeals(transaction, restaurantRef, id)
                            if (category === 'sections') deleteSectionFromMenus(transaction, restaurantRef, getState().menus, id)
                            if (category === 'panels') deletePanelFromSections(transaction, restaurantRef, getState().sections, id)
                            if (category === 'modifiers') deleteModiferFromItems(transaction, restaurantRef, getState().items, id)
                            if (category === 'items') {
                                let removeArray = variant_ids.map(v_id => ({ item_id: id, variant_id: v_id }))
                                if (!variant_id) removeArray.push({ item_id: id, variant_id: '' })
                                let removeArrayWithOptions = removeArray.map(obj => ({ ...obj, option_id: '' }))
                                deleteItemFromSections(transaction, restaurantRef, getState().sections, removeArray)
                                deleteItemFromItems(transaction, restaurantRef, getState().items, removeArrayWithOptions)
                                deleteItemFromModifiers(transaction, restaurantRef, getState().modifiers, removeArrayWithOptions)
                                if (doc.photo?.id) {
                                    const storagePath = 'restaurants/' + restaurant_id + '/' + doc.photo?.id
                                    try {
                                        await firebase.storage().ref(storagePath).delete()
                                    }
                                    catch (error) {
                                        console.log('actionsDelete deletePhoto error: ', error)
                                        dispatch(doAlertAdd(`Error removing photo for ${name} from system `))
                                    }
                                    transaction.set(childRef, { photo: { id: '', modified: null, name: '' } }, { merge: true })
                                }
                            }
                            if (category === 'options') {
                                let removeArrayWithItems = variant_ids.map(v_id => ({ item_id: '', variant_id: v_id, option_id: id }))
                                if (!variant_id) removeArrayWithItems.push({ item_id: '', variant_id: '', option_id: id })
                                deleteOptionFromItems(transaction, restaurantRef, getState().items, removeArrayWithItems)
                                deleteOptionFromModifiers(transaction, restaurantRef, getState().modifiers, removeArrayWithItems)
                            }

                            else if (!variant_id) {
                                transaction.update(childRef, { is_deleted: true })
                            }
                        })
                            .then(async () => {
                                dispatch(deleteChildEnd(fullName))
                            })
                            .catch(error => {
                                console.log('actionsDelete error: ', error)
                                dispatch(deleteChildEnd(fullName))
                                dispatch(doAlertAdd(`Failed to delete ${category} ${fullName}`, 'Please try again and let us know if the issue persists'))
                            })
                    }
                },
                {
                    text: 'No, cancel',
                    onPress: () => dispatch(deleteChildEnd(fullName))
                }
            ]
        ))
    }
}

async function deleteMealsFromPeriods(transaction, restaurantRef, id) {
    const { days, meals, } = (await transaction.get(restaurantRef)).data()
    for (var dotw_id = 0; dotw_id < 7; dotw_id++) {
        const hours = days[dotw_id].hours
        if (hours.some(period => period.meal_order.includes(id))) {
            transaction.set(restaurantRef, {
                days: {
                    [dotw_id]: {
                        hours: hours.map(period => ({ ...period, meal_order: period.meal_order.filter(meal_id => meal_id !== id) }))
                    }
                }
            }, { merge: true })
        }
    }

    transaction.set(restaurantRef, {
        meals: { [id]: firebase.firestore.FieldValue.delete() }
    }, { merge: true })

    // transaction.set(restaurantRef.collection('DeletedMeals').doc(id), meals[id], { merge: true })
}

async function deleteMenuFromMeals(transaction, restaurantRef, id) {
    const { meals } = (await transaction.get(restaurantRef)).data()
    for (var i = 0, keys = Object.keys(meals); i < keys.length; i++) {
        const meal_id = keys[i]
        const menu = meals[meal_id].menus.find(mealMenu => mealMenu.menu_id === id)
        if (menu) {
            transaction.set(restaurantRef, {
                meals: { [meal_id]: { menus: firebase.firestore.FieldValue.arrayRemove(menu) } }
            }, { merge: true })
        }
    }
    return null
}

function deleteSectionFromMenus(transaction, restaurantRef, menus, id) {
    for (var i = 0, keys = Object.keys(menus); i < keys.length; i++) {
        const menu_id = keys[i]
        if (menus[menu_id].section_order.includes(id)) {
            transaction.set(restaurantRef.collection('Menus').doc(menu_id), {
                section_order: firebase.firestore.FieldValue.arrayRemove(id)
            }, { merge: true })
        }
    }
}

function deletePanelFromSections(transaction, restaurantRef, sections, id) {
    for (var i = 0, keys = Object.keys(sections); i < keys.length; i++) {
        const section_id = keys[i]
        if (sections[section_id].panel_id === id) {
            transaction.set(restaurantRef.collection('Sections').doc(section_id), {
                panel_id: ''
            }, { merge: true })
        }
    }
}

function deleteModiferFromItems(transaction, restaurantRef, items, id) {
    for (var i = 0, keys = Object.keys(items); i < keys.length; i++) {
        const item_id = keys[i]
        if (items[item_id].modifier_ids.includes(id)) {
            transaction.set(restaurantRef.collection('Items').doc(item_id), {
                modifier_ids: firebase.firestore.FieldValue.arrayRemove(id)
            }, { merge: true })
        }
    }
}

function deleteItemFromSections(transaction, restaurantRef, sections, removeArray) {
    for (var i = 0, keys = Object.keys(sections); i < keys.length; i++) {
        const section_id = keys[i]
        if (!sections[section_id].is_deleted
            && sections[section_id].item_order.some(sectionItem => removeArray.some(removeItem => sectionItem.item_id === removeItem.item_id && sectionItem.variant_id === removeItem.variant_id))) {
            transaction.set(restaurantRef.collection('Sections').doc(section_id), {
                item_order: firebase.firestore.FieldValue.arrayRemove(...removeArray)
            }, { merge: true })
        }
    }
}

function deleteItemFromItems(transaction, restaurantRef, items, removeArray) {
    for (var i = 0, keys = Object.keys(items); i < keys.length; i++) {
        const item_id = keys[i]
        if (!items[item_id].is_deleted
            && items[item_id].upsells.some(upsell => removeArray.some(removeItem => upsell.item_id === removeItem.item_id && upsell.variant_id === removeItem.variant_id))) {
            transaction.set(restaurantRef.collection('Items').doc(item_id), {
                upsells: firebase.firestore.FieldValue.arrayRemove(...removeArray)
            }, { merge: true })
        }
    }
}

function deleteItemFromModifiers(transaction, restaurantRef, modifiers, removeArray) {
    for (var i = 0, keys = Object.keys(modifiers); i < keys.length; i++) {
        const modifier_id = keys[i]
        if (!modifiers[modifier_id].is_deleted
            && modifiers[modifier_id].mods.some(mod => removeArray.some(removeItem => mod.item_id === removeItem.item_id && mod.variant_id === removeItem.variant_id))) {
            transaction.set(restaurantRef.collection('Modifiers').doc(modifier_id), {
                mods: firebase.firestore.FieldValue.arrayRemove(...removeArray)
            }, { merge: true })
        }
    }
}

function deleteOptionFromItems(transaction, restaurantRef, items, removeArray) {
    for (var i = 0, keys = Object.keys(items); i < keys.length; i++) {
        const item_id = keys[i]
        if (!items[item_id].is_deleted
            && items[item_id].upsells.some(upsell => removeArray.some(removeItem => upsell.option_id === removeItem.option_id && upsell.variant_id === removeItem.variant_id))) {
            transaction.set(restaurantRef.collection('Items').doc(item_id), {
                upsells: firebase.firestore.FieldValue.arrayRemove(...removeArray)
            }, { merge: true })
        }
    }
}

function deleteOptionFromModifiers(transaction, restaurantRef, modifiers, removeArray) {
    for (var i = 0, keys = Object.keys(modifiers); i < keys.length; i++) {
        const modifier_id = keys[i]
        if (!modifiers[modifier_id].is_deleted
            && modifiers[modifier_id].mods.some(mod => removeArray.some(removeItem => mod.option_id === removeItem.option_id && mod.variant_id === removeItem.variant_id))) {
            transaction.set(restaurantRef.collection('Modifiers').doc(modifier_id), {
                mods: firebase.firestore.FieldValue.arrayRemove(...removeArray)
            }, { merge: true })
        }
    }
}


const deleteChildStart = (name) => {
    return { type: `delete/START_DELETE_CHILD`, name }
}

const deleteChildEnd = (name) => {
    return { type: `delete/END_DELETE_CHILD`, name }
}

export const doDeleteChildReset = () => {
    return { type: 'delete/RESET_DELETE_CHILD' }
}