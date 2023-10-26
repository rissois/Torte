const initialPrivates = {
    Contact: {},
    Printers: {},
}

// Consider removing first capital letter on private documents for consistency

export default function privates(state = initialPrivates, action) {
    switch (action.type) {
        case 'privates/SET_PRIVATES':
            return { ...state, ...action.obj }
        case 'privates/DELETE_PRIVATES':
            const privates = { ...state }
            Object.keys(action.obj).forEach(id => delete privates[id])
            return privates
        case 'app/RESET':
            return initialPrivates
        default:
            return state;
    }
}

