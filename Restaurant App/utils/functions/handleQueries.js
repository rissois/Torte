export const querySnapshotToObject = (querySnapshot) => {
  let obj = {}
  querySnapshot.forEach(doc => obj[doc.data().id] = doc.data())
  return obj
}

export const querySnapshotToArray = (querySnapshot) => {
  let arr = []
  querySnapshot.forEach(doc => arr.push(doc.data()))
  return arr
}

export const querySnapshotChanges = (querySnapshot, { addedFn, modifiedFn, removedFn }) => {
  querySnapshot.docChanges().forEach(change => {
    if (change.type === 'added' || (change.type === 'modified' && !modifiedFn)) {
      addedFn(change.doc.data())
    }
    else if (change.type === 'modified') {
      modifiedFn(change.doc.data())
    }
    else if (change.type === 'removed') {
      removedFn(change.doc.data())
    }
  })
}