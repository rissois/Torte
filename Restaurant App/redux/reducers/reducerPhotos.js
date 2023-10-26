const initialPhotos = {}

// MAKE SURE TO ADD DATE FOR BILLS!! maybe bill items too...

export default function photos(state = initialPhotos, action) {
    switch (action.type) {
        case 'photos/START_PHOTO_DOWNLOAD':
            return {
                ...state,
                [action.photo_id]: {
                    ...state[action.photo_id],
                    isFetching: true,
                    isFailed: false,

                }
            }
        case 'photos/SUCCESS_PHOTO_DOWNLOAD':
            return {
                ...state,
                [action.photo_id]: {
                    ...state[action.photo_id],
                    uri: action.photo_uri,
                    isFetching: false,
                }
            }
        case 'photos/FAIL_PHOTO_DOWNLOAD':
            return {
                ...state,

                [action.photo_id]: {
                    ...state[action.photo_id],
                    isFailed: true,
                    isFetching: false,
                    uri: null,
                }
            }
        case 'app/RESET':
            return initialPhotos
        default:
            return state;
    }
}

