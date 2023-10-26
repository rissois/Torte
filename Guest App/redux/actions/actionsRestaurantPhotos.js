import * as FileSystem from 'expo-file-system';
import storage from '@react-native-firebase/storage'

export const doPhotoDownloadByMenu = (menu_id) => {
    return async function (dispatch, getState) {
        const restaurant_id = getState().trackers.restaurant_id
        const sections = getState().restaurants[restaurant_id].sections
        const items = getState().restaurants[restaurant_id].items

        getState().restaurants[restaurant_id].menus[menu_id]?.section_order.forEach(section_id => {
            sections[section_id]?.item_order.forEach(({ item_id, variant_id }) => {
                const { photo } = { ...items[item_id], ...items[item_id]?.variants[variant_id] }
                if (photo.id) {
                    dispatch(doPhotoDownload(restaurant_id, photo.id, photo.date_modified))
                }
            })
        })
    }
}

export const doPhotoDownload = (restaurant_id, photo_id, date_modified) => {
    return async function (dispatch, getState) {
        // exit if already downloading
        if (getState().restaurants[restaurant_id]?.photos?.[photo_id]?.isFetching) {
            return null
        }

        dispatch(doPhotoDownloadStart(restaurant_id, photo_id))

        try {
            const fileSystemPhotosDirectory = FileSystem.cacheDirectory + 'photos/'

            // This is not the right place for this
            const fileSystemPhotos = await FileSystem.getInfoAsync(fileSystemPhotosDirectory)
            if (!fileSystemPhotos.exists) {
                await FileSystem.makeDirectoryAsync(fileSystemPhotosDirectory)
            }

            const fileSystemPhotoPath = fileSystemPhotosDirectory + photo_id
            const fileSystemPhoto = await FileSystem.getInfoAsync(fileSystemPhotoPath)

            // exit if stored and up-to-date
            if (fileSystemPhoto.exists && date_modified?.toMillis() >= fileSystemPhoto.modificationTime * 1000) {
                /*
                    An alternative approach is to access teh storage date directly:
    
                    const { updated } = await storagePhotoRef.getMetadata() // Returned as a date STRING
                */

                dispatch(doPhotoDownloadSuccess(restaurant_id, photo_id, fileSystemPhoto.uri))
                return null
            }

            const storagePhotoPath = `restaurants/${restaurant_id}/${photo_id}`
            const storagePhotoRef = storage().ref(storagePhotoPath)
            const storagePhotoURL = await storagePhotoRef.getDownloadURL()
            const photo = await FileSystem.downloadAsync(storagePhotoURL, fileSystemPhotoPath)

            dispatch(doPhotoDownloadSuccess(restaurant_id, photo_id, photo.uri))
        }
        catch (error) {
            console.log('actionsRestaurantPhotos error; ', error)
            dispatch(doPhotoDownloadFailed(restaurant_id, photo_id))
        }
    }
}

export const doPhotoDownloadStart = (restaurant_id, photo_id) => {
    return { type: 'restaurant/START_PHOTO_DOWNLOAD', restaurant_id, photo_id }
}

export const doPhotoDownloadSuccess = (restaurant_id, photo_id, photo_uri) => {
    return { type: 'restaurant/SUCCESS_PHOTO_DOWNLOAD', restaurant_id, photo_id, photo_uri }
}

export const doPhotoDownloadFailed = (restaurant_id, photo_id) => {
    return { type: 'restaurant/FAILED_PHOTO_DOWNLOAD', restaurant_id, photo_id }
}