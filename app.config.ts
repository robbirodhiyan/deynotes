import type {
  ConfigContext,
  ExpoConfig,
} from 'expo/config';

import project from './project.config.json';

export default ({
  config,
}: ConfigContext): ExpoConfig => {
  const { brand, app, release, branding } = project;

  if (!/^[a-z][a-z0-9_]*$/.test(app.key)) {
    throw new Error('Invalid Debiyan app key.');
  }

  if (!/^[a-z][a-z0-9-]*$/.test(app.slug)) {
    throw new Error('Invalid Expo slug.');
  }

  if (
    app.androidPackage !==
    'app.debiyan.' + app.key
  ) {
    throw new Error(
      'Android package tidak sesuai standar Debiyan.'
    );
  }

  if (!/^[a-z0-9_-]+\.db$/.test(app.databaseName)) {
    throw new Error('Invalid databaseName.');
  }

  const colorPattern = /^#[0-9a-fA-F]{6}$/;

  if (
    !colorPattern.test(branding.primaryColor) ||
    !colorPattern.test(branding.backgroundColor)
  ) {
    throw new Error(
      'Warna branding wajib menggunakan format #RRGGBB.'
    );
  }

  const splashOptions = {
    backgroundColor: branding.backgroundColor,
    image: branding.splashImage,
    imageWidth: 120,
  };

  const plugins: NonNullable<ExpoConfig['plugins']> =
    (config.plugins ?? []).map((plugin) => {
      if (
        Array.isArray(plugin) &&
        plugin[0] === 'expo-splash-screen'
      ) {
        return [
          'expo-splash-screen',
          {
            ...plugin[1],
            ...splashOptions,
          },
        ] as [string, Record<string, unknown>];
      }

      return plugin;
    });

  return {
    ...config,

    name: app.name,
    slug: app.slug,
    scheme: app.scheme,

    icon: branding.icon,

    plugins,

    android: {
      ...config.android,
      package: app.androidPackage,

      adaptiveIcon: {
        ...config.android?.adaptiveIcon,
        backgroundColor: branding.backgroundColor,
        foregroundImage:
          './assets/images/android-icon-foreground.png',
      },
    },

    ios: {
      ...config.ios,
      bundleIdentifier: app.iosBundleIdentifier,
      icon: branding.icon,
    },

    web: {
      ...config.web,
      favicon: branding.icon,
    },

    extra: {
      ...config.extra,

      project: {
        brandName: brand.name,
        appName: app.name,
        appKey: app.key,

        databaseName: app.databaseName,

        primaryColor:
          branding.primaryColor.toUpperCase(),

        backgroundColor:
          branding.backgroundColor.toUpperCase(),

        apkPrefix: release.apkPrefix,
        releaseOwner: release.owner,
        releaseRepository: release.repository,
      },
    },
  };
};
