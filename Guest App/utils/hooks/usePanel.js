import { useMemo } from 'react';
import { useSelector, } from 'react-redux';
import { selectPanel } from '../../redux/selectors/selectorsPanels';

export function usePanel(panel_id) {
    const select = useMemo(() => selectPanel, [])
    return useSelector(select(panel_id))
}



