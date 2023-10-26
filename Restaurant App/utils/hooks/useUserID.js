import { useSelector, } from 'react-redux';
import { selectUserID } from '../../redux/selectors/selectorsUser';

export default function useUserID() {
  return useSelector(selectUserID)
}