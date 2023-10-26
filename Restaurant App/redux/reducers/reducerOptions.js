const initialOptions = {}

// MAKE SURE TO ADD DATE FOR BILLS!! maybe bill items too...

export default function options(state = initialOptions, action) {
    switch (action.type) {
        case 'options/SET_OPTIONS':
            return { ...state, ...action.obj }
        case 'options/DELETE_OPTIONS':
            const options = { ...state }
            Object.keys(action.obj).forEach(id => delete options[id])
            return options
        case 'app/RESET':
            return initialOptions
        default:
            return state;
    }
}