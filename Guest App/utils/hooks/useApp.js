import { useSelector, } from 'react-redux';
import { selectIsStripeTestMode } from '../../redux/selectors/selectorsApp';

export function useIsStripeTestMode() {
  return useSelector(selectIsStripeTestMode)
}