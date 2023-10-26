

const initialUserListeners = {
    user: null,
    coupons: null,
    cards: null,
    spend: null,
}

const initialBillListeners = {
    bill: null,
    billItems: null,
    billGroups: null,
    billUsers: null,
}


const initialRestaurantListeners = {
    restaurant: null,
    menus: null,
    sections: null,
    items: null,
    modifiers: null,
    options: null,
    panels: null,
    soldOut: null,
}

const initialListeners = {
    user: initialUserListeners,
    bill: initialBillListeners,
    restaurant: initialRestaurantListeners,
}

export default function listeners(state = initialListeners, action) {
    switch (action.type) {
        case 'listeners/SET_LISTENER':
            return {
                ...state,
                [action.parent]: {
                    ...state[action.parent],
                    [action.category]: action.listener
                }
            }
        case 'listeners/REMOVE_LISTENER':
            return {
                ...state,
                [action.parent]: action.nulledFields
            }
        case 'app/RESET':
            return initialListeners
        default:
            return state;
    }
}