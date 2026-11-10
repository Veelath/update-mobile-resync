import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../theme/colors';
import { brand } from '../theme/brand';
import { LineIcon } from './LineIcon';
import {
  AppNotification,
  loadNotifications,
  markNotificationsRead,
  openScanReport,
  subscribeNotifications,
  timeAgo,
} from '../services/notifications';

/** Dashboard bell with the scan notifications popover from the A5 mockup. */
export const NotificationBell: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadNotifications().then(setItems);
    return subscribeNotifications(setItems);
  }, []);

  const unread = items.some((item) => !item.read);

  // Marked read on close so the dots stay visible while the list is open
  const close = () => {
    setOpen(false);
    if (unread) markNotificationsRead().catch(() => {});
  };

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={styles.bell} hitSlop={4} accessibilityLabel={unread ? 'Notifications, unread' : 'Notifications'}>
        <LineIcon name="bell" size={18} color={brand.sub} />
        {unread && <View style={styles.bellDot} />}
      </Pressable>

      <Modal visible={open} transparent statusBarTranslucent animationType="fade" onRequestClose={close}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close" />
        <View style={[styles.panel, { top: insets.top + 56, width: Math.min(330, screenWidth - 24) }]}>
          <Text style={styles.heading}>NOTIFICATIONS</Text>
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {items.length === 0 && <Text style={styles.message}>No notifications yet.</Text>}
            {items.map((item) => (
              <Pressable
                key={item.id}
                disabled={!item.scanId}
                style={styles.row}
                onPress={() => {
                  close();
                  if (item.scanId) openScanReport(item.scanId);
                }}
              >
                <View style={[styles.dot, item.kind === 'error' && styles.dotError, item.read && styles.dotRead]} />
                <View style={styles.flex1}>
                  <Text style={styles.title}>{item.title}</Text>
                  {!!item.documentTitle && <Text style={styles.document}>{item.documentTitle}</Text>}
                  <Text style={styles.message}>{item.message}</Text>
                  <Text style={styles.time}>{timeAgo(item.at)}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
    minWidth: 0,
  },
  bell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  panel: {
    position: 'absolute',
    right: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E6E5F7',
    backgroundColor: '#FFFFFF',
    shadowColor: brand.ink,
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 16,
  },
  heading: {
    paddingTop: 16,
    paddingHorizontal: 18,
    paddingBottom: 8,
    fontFamily: fonts.mono[700],
    fontSize: 11,
    letterSpacing: 1.5,
    color: '#6B6890',
  },
  list: {
    maxHeight: 330,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 7,
    backgroundColor: '#22B573',
  },
  dotError: {
    backgroundColor: '#D6264A',
  },
  dotRead: {
    opacity: 0,
  },
  title: {
    fontFamily: fonts.sans[800],
    fontSize: 14,
    color: brand.ink,
  },
  document: {
    marginTop: 2,
    fontFamily: fonts.sans[700],
    fontSize: 12.5,
    color: brand.primary,
  },
  message: {
    marginTop: 2,
    fontFamily: fonts.sans[400],
    fontSize: 12.5,
    lineHeight: 18,
    color: '#6B6890',
  },
  time: {
    marginTop: 4,
    fontFamily: fonts.sans[400],
    fontSize: 11.5,
    color: '#7D7B9E',
  },
});
