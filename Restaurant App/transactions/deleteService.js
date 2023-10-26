import firebase from '../config/Firebase';

// Use text to ensure a match
export default async function deleteService(restaurant_id, dayObject, dayIndex, serviceIndex, text) {
  if (dayObject.text !== text && dayObject.text[serviceIndex] !== text) {
    throw 'Misaligned text'
  }

  if (dayObject.services.length <= 1) {
    await firebase.firestore().collection('restaurants').doc(restaurant_id).set({
      days: {
        [dayIndex]: {
          text: 'Closed',
          services: [],
        }
      }
    }, { merge: true })
  }
  else {
    let copy_text = [...dayObject.text]
    let copy_services = [...dayObject.services]
    copy_text.splice(serviceIndex, 1)
    copy_services.splice(serviceIndex, 1)
    await firebase.firestore().collection('restaurants').doc(restaurant_id).set({
      days: {
        [dayIndex]: {
          text: copy_text,
          services: copy_services,
        }
      }
    }, { merge: true })
  }
}