import firestore from '@react-native-firebase/firestore'
import auth from '@react-native-firebase/auth'

export default async function confirmEULA() {
  return firestore().collection('UsersPOS').doc(auth().currentUser.uid).set({
    torte: {
      eula: {
        dates: firestore.FieldValue.arrayUnion(Date.now()),
        is_needed: false
      }
    }
  }, { merge: true })
}