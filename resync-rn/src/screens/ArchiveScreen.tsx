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
import { RootStackParamList } from '../navigation/types';
import { colors, fonts } from '../theme/colors';
import { SearchField } from '../components/SearchField';
import { FilterChip } from '../components/FilterChip';
import { ScoreBadge } from '../components/ScoreBadge';
import { Checkbox } from '../components/Checkbox';
import { Button } from '../components/Button';
import { ScanItem } from '../data/scans';
import { getAllScans } from '../services/scanRepository';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const ArchiveScreen: React.FC = () => {
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const [scans, setScans] = useState<ScanItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'All' | 'High' | 'Review'>('All');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedScanIds, setSelectedScanIds] = useState<string[]>([]);

  // Load scans on focus
  useFocusEffect(
    useCallback(() => {
      getAllScans().then(setScans);
    }, [])
  );

  const toggleCompareMode = () => {
    setCompareMode(!compareMode);
    setSelectedScanIds([]);
  };

  const selectedFirstScan = scans.find(
    (s) => selectedScanIds.length > 0 && s.id === selectedScanIds[0]
  );
  const activeUrlFilter = selectedFirstScan ? selectedFirstScan.url : null;

  const handleToggleSelect = (scan: ScanItem) => {
    if (!compareMode) {
      rootNav.push('Report', { scanId: scan.id, heavy: scan.heavy });
      return;
    }

    if (selectedScanIds.includes(scan.id)) {
      setSelectedScanIds(selectedScanIds.filter((id) => id !== scan.id));
    } else {
      setSelectedScanIds([...selectedScanIds, scan.id]);
    }
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

  const handleLaunchCompare = () => {
    if (selectedScanIds.length >= 2) {
      rootNav.push('Compare', { scanIds: selectedScanIds });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleCol}>
          <Text style={styles.h1}>Manuscript Archive</Text>
          <Text
            style={[
              styles.headerSub,
              compareMode && { color: colors.primary, fontFamily: fonts.sans[600] },
            ]}
          >
            {compareMode
              ? 'Select versions of the same document to compare'
              : 'Previous scans synced on this device'}
          </Text>
        </View>

        <Pressable
          onPress={() => rootNav.push('Settings')}
          style={styles.gearBtn}
        >
          <MaterialIcons name="settings" size={22} color={colors.ink} />
        </Pressable>
      </View>

      {/* Search & Compare Toggle Row */}
      <View style={styles.searchRow}>
        <SearchField
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{ flex: 1 }}
        />

        <Pressable
          onPress={toggleCompareMode}
          style={[
            styles.comparePillBtn,
            compareMode ? styles.comparePillCancel : styles.comparePillActive,
          ]}
        >
          <MaterialIcons
            name="list"
            size={18}
            color={compareMode ? colors.primary : colors.white}
          />
          <Text
            style={[
              styles.comparePillText,
              { color: compareMode ? colors.primary : colors.white },
            ]}
          >
            {compareMode ? 'Cancel' : 'Compare'}
          </Text>
        </Pressable>
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

      {/* Compare selection bar */}
      {compareMode && selectedScanIds.length > 0 && (
        <View style={styles.compareStatusBar}>
          <Text style={styles.compareStatusText}>
            {selectedScanIds.length} version(s) selected
          </Text>
          <Button
            title="Compare"
            size="sm"
            disabled={selectedScanIds.length < 2}
            onPress={handleLaunchCompare}
            style={styles.smallCompareBtn}
          />
        </View>
      )}

      {/* Scans List */}
      <FlatList
        data={filteredScans}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isSelected = selectedScanIds.includes(item.id);
          const isDifferentDoc =
            compareMode &&
            activeUrlFilter !== null &&
            item.url !== activeUrlFilter;

          return (
            <Pressable
              onPress={() => !isDifferentDoc && handleToggleSelect(item)}
              style={({ pressed }) => [
                styles.itemCard,
                isSelected && styles.itemCardSelected,
                isDifferentDoc && styles.itemCardDisabled,
                { opacity: pressed && !isDifferentDoc ? 0.85 : 1 },
              ]}
              android_ripple={!isDifferentDoc ? { color: '#F1F5F9' } : undefined}
            >
              {/* Leading */}
              {compareMode ? (
                <Checkbox
                  checked={isSelected}
                  onToggle={() => !isDifferentDoc && handleToggleSelect(item)}
                />
              ) : (
                <ScoreBadge score={item.score} />
              )}

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
              {!compareMode && (
                <MaterialIcons
                  name="chevron-right"
                  size={20}
                  color={colors.hint}
                />
              )}
            </Pressable>
          );
        }}
      />
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
  comparePillBtn: {
    height: 44,
    borderRadius: 24,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  comparePillActive: {
    backgroundColor: colors.primary,
  },
  comparePillCancel: {
    backgroundColor: '#F1F5F9',
  },
  comparePillText: {
    fontFamily: fonts.sans[600],
    fontSize: 13,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  compareStatusBar: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.primaryTint,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compareStatusText: {
    fontFamily: fonts.sans[600],
    fontSize: 13,
    color: '#0A1E8C',
  },
  smallCompareBtn: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 8,
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
  itemCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  itemCardDisabled: {
    opacity: 0.4,
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
