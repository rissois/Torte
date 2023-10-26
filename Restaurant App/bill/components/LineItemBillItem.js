import React, { useCallback, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';
import Colors from '../../utils/constants/Colors';
import { DefaultText, ExtraLargeText, } from '../../utils/components/NewStyledText';
import { useBillItemComment, useBillItemIsEditable } from '../../utils/hooks/useBillItem';

export const LineItemBillItem = ({ bill_id, bill_item_id, isAdd, setAdd, isEdit, setEdit, isRemove, setRemove = () => { }, isUnvoid, setUnvoid, pressType, text, onNoPressType }) => {
  const comment = useBillItemComment(bill_id, bill_item_id)
  const isEditable = useBillItemIsEditable(bill_id, bill_item_id)

  const isUneditable = useMemo(() => !isEditable && !isAdd, [isAdd, isEditable])

  const removeFromEdit = useCallback(() => setEdit(prev => prev.includes(bill_item_id) ? prev.filter(id => id !== bill_item_id) : prev), [bill_item_id])
  const removeFromRemove = useCallback(() => setRemove(prev => prev.includes(bill_item_id) ? prev.filter(id => id !== bill_item_id) : prev), [bill_item_id])
  const removeFromUnvoid = useCallback(() => setUnvoid(prev => prev.includes(bill_item_id) ? prev.filter(id => id !== bill_item_id) : prev), [bill_item_id])
  const onPress = useCallback(() => {
    if (!pressType) {
      // Do you want to alert if !isEdit && !isRemove?
      if (isEdit) removeFromEdit()
      else if (isRemove) removeFromRemove()
      else if (isUnvoid) removeFromUnvoid()
      else onNoPressType(true)
    }
    else if (isAdd) {
      if (pressType === 'edit') setEdit(prev => prev.includes(bill_item_id) ? prev.filter(id => id !== bill_item_id) : [...prev, bill_item_id])
      else if (pressType === 'remove') setAdd(prev => prev.filter(id => id !== bill_item_id))
    }
    else if (pressType === 'edit') {
      setEdit(prev => prev.includes(bill_item_id) ? prev.filter(id => id !== bill_item_id) : [...prev, bill_item_id])
      removeFromRemove()
    }
    else if (pressType === 'remove') {
      setRemove(prev => prev.includes(bill_item_id) ? prev.filter(id => id !== bill_item_id) : [...prev, bill_item_id])
      removeFromEdit()
    }
    else if (pressType === 'unvoid') {
      setUnvoid(prev => prev.includes(bill_item_id) ? prev.filter(id => id !== bill_item_id) : [...prev, bill_item_id])
    }
  }, [pressType, bill_item_id, isAdd, isEdit, isRemove, isUnvoid])

  useEffect(() => {
    if (isUneditable) {
      removeFromEdit()
      removeFromRemove()
    }
  }, [isUneditable, isAdd,])

  return <TouchableOpacity
    style={{ width: '33%' }} // consider minWidth 33% and maxWidth 50% for comments
    disabled={isUneditable}
    onPress={onPress}>
    <View style={{ margin: 10, backgroundColor: isUneditable ? Colors.background : isRemove ? Colors.red : isEdit ? Colors.purple : isAdd || isUnvoid ? Colors.darkgreen : Colors.darkgrey, borderRadius: 12, padding: 20 }}>
      <ExtraLargeText>{text}</ExtraLargeText>
      {isUneditable && <DefaultText red bold>CANNOT EDIT</DefaultText>}
      {!!comment && <DefaultText>{comment}</DefaultText>}
    </View>
  </TouchableOpacity>
}


const styles = StyleSheet.create({

});

