const initialSections = {}

// MAKE SURE TO ADD DATE FOR BILLS!! maybe bill items too...

export default function sections(state = initialSections, action) {
    switch (action.type) {
        case 'sections/SET_SECTIONS':
            return { ...state, ...action.obj }
        case 'sections/DELETE_SECTIONS':
            const sections = { ...state }
            Object.keys(action.obj).forEach(id => delete sections[id])
            return sections
        case 'app/RESET':
            return initialSections
        default:
            return state;
    }
}

