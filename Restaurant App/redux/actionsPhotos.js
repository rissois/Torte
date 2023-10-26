
export const UPLOAD_START = 'UPLOAD_START'
export const UPLOAD_TASK = 'UPLOAD_TASK'
export const UPLOAD_PROGRESS = 'UPLOAD_PROGRESS'
export const UPLOAD_SUCCESS = 'UPLOAD_SUCCESS'
export const UPLOAD_CANCEL = 'UPLOAD_CANCEL'
export const UPLOAD_FAILURE = 'UPLOAD_FAILURE'
export const FETCH_START = 'FETCH_START'
export const FETCH_DOWNLOAD = 'FETCH_DOWNLOAD'
export const FETCH_SUCCESS = 'FETCH_SUCCESS'
export const FETCH_FAILURE = 'FETCH_FAILURE'
export const DELETE_START = 'DELETE_START'
export const DELETE_SUCCESS = 'DELETE_SUCCESS'
export const DELETE_FAILURE = 'DELETE_FAILURE'
export const NO_PHOTO = 'NO_PHOTO'

import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import firebase from '../config/Firebase';
import {
    Alert,
    Image,
} from 'react-native';
import commaList from '../functions/commaList'

// ERROR MESSAGES: https://firebase.google.com/docs/storage/web/handle-errors

/*
    
    photos: {
        [item_id] || logo: {
            name,
            upload: {
                blobbing ||
                upload_task && upload_progress ||
                upload_cancel ||
                upload_fail : message
            }
            fetch: {
                dating
                downloading
                fetch_fail
            },
            del: {
                deleting,
                delete_fail
            }
            uri
        }
    }


    ERROR DANGER: ONE DOES NOT CLEAR THE ERROR OF ANOTHER
*/

const squareSize = 600

export function uploadPhoto(item_id, name, photo) {
    let { uri, width, height } = photo
    // NEED: local uri,  file_name, name
    // console.log('Upload photo for item ', name)

    return async function (dispatch, getState) {
        const { restaurant_id } = getState().restaurant
        dispatch(uploadStart(item_id, name, uri))

        try {
            let resized_width = width > height ? squareSize : width / (height / 600)
            let resized_height = height > width ? squareSize : height / (width / 600)

            let resized = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: resized_width, height: resized_height } }],
                {
                    compress: 0.5,
                    format: uri.substr(uri.lastIndexOf('.') + 1) === 'png' ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG
                }
            );

            let blob = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.onload = function () {
                    resolve(xhr.response);
                };
                xhr.onerror = function (e) {
                    console.log(e);
                    reject(new TypeError('Network request failed'));
                };
                xhr.responseType = 'blob';
                xhr.open('GET', resized.uri, true);
                xhr.send(null);
            });

            let storagePath = 'restaurants/' + restaurant_id + '/' + item_id
            let storageRef = firebase.storage().ref(storagePath)

            let upload_task = storageRef.put(blob)

            dispatch(uploadTask(item_id, upload_task))

            upload_task.on(firebase.storage.TaskEvent.STATE_CHANGED,
                function (next) {
                    dispatch(uploadProgress(item_id, (next.bytesTransferred / next.totalBytes) * 100))
                },
                function (error) {
                    console.log('Upload task photo error: ', error)
                    if (error.code === 'storage/canceled') {
                        dispatch(uploadCancel(item_id))
                    }
                    else {
                        dispatch(uploadFail(item_id, 'We were unable to save the photo at this time')) // Could use a customized message...
                    }
                },
                async function (complete) {
                    dispatch(fetchPhoto(item_id, name))
                    dispatch(uploadSuccess(item_id))

                    try {
                        let restaurantRef = firebase.firestore().collection('restaurants').doc(restaurant_id)
                        if (item_id === 'logo') {
                            await restaurantRef.update({
                                logo: {
                                    name: 'logo',
                                    date_modified: firebase.firestore.FieldValue.serverTimestamp(),
                                }
                            })
                            // save to restaurant doc
                        }
                        else {
                            await restaurantRef.collection('restaurantItems').doc(item_id).update({
                                photo: {
                                    name: item_id,
                                    date_modified: firebase.firestore.FieldValue.serverTimestamp(),
                                }
                            })
                        }
                        // dispatch(movePhoto(item_id)) // it is probably better practice 
                    }
                    catch (error) {
                        console.log('Upload firestore photo error: ', error)
                        dispatch(uploadFail(item_id, 'The photo was saved, but the link is broken. Please contact Torte support.'))
                    }
                })
        }
        catch (error) {
            console.log('Upload photo error: ', error)
            dispatch(uploadFail(item_id, 'We were unable to save the photo at this time'))
            // only will be blob errors I think....
        }

    }
    /*
        Convert to blob
        Start upload
        uploadTask next 
            monitor progress
        uploadTask success
            create new photos entry pointing to local image 
                will be replaced with local director
            firestore
        uploadTask catch 
            mark failure
    */
}

