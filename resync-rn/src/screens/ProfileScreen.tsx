import React, {useCallback, useState} from 'react';
import {View, Text, ScrollView, StyleSheet, Pressable, StatusBar, Image} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {User} from '@supabase/supabase-js';
import {RootStackParamList} from '../navigation/types';
import {colors, fonts} from '../theme/colors';
import {supabase} from '../services/supabase';
import {TextField} from '../components/TextField';
import {avatarError, loadAvatar, loadProfile, saveAvatar, saveProfile, type ProfileFields} from '../services/profile';

// Phone version of the web's Academic Profile (web src/screens/dashboard/AcademicProfileView.tsx).
export const ProfileScreen: React.FC = () => {
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileFields>({fullName: '', email: '', contactNumber: ''});
  const [draft, setDraft] = useState(profile);
  const [editMode, setEditMode] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');

  useFocusEffect(useCallback(() => {
    supabase.auth.getUser().then(async ({data}) => {
      setUser(data.user);
      setProfile(await loadProfile(data.user));
      setAvatarUri(await loadAvatar(data.user?.id));
    });
  }, []));

  const startEdit = () => {setDraft(profile); setEditMode(true);};
  const save = async () => {
    setProfile(draft);
    setEditMode(false);
    await saveProfile(user?.id, draft);
  };

  const pickPhoto = async () => {
    setPhotoError('');
    try {
      const picker = require('@react-native-documents/picker');
      const [file] = await picker.pick({type: [picker.types.images]});
      const error = avatarError({type: file.type, size: file.size});
      if (error) return setPhotoError(error);
      const [copy] = await picker.keepLocalCopy({files: [{uri: file.uri, fileName: file.name || 'avatar'}], destination: 'documentDirectory'});
      if (copy.status !== 'success') return setPhotoError("We couldn't read that image. Please try another file.");
      setAvatarUri(copy.localUri);
      await saveAvatar(user?.id, copy.localUri);
    } catch (error: any) {
      if (error?.code !== 'DOCUMENT_PICKER_CANCELED') setPhotoError("We couldn't read that image. Please try another file.");
    }
  };

  const removePhoto = async () => {
    setAvatarUri(null);
    setPhotoError('');
    await saveAvatar(user?.id, null);
  };

  const initials = profile.fullName.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
  const field = (icon: string, label: string, key: keyof ProfileFields) => <View style={styles.detail}>
    <View style={styles.detailIcon}><MaterialIcons name={icon} size={18} color={colors.muted} /></View>
    <View style={styles.detailBody}>
      <Text style={styles.detailLabel}>{label}</Text>
      {editMode ? <TextField value={draft[key]} onChangeText={value => setDraft({...draft, [key]: value})}
        keyboardType={key === 'email' ? 'email-address' : key === 'contactNumber' ? 'phone-pad' : 'default'} />
        : profile[key] ? <Text style={styles.detailValue}>{profile[key]}</Text>
        : <Text style={styles.muted}>Not added yet <Text style={styles.link} onPress={startEdit}>Add number</Text></Text>}
    </View>
  </View>;

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={styles.topBar}>
        <View>
          <Text style={styles.eyebrow}>ACCOUNT</Text>
          <Text style={styles.title}>Academic Profile</Text>
        </View>
        <Pressable onPress={() => rootNav.push('Settings')} style={styles.gearBtn} accessibilityLabel="Settings">
          <MaterialIcons name="settings" size={22} color={colors.ink} />
        </Pressable>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.muted}>Manage your personal profile and contact information.</Text>
        <View style={styles.actions}>
          {editMode ? <>
            <Pressable onPress={() => setEditMode(false)} style={styles.secondaryBtn}><Text style={styles.secondaryText}>Cancel</Text></Pressable>
            <Pressable onPress={save} style={styles.primaryBtn}><Text style={styles.primaryText}>Save Changes</Text></Pressable>
          </> : <Pressable onPress={startEdit} style={styles.secondaryBtn}>
            <MaterialIcons name="edit" size={14} color={colors.primary} />
            <Text style={[styles.secondaryText, {color: colors.primary}]}>Edit Profile</Text>
          </Pressable>}
        </View>

        <View style={styles.card}>
          <View style={styles.identity}>
            <View>
              <View style={styles.avatar}>
                {avatarUri ? <Image source={{uri: avatarUri}} style={styles.avatarImage} resizeMode="cover" accessibilityLabel={`${profile.fullName} profile picture`} />
                  : <Text style={styles.avatarInitials}>{initials}</Text>}
              </View>
              <Pressable onPress={pickPhoto} style={styles.cameraBadge} accessibilityRole="button" accessibilityLabel="Change profile picture">
                <MaterialIcons name="photo-camera" size={16} color={colors.body} />
              </Pressable>
            </View>
            <View style={styles.identityText}>
              <Text style={styles.name}>{profile.fullName}</Text>
              <View style={styles.activeBadge}><View style={styles.activeDot} /><Text style={styles.activeText}>Active</Text></View>
              <Text style={styles.muted}>{profile.email}</Text>
            </View>
          </View>
          <View style={styles.photoNote}>
            <Text style={styles.photoTitle}>Profile picture</Text>
            <Text style={styles.muted}>JPEG or PNG, max 5MB. Tap the camera badge on your avatar to upload.</Text>
            {!!photoError && <Text accessibilityRole="alert" style={styles.error}>{photoError}</Text>}
            {!!avatarUri && <Text onPress={removePhoto} style={styles.removeLink}>Remove photo</Text>}
          </View>

          <Text style={styles.sectionLabel}>PERSONAL DETAILS</Text>
          {field('person-outline', 'FULL NAME', 'fullName')}
          {field('mail-outline', 'EMAIL ADDRESS', 'email')}
          {field('phone', 'CONTACT NUMBER', 'contactNumber')}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.soft},
  topBar: {minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8},
  eyebrow: {fontFamily: fonts.mono[700], fontSize: 10, color: colors.primary, letterSpacing: 1.2},
  title: {fontFamily: fonts.display[700], fontSize: 26, color: colors.ink},
  gearBtn: {width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center'},
  scrollContent: {paddingHorizontal: 20, paddingBottom: 36, gap: 14},
  actions: {flexDirection: 'row', gap: 8},
  secondaryBtn: {flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white},
  secondaryText: {fontFamily: fonts.sans[600], fontSize: 12, color: colors.body},
  primaryBtn: {paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12, backgroundColor: colors.primary},
  primaryText: {fontFamily: fonts.sans[700], fontSize: 12, color: colors.white},
  card: {backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 18, gap: 14},
  identity: {flexDirection: 'row', alignItems: 'center', gap: 16},
  avatar: {width: 88, height: 88, borderRadius: 24, overflow: 'hidden', backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center'},
  avatarImage: {width: '100%', height: '100%'},
  avatarInitials: {fontFamily: fonts.display[700], fontSize: 32, color: colors.white},
  cameraBadge: {position: 'absolute', right: -6, bottom: -6, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center'},
  identityText: {flex: 1, gap: 4},
  name: {fontFamily: fonts.display[700], fontSize: 20, color: colors.ink},
  activeBadge: {flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: colors.successTint},
  activeDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success},
  activeText: {fontFamily: fonts.sans[700], fontSize: 10, color: colors.successText},
  photoNote: {gap: 4},
  photoTitle: {fontFamily: fonts.sans[700], fontSize: 12, color: colors.ink},
  error: {fontFamily: fonts.sans[600], fontSize: 12, color: colors.errorText},
  removeLink: {fontFamily: fonts.sans[600], fontSize: 12, color: colors.muted},
  sectionLabel: {fontFamily: fonts.sans[700], fontSize: 11, color: colors.muted, letterSpacing: 2, marginTop: 6},
  detail: {flexDirection: 'row', gap: 12, padding: 12, borderRadius: 16, backgroundColor: colors.soft, borderWidth: 1, borderColor: colors.line},
  detailIcon: {width: 34, height: 34, borderRadius: 10, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center'},
  detailBody: {flex: 1, gap: 2},
  detailLabel: {fontFamily: fonts.mono[700], fontSize: 10, color: colors.hint, letterSpacing: 1.2},
  detailValue: {fontFamily: fonts.sans[600], fontSize: 14, color: colors.ink},
  muted: {fontFamily: fonts.sans[400], fontSize: 13, color: colors.muted, lineHeight: 19},
  link: {fontFamily: fonts.sans[600], color: colors.primary},
});
