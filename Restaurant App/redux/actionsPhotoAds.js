export const SET_PHOTO_AD = 'SET_PHOTO_AD'
export const DELETE_PHOTO_AD = 'DELETE_PHOTO_AD'

export function setPhotoAd(photoAd_id, data) {
    // console.log('set photoAd: ', photoAd_id)
    return { type: SET_PHOTO_AD, photoAd_id, data }
}

export function deletePhotoAd(photoAd_id) {
    // console.log('delete photoAd: ', photoAd_id)
    return { type: DELETE_PHOTO_AD, photoAd_id }
}