function uploadStart(item_id, name, local_uri) {
    console.log('upload start: ', item_id)
    return ({ type: UPLOAD_START, item_id, name, local_uri })
}

function uploadTask(item_id, upload_task) {
    // console.log('upload task: ', item_id)
    return ({ type: UPLOAD_TASK, item_id, upload_task })
}

function uploadProgress(item_id, progress) {
    // console.log('upload progress: ', progress, ' for ', item_id)
    return ({ type: UPLOAD_PROGRESS, item_id, progress })
}

function uploadCancel(item_id) {
    // console.log('upload cancel: ', item_id)
    return ({ type: UPLOAD_CANCEL, item_id })
}

function uploadSuccess(item_id) {
    console.log('Upload success: ', item_id)
    return ({ type: UPLOAD_SUCCESS, item_id })
}

function uploadFail(item_id, message) {
    console.log('upload fail: ', message, ' for ', item_id)
    return ({ type: UPLOAD_FAILURE, item_id, message })
}

function movePhoto(item_id) {
    // console.log('Move photo: ', item_id)

    return async function (dispatch, getState) {
        let { uri } = getState().photos[item_id]

        let photos = await FileSystem.getInfoAsync(FileSystem.cacheDirectory + 'photos')
        if (!photos.exists) {
            // console.log('FileSystem photo album does not exist')
            await FileSystem.makeDirectoryAsync(FileSystem.cacheDirectory + 'photos')
        }

        // Get FileSystem photo info
        let cachedPath = FileSystem.cacheDirectory + 'photos/' + item_id
        await FileSystem.copyAsync({ from: uri, to: cachedPath })

        dispatch(fetchSuccess(item_id, cachedPath))
    }
}

export function deletePhoto(item_id) {
    // console.log('Delete photo: ', item_id)

    return async function (dispatch, getState) {
        try {
            const { restaurant_id } = getState().restaurant
            dispatch(deleteStart(item_id))
            let storagePath = 'restaurants/' + restaurant_id + '/' + item_id
            let storageRef = firebase.storage().ref(storagePath)
            await storageRef.delete()

            // Get FileSystem photo info
            let cachedPath = FileSystem.cacheDirectory + 'photos/' + item_id
            await FileSystem.deleteAsync(cachedPath)

            let { photoAds } = getState()

            const photoAdsWithItem = Object.keys(photoAds).reduce((acc, ad_id) => {
                if (photoAds[ad_id].topOrder?.includes(item_id) || photoAds[ad_id].bottomOrder?.includes(item_id) || photoAds[ad_id].largeOrder?.includes(item_id)) {
                    return acc.concat(photoAds[ad_id].name)
                }
                return acc
            }, [])

            if (photoAdsWithItem.length) {
                Alert.alert(`Photo missing from ${photoAdsWithItem.length === 1 ? 'photo ad' : 'photo ads'}`,
                    `Please correct the following: ${commaList(photoAdsWithItem)}`
                )
            }

            dispatch(deleteSuccess(item_id))

            let restaurantRef = firebase.firestore().collection('restaurants').doc(restaurant_id)
            if (item_id === 'logo') {
                await restaurantRef.update({
                    logo: {
                        name: '',
                        date_modified: null,
                    }
                })
                // save to restaurant doc
            }
            else {
                // NOTE: will throw error if item was deleted
                await restaurantRef.collection('restaurantItems').doc(item_id).update({
                    photo: {
                        name: '',
                        date_modified: null,
                    }
                })
            }
        }
        catch (error) {
            if (error.code !== 'storage/object-not-found') {
                console.log('Delete photo error: ', error)
                dispatch(deleteFail(item_id))
            }
        }
    }
}

