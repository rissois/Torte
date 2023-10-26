import React from 'react';
import {
  StyleSheet,
} from 'react-native';
import { MediumText } from '../../utils/components/NewStyledText';
import { useSelector } from 'react-redux';
import { selectTable } from '../../redux/selectors/selectorsTables';

export default function Table({ table_id }) {
  const table = useSelector(selectTable(table_id))

  return (
    <MediumText>{table.name}</MediumText>
  )
}

const styles = StyleSheet.create({

});

