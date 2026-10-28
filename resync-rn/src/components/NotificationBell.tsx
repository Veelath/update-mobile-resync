import React, {useEffect, useState} from 'react';
import {View, Text, Pressable, StyleSheet, ScrollView} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {BottomSheet} from './BottomSheet';
import {colors, fonts} from '../theme/colors';
import {loadNotifications, markNotificationsRead, openScanReport, subscribeNotifications, timeAgo, type AppNotification} from '../services/notifications';

export function NotificationBell({color = colors.white}: {color?: string}) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    loadNotifications().then(setItems);
    return subscribeNotifications(setItems);
  }, []);
  const unread = items.filter(item => !item.read).length;

  const show = () => {
    setOpen(true);
    if (unread) markNotificationsRead().catch(() => {});
  };

  return <>
    <Pressable onPress={show} accessibilityRole="button" accessibilityLabel={unread ? `Notifications, ${unread} unread` : 'Notifications'} style={styles.bell}>
      <MaterialIcons name="notifications-none" size={22} color={color} />
      {unread > 0 && <View style={styles.dot} />}
    </Pressable>
    <BottomSheet visible={open} onClose={() => setOpen(false)}>
      <Text style={styles.heading}>Notifications</Text>
      <ScrollView style={styles.list}>
        {items.length ? items.map(item => <Pressable key={item.id} disabled={!item.scanId} style={styles.row}
          onPress={() => {setOpen(false); if (item.scanId) openScanReport(item.scanId);}}>
          <MaterialIcons name={item.kind === 'success' ? 'check-circle' : 'error'} size={20} color={item.kind === 'success' ? colors.success : colors.error} />
          <View style={styles.text}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.time}>{timeAgo(item.at)}</Text>
          </View>
        </Pressable>) : <Text style={styles.message}>No notifications yet.</Text>}
      </ScrollView>
    </BottomSheet>
  </>;
}

const styles = StyleSheet.create({
  bell: {padding: 4},
  dot: {position: 'absolute', top: 4, right: 5, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error},
  heading: {fontFamily: fonts.sans[700], fontSize: 16, color: colors.ink, marginBottom: 8},
  list: {maxHeight: 420},
  row: {flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line},
  text: {flex: 1, gap: 2},
  title: {fontFamily: fonts.sans[700], fontSize: 14, color: colors.ink},
  message: {fontFamily: fonts.sans[400], fontSize: 13, color: colors.body, lineHeight: 18},
  time: {fontFamily: fonts.sans[400], fontSize: 11, color: colors.muted},
});
