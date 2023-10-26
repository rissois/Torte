const initialTrackers = {
    meal_id: '',
    menu_id: '',
    section_id: '',
    item_id: '',
    variant_id: '',
    panel_id: '',
    bill_id: '',
}


export default function tracker(state = initialTrackers, action) {
    switch (action.type) {
        case 'trackers/SET_TRACKERS':
            return {
                ...state,
                ...action.trackers,
            }
        case 'trackers/CLEAR_SPECIFIC':
            return {
                ...state,
                [action.field]: '',
            }
        case 'trackers/CLEAR_ALL':
        case 'app/RESET':
            return initialTrackers
        default:
            return state;
    }
}

