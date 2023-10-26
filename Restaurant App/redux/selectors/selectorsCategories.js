import { createSelector } from 'reselect'

const emptyObject = {}
const emptyArray = []

export const selectCategory = category => state => category === 'periods' ? state.restaurant.days : category === 'meals' ? state.restaurant.meals : state[category] ?? emptyObject

export const selectCategoryLiveAlphabetical = (category) => createSelector(
    selectCategory(category),
    children => {
        if (category === 'tables') {
            return Object.keys(children).filter(id => !children[id].is_deleted).sort((a, b) => children[a].position - children[b].position)
        }
        if (category === 'periods') {
            return Object.keys(children).flatMap(dotw_id => children[dotw_id].hours.map(period => period.id))
        }
        else if (category === 'meals') {
            return Object.keys(children).sort((a, b) => children[a].name.localeCompare(children[b].name))
        }
        return Object.keys(children).filter(id => !children[id].is_deleted).sort((a, b) => children[a].name.localeCompare(children[b].name))
    }
)

const getPeriodById = (days, period_id) => {
    for (let dotw_id = 0; dotw_id <= 6; dotw_id++) {
        const hourIndex = days[dotw_id]?.hours?.findIndex(period => period.id === period_id)
        if (~hourIndex) return { ...days[dotw_id].hours[hourIndex], dotw_id, }
    }
    return emptyObject
}

export const selectCategoryParents = (category, parent, id, variant_id) => createSelector(
    selectCategory(parent),
    parents => {
        if (!id) return emptyArray
        if (parent === 'menus') return Object.keys(parents).filter(menu => menu.section_order.includes(id))
        if (parent === 'sections') {
            if (category === 'items') return Object.keys(parents).filter(section => section.item_order.some(item => item.item_id === id && (!variant_id || item.variant_id === variant_id)))
            if (category === 'panels') return Object.keys(parents).filter(section => section.panel_id === id)
        }
        if (parent === 'items') {
            if (category === 'modifiers') return Object.keys(parents).filter(item => item.modifier_ids.includes(id))
            if (category === 'items') return Object.keys(parents).filter(item => item.upsells.some(upsell => upsell.item_id === id && (!variant_id || upsell.variant_id === variant_id)))
            if (category === 'options') return Object.keys(parents).filter(item => item.upsells.some(upsell => upsell.option_id === id && (!variant_id || upsell.variant_id === variant_id)))
        }
        if (parent === 'modifiers') {
            if (category === 'items') return Object.keys(parents).filter(modifier => modifier.mods.some(mod => mod.item_id === id && (!variant_id || mod.variant_id === variant_id)))
            if (category === 'options') return Object.keys(parents).filter(modifier => modifier.mods.some(mod => mod.option_id === id && (!variant_id || mod.variant_id === variant_id)))
        }
        return emptyArray
    }
)

export const selectCategoryChild = (category, id, variant_id) => createSelector(
    selectCategory(category),
    children => {
        if (category === 'periods') {
            return getPeriodById(children, id)
        }
        if (variant_id) {
            return { ...children[id], ...children[id].variants?.[variant_id] } ?? emptyObject
        }
        return children[id] ?? emptyObject
    }
)

