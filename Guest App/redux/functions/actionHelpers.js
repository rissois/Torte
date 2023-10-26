
export const handleQuery = (collectionRef, where = [], bulkAdd, bulkRemove, errorCallback, indAdd, indRemove,) => {
  for (let i = 0; i < where.length; i++) {
    collectionRef = collectionRef.where(...where[i])
  }

  return collectionRef.onSnapshot(querySnapshot => {
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
  return snapshotRef.onSnapshot((() => {
    let first = true

    return docSnapshot => {
      if (docSnapshot.empty) {
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