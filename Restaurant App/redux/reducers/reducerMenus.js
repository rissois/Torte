const initialMenus = {}

// MAKE SURE TO ADD DATE FOR BILLS!! maybe bill items too...

export default function menus(state = initialMenus, action) {
    switch (action.type) {
        case 'menus/SET_MENUS':
            return { ...state, ...action.obj }
        case 'menus/DELETE_MENUS':
            const menus = { ...state }
            Object.keys(action.obj).forEach(id => delete menus[id])
            return menus
        case 'app/RESET':
            return initialMenus
        default:
            return state;
    }
}

