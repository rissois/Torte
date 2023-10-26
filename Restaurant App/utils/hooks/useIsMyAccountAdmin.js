import { useSelector } from 'react-redux';

export default function useIsMyAccountAdmin() {
  return useSelector(state => !!state.app.is_admin)
}