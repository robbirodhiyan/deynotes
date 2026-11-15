
import AppUpdateCard from '@/components/app-update-card';
import DatabaseMaintenanceCard from '@/components/database-maintenance-card';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    Button,
    Card,
    Text,
    useTheme,
} from 'react-native-paper';

import {
    Info,
    Monitor,
    Moon,
    Settings,
    Sun,
} from 'lucide-react-native';

import {
    useAppTheme,
    type ThemeMode,
} from '@/contexts/theme-context';

export default function SettingsScreen() {
  const theme = useTheme();
  const { mode, setMode, isDark } = useAppTheme();

  function themeButton(
    label: string,
    value: ThemeMode,
    IconComponent: typeof Sun
  ) {
    return (
      <Button
        mode={mode === value ? 'contained' : 'outlined'}
        icon={({ size, color }) => (
          <IconComponent size={size} color={color} />
        )}
        onPress={() => setMode(value)}
      >
        {label}
      </Button>
    );
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <Settings
            size={26}
            color={theme.colors.primary}
          />

          <Text variant="headlineMedium">
            Settings
          </Text>
        </View>

        <Card mode="elevated">
          <Card.Content style={styles.cardContent}>
            <View style={styles.titleRow}>
              <Sun
                size={22}
                color={theme.colors.primary}
              />

              <Text variant="titleLarge">
                Appearance
              </Text>
            </View>

            <Text variant="bodyMedium">
              Pilih tema aplikasi
            </Text>

            {themeButton(
              'Ikuti Sistem',
              'system',
              Monitor
            )}

            {themeButton(
              'Light Mode',
              'light',
              Sun
            )}

            {themeButton(
              'Dark Mode',
              'dark',
              Moon
            )}

            <Text variant="bodySmall">
              Tema aktif: {isDark ? 'Dark' : 'Light'}
            </Text>

            <Text variant="bodySmall">
              Preferensi belum disimpan permanen.
            </Text>
          </Card.Content>
        </Card>

        <Card mode="outlined">
          <Card.Content style={styles.cardContent}>
            <View style={styles.titleRow}>
              <Info
                size={22}
                color={theme.colors.primary}
              />

              <Text variant="titleLarge">
                About Application
              </Text>
            </View>

            <Text>Application: Offline Starter Kit</Text>
            <Text>Version: 1.0.0</Text>
            <Text>Framework: Expo SDK 58</Text>
            <Text>UI: React Native Paper</Text>
            <Text>Icons: Lucide React Native</Text>
          </Card.Content>
        </Card>
        
        <AppUpdateCard />
        <DatabaseMaintenanceCard />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    padding: 20,
    gap: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardContent: {
    gap: 16,
    paddingVertical: 20,
  },
});
