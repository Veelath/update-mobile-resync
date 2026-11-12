import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  StatusBar,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { colors, fonts } from '../theme/colors';
import { SearchField } from '../components/SearchField';
import { FilterChip } from '../components/FilterChip';
import { ScoreBadge } from '../components/ScoreBadge';
import { ScanItem } from '../data/scans';
import { getAllScans } from '../services/scanRepository';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackgroundScanProgress } from '../components/scan/BackgroundScanProgress';

export const ArchiveScreen: React.FC = () => {
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const tabNav = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const insets = useSafeAreaInsets();

  const [scans, setScans] = useState<ScanItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'All' | 'High' | 'Review'>('All');

  // Load scans on focus
  useFocusEffect(
    useCallback(() => {
      getAllScans().then(setScans);
    }, [])
  );

  const handleToggleSelect = (scan: ScanItem) => {
    rootNav.push('Report', { scanId: scan.id, heavy: scan.heavy });
  };

  const filteredScans = scans.filter((s) => {
    const matchesSearch = s.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filter === 'High') return s.score >= 80;
    if (filter === 'Review') return s.score < 80;
    return true;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleCol}>
          <Text style={styles.h1}>Manuscript Archive</Text>
          <Text style={styles.headerSub}>Previous scans synced on this device</Text>
        </View>

        <Pressable
          onPress={() => tabNav.navigate('Settings')}
          style={styles.gearBtn}
        >
          <MaterialIcons name="settings" size={22} color={colors.ink} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <SearchField
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{ flex: 1 }}
        />
      </View>

      {/* Filter Chips */}
      <View style={styles.filterChipsRow}>
        <FilterChip
          label="All"
          selected={filter === 'All'}
          onPress={() => setFilter('All')}
        />
        <FilterChip
          label="High score"
          selected={filter === 'High'}
          onPress={() => setFilter('High')}
        />
        <FilterChip
          label="Needs review"
          selected={filter === 'Review'}
          onPress={() => setFilter('Review')}
        />
      </View>

      {/* Scans List */}
      <FlatList
        data={filteredScans}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          return (
            <Pressable
              onPress={() => handleToggleSelect(item)}
              style={({ pressed }) => [
                styles.itemCard,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              android_ripple={{ color: '#F1F5F9' }}
            >
              {/* Leading */}
              <ScoreBadge score={item.score} />

              {/* Title & Meta */}
              <View style={styles.itemInfoCol}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.itemMeta}>
                  {item.status} · {item.date}
                </Text>
              </View>

              {/* Trailing */}
              <MaterialIcons name="chevron-right" size={20} color={colors.hint} />
            </Pressable>
          );
        }}
      />
      <BackgroundScanProgress />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.soft,
    paddingHorizontal: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
  },
  headerTitleCol: {
    flex: 1,
    gap: 4,
  },
  h1: {
    fontFamily: fonts.display[700],
    fontSize: 26,
    color: colors.ink,
  },
  headerSub: {
    fontFamily: fonts.sans[400],
    fontSize: 13,
    color: colors.muted,
  },
  gearBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  listContent: {
    gap: 8,
    paddingBottom: 24,
  },
  itemCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemInfoCol: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontFamily: fonts.sans[600],
    fontSize: 14.5,
    color: colors.ink,
  },
  itemMeta: {
    fontFamily: fonts.sans[400],
    fontSize: 12,
    color: colors.muted,
  },
});
