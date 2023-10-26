const initialRestaurants = {}


export default function restaurants(state = initialRestaurants, action) {
    switch (action.type) {
        case 'restaurant/UPDATE_RESTAURANT_CHILDREN':
            return {
                ...state,
                [action.restaurant_id]: {
                    ...state[action.restaurant_id],
                    [action.category]: {
                        ...state[action.restaurant_id]?.[action.category],
                        ...action.obj,
                    }
                },
            }
        case 'restaurant/DELETE_RESTAURANT_CHILDREN':
            const category = state[action.restaurant_id][action.category]
            Object.keys(action.obj).forEach(id => delete category[id])
            return {
                ...state,
                [action.restaurant_id]: {
                    ...state[action.restaurant_id],
                    [action.category]: category
                }
            }
        case 'restaurant/START_PHOTO_DOWNLOAD':
            return {
                ...state,
                [action.restaurant_id]: {
                    ...state[action.restaurant_id],
                    photos: {
                        ...state[action.restaurant_id].photos,
                        [action.photo_id]: {
                            ...state[action.restaurant_id].photos?.[action.photo_id],
                            isFetching: true,
                            isFailed: false,
                        }
                    }
                }
            }
        case 'restaurant/SUCCESS_PHOTO_DOWNLOAD':
            return {
                ...state,
                [action.restaurant_id]: {
                    ...state[action.restaurant_id],
                    photos: {
                        ...state[action.restaurant_id].photos,
                        [action.photo_id]: {
                            ...state[action.restaurant_id].photos?.[action.photo_id],
                            uri: action.photo_uri,
                            isFetching: false,
                        }
                    }
                }
            }
        case 'restaurant/FAIL_PHOTO_DOWNLOAD':
            return {
                ...state,
                [action.restaurant_id]: {
                    ...state[action.restaurant_id],
                    photos: {
                        ...state[action.restaurant_id].photos,
                        [action.photo_id]: {
                            ...state[action.restaurant_id].photos?.[action.photo_id],
                            isFailed: true,
                            isFetching: false,
                            uri: null,
                        }
                    }
                }
            }
        case 'app/RESET':
        case 'restaurant/REMOVE_RESTAURANT':
            return initialRestaurants
        default:
            return state;
    }
}

