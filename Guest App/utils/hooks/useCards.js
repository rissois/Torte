import { useSelector } from 'react-redux';
import { selectCardsForDisplay } from '../../redux/selectors/selectorsUserCards';

export default function useCards() {
  return useSelector(selectCardsForDisplay)
}