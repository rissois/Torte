import firestore from '@react-native-firebase/firestore'

export default async function writeCreateUser(user_id, name, email) {
  return firestore().collection('UsersPOS/').doc(user_id).set({
    name,
    email,
    id: user_id,
  }, { merge: true })
}