const initialListeners = {
    restaurant: null,
    menus: null,
    sections: null,
    items: null,
    modifiers: null,
    options: null,
    panels: null,
    tables: null,
    employees: null,

    bills: null,
    billItems: null,
}

export default function listeners(state = initialListeners, action) {
    switch (action.type) {
        case 'listeners/SET_LISTENER':
            return {
                ...state,
                [action.category]: action.listener
            }
        case 'listeners/REMOVE_LISTENER':
            return {
                ...state,
                ...action.nulledFields,
            }
        case 'app/RESET':
            return initialListeners
        default:
            return state;
    }
}