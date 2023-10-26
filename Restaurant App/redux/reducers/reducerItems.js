const initialItems = {}


export default function items(state = initialItems, action) {
    switch (action.type) {
        case 'items/SET_ITEMS':
            return { ...state, ...action.obj }
        case 'items/DELETE_ITEMS':
            const items = { ...state }
            Object.keys(action.obj).forEach(id => delete items[id])
            return items
        case 'app/RESET':
            return initialItems
        default:
            return state;
    }
}

