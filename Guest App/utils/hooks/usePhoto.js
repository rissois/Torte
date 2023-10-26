import { useMemo } from 'react';
import { useSelector, } from 'react-redux';
import { selectPhoto, selectPhotoForItem, selectPhotoIDForItem } from '../../redux/selectors/selectorsPhotos';

export function usePhotoFromItem(item_id, variant_id) {
    const select = useMemo(() => selectPhotoForItem, [])
    return useSelector(select(item_id, variant_id))
}

export function usePhotoIDFromItem(item_id, variant_id) {
    const select = useMemo(() => selectPhotoIDForItem, [])
    return useSelector(select(item_id, variant_id))
}

export function usePhoto(photo_id) {
    const select = useMemo(() => selectPhoto, [])
    return useSelector(select(photo_id))
}