function deleteStart(item_id) {
    console.log('delete start: ', item_id)
    return ({ type: DELETE_START, item_id })
}

function deleteSuccess(item_id) {
    console.log('delete success: ', item_id)
    return ({ type: DELETE_SUCCESS, item_id })
}

function deleteFail(item_id, message) {
    console.log('delete fail: ', message, ' for ', item_id)
    return ({ type: DELETE_FAILURE, item_id, message })
}



export function fetchPhoto(item_id, name,) {
    // console.log('Fetch photo: ', item_id)

    return async function (dispatch, getState) {
        const { restaurant_id } = getState().restaurant
        if (getState().photos[item_id]?.fetching === true) {
            return null
        }

        try {
            dispatch(fetchStart(item_id, name))

            // Prime FileSystem photo album
            let photos = await FileSystem.getInfoAsync(FileSystem.cacheDirectory + 'photos')
            if (!photos.exists) {
                // console.log('FileSystem photo album does not exist')
                await FileSystem.makeDirectoryAsync(FileSystem.cacheDirectory + 'photos')
            }

            // Get Storage photo Ref
            let storagePath = 'restaurants/' + restaurant_id + '/' + item_id
            let storageRef = firebase.storage().ref(storagePath)

            // Get FileSystem photo info
            let cachedPath = FileSystem.cacheDirectory + 'photos/' + item_id
            let cachedInfo = await FileSystem.getInfoAsync(cachedPath)

            // If FileSystem has a photo for this item
            if (cachedInfo.exists) {
                // Compare dates
                let cachedDate = new Date(cachedInfo.modificationTime * 1000) // seconds since epoch
                let { updated } = await storageRef.getMetadata() // Date string
                let storageDate = new Date(updated)

                // If FileSystem photo is up-to-date, do not download
                if (cachedDate >= storageDate) {
                    // console.log('Photo was up to date: ', item_id)
                    dispatch(fetchSuccess(item_id, cachedInfo.uri))
                    return null
                }
            }

            dispatch(fetchDownload(item_id))

            let storageURL = await storageRef.getDownloadURL()
            let photo = await FileSystem.downloadAsync(storageURL, cachedPath)
            // NOTE: FileSystem holds a createDownloadResumable analogous to uploadTask above
            // And can track download progress
            dispatch(fetchSuccess(item_id, photo.uri))

        }
        catch (error) {
            if (error.code === 'storage/object-not-found') {
                dispatch(noPhoto(item_id))
            }
            else {
                console.log('Fetch photo error: ', error)
                dispatch(fetchFail(item_id))
            }
        }
    }
    /*
    Item listener DOC CHANGES
        If item has photo, fetchPhoto with item_id, photo file name, and item name
        NOTE: If doc is deleted, should clear photo
    fetchPhoto
        Prepare local directory
        Ignore if already fetching
        Get download URL of storage ref

        If local directory has image
            Check image last saved vs storage last updated
            If up to date, return

        and then just download, pretty much no change
*/
}

function fetchStart(item_id, name) {
    // console.log('fetch start: ', item_id)
    return ({ type: FETCH_START, item_id, name })
}

function fetchDownload(item_id) {
    // console.log('fetch download: ', item_id)
    return ({ type: FETCH_DOWNLOAD, item_id })
}

function fetchSuccess(item_id, uri) {
    // console.log('fetch success: ', item_id)
    return ({ type: FETCH_SUCCESS, item_id, uri })
}

function fetchFail(item_id, message) {
    console.log('fetch fail: ', message, ' for ', item_id)
    return ({ type: FETCH_FAILURE, item_id, message })
}

function noPhoto(item_id) {
    // console.log('no photo ', item_id)
    return ({ type: NO_PHOTO, item_id, })
}

export function prunePhotos() {
    /*
        Delete photos that have not been accessed in a while (see T connect)
    */
}