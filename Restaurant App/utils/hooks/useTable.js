import { useMemo } from 'react';

import { useSelector, } from 'react-redux';
import { selectTableName } from '../../redux/selectors/selectorsTables';


export function useTableName(table_id) {
    const select = useMemo(() => selectTableName, [])
    return useSelector(select(table_id))
}