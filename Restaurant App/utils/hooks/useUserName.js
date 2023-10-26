import { useSelector, } from 'react-redux';

export default function useUserName() {
  return useSelector(state => state.user.user.name)
}