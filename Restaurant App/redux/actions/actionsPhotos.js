import * as FileSystem from 'expo-file-system';
import firebase from 'firebase';

// TORTER PHOTO CONSIDERATIONS:
// Upload (only upload ON SAVE so it is atomic! overwrite with local URI during editing)
// Delete from FileSystem, Firestore, and Storage

/*
photo = {id, modified, name}
*/

export const doPhotosDownload = (photos, restaurant_id) => {
    if (!Array.isArray(photos)) photos = [photos]

    // make sure you get restaurant_id
    return async function (dispatch, getState) {
        try {
            const reduxPhotos = getState().photos
            // exit if already downloading

            const fileSystemPhotosDirectory = FileSystem.cacheDirectory + 'photos/'

            // This is not the right place for this
            const fileSystemPhotos = await FileSystem.getInfoAsync(fileSystemPhotosDirectory)
            if (!fileSystemPhotos.exists) {
                await FileSystem.makeDirectoryAsync(fileSystemPhotosDirectory)
            }

            photos.forEach(async ({ id: photo_id, modified: date_modified }) => {
                if (reduxPhotos[photo_id]?.isFetching) {
                    return null
                }

                dispatch(doPhotoDownloadStart(photo_id))

                try {


                    const fileSystemPhotoPath = fileSystemPhotosDirectory + photo_id
                    const fileSystemPhoto = await FileSystem.getInfoAsync(fileSystemPhotoPath)

                    // exit if stored and up-to-date
                    if (fileSystemPhoto.exists && date_modified?.toMillis() >= fileSystemPhoto.modificationTime * 1000) {
                        /*
                            An alternative approach is to access teh storage date directly:
            
                            const { updated } = await storagePhotoRef.getMetadata() // Returned as a date STRING
                        */

                        dispatch(doPhotoDownloadSuccess(photo_id, fileSystemPhoto.uri))
                        return null
                    }

                    const storagePhotoPath = `restaurants/${restaurant_id}/${photo_id}`
                    const storagePhotoRef = firebase.storage().ref(storagePhotoPath)
                    const storagePhotoURL = await storagePhotoRef.getDownloadURL()
                    const photo = await FileSystem.downloadAsync(storagePhotoURL, fileSystemPhotoPath)

                    dispatch(doPhotoDownloadSuccess(photo_id, photo.uri))
                }
                catch (error) {
                    console.log('actionsPhotos error photo: ', photo_id, error)
                    dispatch(doPhotoDownloadFailed(photo_id))
                }
            })
        }
        catch (error) {
            console.log('actionsPhotos general error: ', photo_id, error)
            // doAlertAdd?
        }
    }
}

export const doPhotoDownloadStart = (photo_id) => {
    return { type: 'photos/START_PHOTO_DOWNLOAD', photo_id }
}

export const doPhotoDownloadSuccess = (photo_id, photo_uri) => {
    return { type: 'photos/SUCCESS_PHOTO_DOWNLOAD', photo_id, photo_uri }
}

export const doPhotoDownloadFailed = (photo_id) => {
    return { type: 'photos/FAILED_PHOTO_DOWNLOAD', photo_id }
}