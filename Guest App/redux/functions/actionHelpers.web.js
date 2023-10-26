import { onSnapshot, query, where } from "@firebase/firestore"


export const handleQuery = (collectionRef, whereParams = [], bulkAdd, bulkRemove, errorCallback, indAdd, indRemove,) => {
  return onSnapshot(query(collectionRef, ...whereParams.map(param => where(...param))), querySnapshot => {
    let add = {}
    let rem = {}
    querySnapshot.docChanges().forEach(change => {
      if (change.type === 'added' || change.type === 'modified') {
        add[change.doc.id] = change.doc.data()
        if (indAdd) indAdd(change.doc.data())
      }
      else if (change.type === 'removed') {
        rem[change.doc.id] = change.doc.data()
        if (indRemove) indRemove(change.doc.data())
      }
    })
    bulkAdd(add)  // can make conditional
    bulkRemove(rem)  // can make conditional
  }, errorCallback)
}

export const handleSnapshot = (snapshotRef, setFn, updateFn, errorCallback, emptyFn) => {
  return onSnapshot(snapshotRef, (() => {
    let first = true

    return docSnapshot => {
      if (!docSnapshot.exists()) {
        if (emptyFn) emptyFn()
        return
      }
      if (first) {
        first = false
        return setFn(docSnapshot.data())
      }
      return updateFn(docSnapshot.data())
    }
  })(), errorCallback)
}