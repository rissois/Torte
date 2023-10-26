const initialPanels = {}

// MAKE SURE TO ADD DATE FOR BILLS!! maybe bill items too...

export default function panels(state = initialPanels, action) {
    switch (action.type) {
        case 'panels/SET_PANELS':
            return { ...state, ...action.obj }
        case 'panels/DELETE_PANELS':
            const panels = { ...state }
            Object.keys(action.obj).forEach(id => delete panels[id])
            return panels
        case 'app/RESET':
            return initialPanels
        default:
            return state;
    }
}

