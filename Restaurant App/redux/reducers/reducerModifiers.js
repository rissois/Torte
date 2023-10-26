const initialModifiers = {}

// MAKE SURE TO ADD DATE FOR BILLS!! maybe bill items too...

export default function modifiers(state = initialModifiers, action) {
    switch (action.type) {
        case 'modifiers/SET_MODIFIERS':
            return { ...state, ...action.obj }
        case 'modifiers/DELETE_MODIFIERS':
            const modifiers = { ...state }
            Object.keys(action.obj).forEach(id => delete modifiers[id])
            return modifiers
        case 'app/RESET':
            return initialModifiers
        default:
            return state;
    }
}

