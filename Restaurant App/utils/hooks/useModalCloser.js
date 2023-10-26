import { useNavigationState } from '@react-navigation/native';
import { useEffect } from 'react';
import { useSelector, } from 'react-redux';

export default function useModalCloser(screen, closeModals) {
  const currentScreen = useNavigationState(state => state.routes[state.index]?.name)

  useEffect(() => {
    if (currentScreen !== screen) closeModals()
  }, [currentScreen])
}