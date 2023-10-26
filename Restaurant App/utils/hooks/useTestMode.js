import { useSelector, } from 'react-redux';

export default function useTestMode() {
  return useSelector(state => state.app.test_mode)
}
