import { useMyRef } from "../utils/hooks/useUser"
import { setDoc, serverTimestamp } from 'firebase/firestore'
import { useCallback, useState } from "react"
import { useSelector } from "react-redux"

export default function useManageWalkthrough(walkthrough) {
  const myRef = useMyRef()
  const isWalkthroughCleared = useSelector(state => !!state.user.user.walkthroughs?.[walkthrough])
  const [isCleared, setIsCleared] = useState(false)

  const writeWalkthrough = useCallback(() => {
    setIsCleared(true)
    setDoc(
      myRef,
      {
        walkthroughs: { [walkthrough]: serverTimestamp() }
      },
      { merge: true })
      .catch(error => {
        console.log(`writeWalkthrough ${walkthrough} error:`, error)
      })
  }, [])

  return [!(isWalkthroughCleared || isCleared), writeWalkthrough]
}