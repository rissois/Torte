export const initialFilters = {
    vegan: {
        on: false,
        name: 'Vegan'
    },
    vegetarian: {
        on: false,
        name: 'Vegetarian'
    },
    pescatarian: {
        on: false,
        name: 'Pescatarian'
    },
    gluten_free: {
        on: false,
        name: 'Gluten-free'
    },
    peanut_free: {
        on: false,
        name: 'Peanut-free'
    },
    treenut_free: {
        on: false,
        name: 'Tree nut-free'
    },
    sesame_free: {
        on: false,
        name: 'Sesame-free'
    },
    dairy_free: {
        on: false,
        name: 'Dairy-free'
    },
    shellfish_free: {
        on: false,
        name: 'Shellfish-free'
    },
    egg_free: {
        on: false,
        name: 'Egg-free'
    },
}

export default function filters(state = initialFilters, action) {
    switch (action.type) {
        case 'filters/TOGGLE_FILTER':
            return {
                ...state,
                [action.key]: {
                    ...state[action.key],
                    on: !state[action.key].on
                }
            }
        case 'filters/RESET_FILTERS':
        case 'app/RESET':
            return initialFilters
        default:
            return state;
    }
}