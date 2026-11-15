
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Button,
  Card,
  Chip,
  Text,
  useTheme,
} from 'react-native-paper';

import {
  ArrowRight,
  Check,
  Database,
  Settings,
  Smartphone,
} from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <SafeAreaView
      edges={['top']}
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <View style={styles.titleRow}>
            <Smartphone
              size={28}
              color={theme.colors.primary}
            />

            <Text variant="headlineMedium">
              Dashboard
            </Text>
          </View>

          <Text variant="bodyMedium">
            React Native Offline Starter Kit
          </Text>
        </View>

        <Card mode="elevated">
          <Card.Content style={styles.cardContent}>
            <View style={styles.titleRow}>
              <Check
                size={22}
                color={theme.colors.primary}
              />

              <Text variant="titleLarge">
                Framework Ready
              </Text>
            </View>

            <View style={styles.chips}>
              <Chip>Expo SDK 58</Chip>
              <Chip>React Native Paper</Chip>
              <Chip>Lucide Icons</Chip>
              <Chip>TypeScript</Chip>
            </View>

            <Text variant="bodyMedium">
              UI Foundation telah dikonfigurasi untuk
              pengembangan aplikasi mobile offline.
            </Text>
          </Card.Content>
        </Card>

        <Text variant="titleLarge">
          Quick Access
        </Text>

        <Card mode="outlined">
          <Card.Content style={styles.cardContent}>
            <View style={styles.titleRow}>
              <Database
                size={24}
                color={theme.colors.primary}
              />

              <View style={styles.flex}>
                <Text variant="titleMedium">
                  Data Management
                </Text>

                <Text variant="bodySmall">
                  Kelola data aplikasi
                </Text>
              </View>
            </View>

            <Button
              mode="contained"
              icon={({ size, color }) => (
                <ArrowRight size={size} color={color} />
              )}
              onPress={() => router.navigate('/data')}
            >
              Buka Data
            </Button>
          </Card.Content>
        </Card>

        <Card mode="outlined">
          <Card.Content style={styles.cardContent}>
            <View style={styles.titleRow}>
              <Settings
                size={24}
                color={theme.colors.primary}
              />

              <View style={styles.flex}>
                <Text variant="titleMedium">
                  Application Settings
                </Text>

                <Text variant="bodySmall">
                  Tema dan konfigurasi aplikasi
                </Text>
              </View>
            </View>

            <Button
              mode="contained-tonal"
              icon={({ size, color }) => (
                <ArrowRight size={size} color={color} />
              )}
              onPress={() => router.navigate('/settings')}
            >
              Buka Settings
            </Button>
          </Card.Content>
        </Card>

        <Text variant="bodySmall" style={styles.footer}>
          Offline Starter Kit v1.0.0
        </Text>
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
    paddingBottom: 32,
    gap: 20,
  },
  heading: {
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardContent: {
    paddingVertical: 18,
    gap: 16,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  flex: {
    flex: 1,
  },
  footer: {
    textAlign: 'center',
    opacity: 0.6,
  },
});
