const initialAlerts = [];

export default function alerts(state = initialAlerts, action) {
    // Not sure how to handle this atomically
    switch (action.type) {
        case 'alerts/ADD_ALERT':
            return [...state, action.alert]
        case 'alerts/REMOVE_ALERT':
            const [_, ...rest] = state
            return rest
        case 'alerts/RESET_ALERTS':
        case 'app/RESET':
            return initialAlerts
        default:
            return state
        // More aggressive version to auto-detect any action with an error field
        // default:
        //     {
        //         if (action.error) {
        //             return [...state, error]
        //         }
        //         return state
        //     }
    }
}