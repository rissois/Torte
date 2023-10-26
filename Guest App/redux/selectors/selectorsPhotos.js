import { createSelector } from 'reselect'
import { createShallowEqualSelector } from './selectorCreators'
import { selectBillGroups } from './selectorsBillGroups'
import { selectActiveFilterKeys } from './selectorsFilters'
import { selectItemVariant, selectTrackedItemPhotoID } from './selectorsItems'
import { selectTrackedRestaurantRoot } from './selectorsRestaurant2'
import { selectMyID } from './selectorsUser'

const emptyObject = {}
const emptyArray = []

export const selectPhotos = createSelector(
    selectTrackedRestaurantRoot,
    restaurantRoot => restaurantRoot.photos ?? emptyObject
)

export const selectPhoto = (photo_id) => createSelector(
    selectPhotos,
    photos => photos[photo_id] ?? emptyObject
)

export const selectPhotoIDForItem = (item_id, variant_id) => createSelector(
    selectItemVariant(item_id, variant_id),
    variant => variant?.photo?.id || ''
)

export const selectPhotoForItem = (item_id, variant_id) => createSelector(
    selectPhotos,
    selectPhotoIDForItem(item_id, variant_id),
    (photos, photo_id) => photos[photo_id] || ''
)
