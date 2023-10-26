import { useNavigationState } from '@react-navigation/native';
import { useEffect } from 'react';

/* 
  useModalClosero is essential for any screen with a modal
  It should close all modals in case of a scanned link

  useModalCloser should be at the TOP of each Component
  You can safely place useModalCloser ABOVE the respective useState
*/
export default function useModalCloser(screen, closeModals) {
  const currentScreen = useNavigationState(state => state.routes[state.index]?.name)

  useEffect(() => {
    if (currentScreen !== screen) closeModals()
  }, [currentScreen])
}