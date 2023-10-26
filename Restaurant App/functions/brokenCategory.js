import categories from '../constants/categories';
import { useSelector, useDispatch } from 'react-redux';




export default function brokenCategory(category, doc_id) {
  const { [categories[category].redux]: categoryData = {}, } = useSelector(state => state)
  let { [doc_id]: docData } = categoryData
  const state = useSelector(state => state)

  if (!docData) {
    return true
  }

  switch (category) {
    case 'meal':
      return false
    case 'menu':
      let sections = state.sections
      return !docData.live || !docData.sectionOrder.length || !!~docData.sectionOrder.findIndex(section_id => {
        return !sections[section_id]?.live
      })
    case 'section':
      let items = state.items
      return !docData.live || !docData.itemOrder.length || !!~docData.itemOrder.findIndex(item_id => {
        return !items[items_id]?.live
      })
    case 'item':
      return !docData.live
    case 'specification':
      return !docData.options?.length
    case 'photoAd':
      let photos = state.photos
      return !docData.live || !!~docData.topOrder.findIndex(item_id => {
        return !photos[item_id]?.uri
      }) ||
        !!~docData.bottomOrder.findIndex(item_id => {
          return !photos[item_id]?.uri
        }) ||
        !!~docData.largeOrder.findIndex(item_id => {
          return !photos[item_id]?.uri
        })
    default:
      return true
  }
}

