
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ============================================================
// DEBIYAN APP GENERATOR — DeyKit
// ============================================================

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

const args = process.argv.slice(2);

// ============================================================
// 1. HELPERS
// ============================================================

function argument(flag) {
  const index = args.indexOf(flag);

  if (index === -1) {
    return null;
  }

  const value = args[index + 1];

  if (!value || value.startsWith('--')) {
    throw new Error(`${flag} membutuhkan nilai.`);
  }

  return value.trim();
}

function writeJson(filename, data) {
  fs.writeFileSync(
    filename,
    JSON.stringify(data, null, 2) + '\n',
    'utf8'
  );
}

function hexColor(value, field) {
  if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
    throw new Error(
      `${field} harus menggunakan format #RRGGBB.`
    );
  }

  return value.toUpperCase();
}

function assertPng(filename) {
  if (
    !fs.existsSync(filename) ||
    !fs.statSync(filename).isFile()
  ) {
    throw new Error(
      `File icon tidak ditemukan: ${filename}`
    );
  }

  const signature = fs
    .readFileSync(filename)
    .subarray(0, 8);

  if (
    !signature.equals(
      Buffer.from('89504e470d0a1a0a', 'hex')
    )
  ) {
    throw new Error(
      'File --icon harus berupa PNG valid.'
    );
  }
}

// ============================================================
// 2. INPUT PROJECT
// ============================================================

const appName = argument('--name');

if (!appName) {
  console.error(
    'Contoh: npm run create:app -- --name "DeyNotes"'
  );

  process.exit(1);
}

const keyInput = argument('--key') ?? appName;

const releaseOwner = argument('--owner') ?? '';

const primaryColor = hexColor(
  argument('--primary') ?? '#6750A4',
  'Primary color'
);

const backgroundColor = hexColor(
  argument('--background') ?? '#FFFFFF',
  'Background color'
);

const iconInput = argument('--icon');

const iconSource = iconInput
  ? path.resolve(iconInput)
  : null;

if (iconSource) {
  assertPng(iconSource);
}

// ============================================================
// 3. APPLICATION IDENTITY
// ============================================================

const appKey = keyInput
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

if (!/^[a-z][a-z0-9_]*$/.test(appKey)) {
  throw new Error(
    'App key harus diawali huruf dan hanya ' +
    'berisi a-z, 0-9, atau underscore.'
  );
}

const releaseRepository =
  argument('--repo') ?? appKey;

if (
  !/^[a-zA-Z0-9._-]+$/.test(releaseRepository) ||
  ['.', '..'].includes(releaseRepository)
) {
  throw new Error(
    'Nama repository GitHub tidak valid.'
  );
}

if (
  releaseOwner &&
  !/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(
    releaseOwner
  )
) {
  throw new Error(
    'GitHub owner tidak valid.'
  );
}

const slug = appKey.replace(/_/g, '-');

const scheme = appKey.replace(/_/g, '');

const applicationId = `app.debiyan.${appKey}`;

const iosBundleIdentifier =
  `app.debiyan.${appKey.replace(/_/g, '-')}`;

const databaseName = `${appKey}.db`;

const destination = path.resolve(
  ROOT,
  '..',
  appKey
);

const workflowTemplate = path.join(
  ROOT,
  'scripts',
  'templates',
  'release-android.yml'
);

// ============================================================
// 4. VALIDATE SOURCE PROJECT
// ============================================================

if (fs.existsSync(destination)) {
  throw new Error(
    `Folder tujuan sudah tersedia: ${destination}`
  );
}

for (const filename of [
  'app.json',
  'package.json',
  'project.config.json',
]) {
  if (!fs.existsSync(path.join(ROOT, filename))) {
    throw new Error(
      `File sumber tidak ditemukan: ${filename}`
    );
  }
}

if (!fs.existsSync(workflowTemplate)) {
  throw new Error(
    'Template workflow tidak ditemukan: ' +
    'scripts/templates/release-android.yml'
  );
}

// ============================================================
// 5. COPY SOURCE PROJECT
// ============================================================

// Tidak membawa Git history, native build, dan cache.
const excludedDirectories = new Set([
  '.git',
  '.github',
  '.expo',
  '.eas',
  'node_modules',
  'android',
  'ios',
  'dist',
  'build',
  'coverage',
  '.next',
  '.turbo',
]);

// Tidak membawa konfigurasi credential project lama.
const excludedFiles = new Set([
  '.npmrc',
  '.netrc',
  'credentials.json',
  'google-services.json',
  'GoogleService-Info.plist',
  'eas-build.json',
  'app.config.js',
]);

const excludedExtensions = new Set([
  '.apk',
  '.aab',
  '.db',
  '.db-wal',
  '.db-shm',
  '.db-journal',
  '.sqlite',
  '.sqlite3',
  '.jks',
  '.keystore',
  '.p12',
  '.pfx',
  '.pem',
  '.p8',
  '.key',
  '.mobileprovision',
]);

console.log(
  `[Debiyan] Membuat aplikasi: ${appName}`
);

try {
  fs.cpSync(ROOT, destination, {
    recursive: true,

    filter(source) {
      const relative = path.relative(ROOT, source);

      if (!relative) {
        return true;
      }

      if (fs.lstatSync(source).isSymbolicLink()) {
        return false;
      }

      const segments = relative.split(path.sep);

      if (
        segments.some((segment) =>
          excludedDirectories.has(segment)
        )
      ) {
        return false;
      }

      const basename = path.basename(source);

      if (excludedFiles.has(basename)) {
        return false;
      }

      if (/^\.env(?:\..*)?$/i.test(basename)) {
        return false;
      }

      if (
        excludedExtensions.has(
          path.extname(basename).toLowerCase()
        )
      ) {
        return false;
      }

      return true;
    },
  });

  // ==========================================================
  // 6. GENERATE project.config.json
  // ==========================================================

  const branding = {
    primaryColor,
    backgroundColor,
    icon: './assets/images/icon.png',
    splashImage: './assets/images/splash-icon.png',
  };

  const project = {
    brand: {
      name: 'Debiyan',
    },

    branding,

    app: {
      name: appName,
      key: appKey,
      slug,
      scheme,
      androidPackage: applicationId,
      iosBundleIdentifier,
      databaseName,
    },

    release: {
      owner: releaseOwner,
      repository: releaseRepository,
      apkPrefix: appKey,
    },
  };

  writeJson(
    path.join(destination, 'project.config.json'),
    project
  );

  // ==========================================================
  // 7. ICON AND SPLASH ASSETS
  // ==========================================================

  const imagesDir = path.join(
    destination,
    'assets',
    'images'
  );

  fs.mkdirSync(imagesDir, {
    recursive: true,
  });

  if (iconSource) {
    for (const filename of [
      'icon.png',
      'android-icon-foreground.png',
      'splash-icon.png',
    ]) {
      fs.copyFileSync(
        iconSource,
        path.join(imagesDir, filename)
      );
    }
  }

  for (const filename of [
    'icon.png',
    'android-icon-foreground.png',
    'splash-icon.png',
  ]) {
    if (
      !fs.existsSync(
        path.join(imagesDir, filename)
      )
    ) {
      throw new Error(
        `Asset gambar tidak tersedia: ${filename}`
      );
    }
  }

  // ==========================================================
  // 8. RESET app.json
  // ==========================================================

  const appJsonPath = path.join(
    destination,
    'app.json'
  );

  const appJson = JSON.parse(
    fs.readFileSync(appJsonPath, 'utf8')
  );

  const expo = appJson.expo;

  if (!expo) {
    throw new Error(
      'app.json harus memiliki object expo.'
    );
  }

  // Identitas project baru.
  expo.name = appName;
  expo.slug = slug;
  expo.scheme = scheme;

  // Versi aplikasi baru.
  expo.version = '1.0.0';

  // Icon utama.
  expo.icon = branding.icon;

  // Identitas EAS lama tidak digunakan.
  delete expo.owner;
  delete expo.runtimeVersion;

  // ----------------------------------------------------------
  // Android
  // ----------------------------------------------------------

  expo.android ??= {};

  expo.android.package = applicationId;
  expo.android.versionCode = 1;

  expo.android.adaptiveIcon = {
    ...expo.android.adaptiveIcon,

    foregroundImage:
      './assets/images/android-icon-foreground.png',

    backgroundColor,
  };

  // Hindari gambar background icon dari aplikasi lama.
  delete expo.android.adaptiveIcon.backgroundImage;
  delete expo.android.adaptiveIcon.monochromeImage;
  delete expo.android.googleServicesFile;

  // ----------------------------------------------------------
  // iOS
  // ----------------------------------------------------------

  expo.ios ??= {};

  expo.ios.bundleIdentifier = iosBundleIdentifier;
  expo.ios.buildNumber = '1';
  expo.ios.icon = branding.icon;

  delete expo.ios.googleServicesFile;

  // ----------------------------------------------------------
  // Web
  // ----------------------------------------------------------

  expo.web ??= {};

  expo.web.favicon = branding.icon;

  // ----------------------------------------------------------
  // EAS
  // ----------------------------------------------------------

  expo.extra ??= {};

  // Hapus EAS Project ID aplikasi asal.
  delete expo.extra.eas;

  if (expo.updates) {
    delete expo.updates.url;
  }

  // ----------------------------------------------------------
  // Splash Screen Plugin
  // ----------------------------------------------------------

  const splashOptions = {
    backgroundColor,
    image: branding.splashImage,
    imageWidth: 120,
  };

  expo.plugins ??= [];

  const splashIndex = expo.plugins.findIndex(
    (plugin) =>
      plugin === 'expo-splash-screen' ||
      (
        Array.isArray(plugin) &&
        plugin[0] === 'expo-splash-screen'
      )
  );

  if (splashIndex >= 0) {
    const oldPlugin = expo.plugins[splashIndex];

    const oldOptions = Array.isArray(oldPlugin)
      ? oldPlugin[1]
      : {};

    expo.plugins[splashIndex] = [
      'expo-splash-screen',
      {
        ...oldOptions,
        ...splashOptions,
      },
    ];
  } else {
    expo.plugins.push([
      'expo-splash-screen',
      splashOptions,
    ]);
  }

  writeJson(appJsonPath, appJson);

  // ==========================================================
  // 9. GENERATE app.config.ts
  // ==========================================================

  const dynamicExpoConfig = String.raw`
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
`.trimStart();

  fs.writeFileSync(
    path.join(destination, 'app.config.ts'),
    dynamicExpoConfig,
    'utf8'
  );

  // ==========================================================
  // 10. GENERATE DYNAMIC UPDATE SERVICE
  // ==========================================================

  const updateService = String.raw`
import * as Application from 'expo-application';
import Constants from 'expo-constants';

type GithubAsset = {
  name: string;
  browser_download_url: string;
};

type GithubRelease = {
  tag_name: string;
  draft: boolean;
  prerelease: boolean;
  assets: GithubAsset[];
};

export type AppUpdateInfo = {
  currentVersion: string;
  latestVersion: string | null;
  hasUpdate: boolean;
  downloadUrl: string | null;
  prerelease: boolean;
};

const settings =
  Constants.expoConfig?.extra?.project;

const RELEASE_OWNER = String(
  settings?.releaseOwner ?? ''
).trim();

const RELEASE_REPO = String(
  settings?.releaseRepository ?? ''
).trim();

function normalize(value: string): string {
  return value.trim().replace(/^v/i, '');
}

function parts(value: string): number[] | null {
  const version = normalize(value);

  return /^\d+\.\d+\.\d+$/.test(version)
    ? version.split('.').map(Number)
    : null;
}

function compare(a: string, b: string): number {
  const left = parts(a);
  const right = parts(b);

  if (!left || !right) {
    return 0;
  }

  for (let i = 0; i < 3; i++) {
    if (left[i] !== right[i]) {
      return left[i] - right[i];
    }
  }

  return 0;
}

export function getInstalledVersion(): string {
  return (
    Application.nativeApplicationVersion ??
    Constants.expoConfig?.version ??
    '0.0.0'
  );
}

export async function checkForAppUpdate():
  Promise<AppUpdateInfo> {
  const currentVersion = getInstalledVersion();

  if (!RELEASE_OWNER || !RELEASE_REPO) {
    throw new Error(
      'GitHub Releases belum dikonfigurasi.'
    );
  }

  const api =
    'https://api.github.com/repos/' +
    encodeURIComponent(RELEASE_OWNER) + '/' +
    encodeURIComponent(RELEASE_REPO) +
    '/releases?per_page=30';

  const response = await fetch(api, {
    headers: {
      Accept: 'application/vnd.github+json',
    },
  });

  if (!response.ok) {
    throw new Error(
      'GitHub Releases HTTP ' + response.status
    );
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error(
      'Respons GitHub tidak valid.'
    );
  }

  const candidates = (data as GithubRelease[])
    .filter((release) =>
      !release.draft &&
      parts(release.tag_name) !== null &&
      Array.isArray(release.assets) &&
      release.assets.some((asset) =>
        asset.name.toLowerCase().endsWith('.apk')
      )
    )
    .sort((a, b) =>
      compare(b.tag_name, a.tag_name)
    );

  const latest = candidates[0];

  if (!latest) {
    return {
      currentVersion,
      latestVersion: null,
      hasUpdate: false,
      downloadUrl: null,
      prerelease: false,
    };
  }

  const apk = latest.assets.find((asset) =>
    asset.name.toLowerCase().endsWith('.apk')
  );

  return {
    currentVersion,
    latestVersion: normalize(latest.tag_name),

    hasUpdate:
      compare(
        latest.tag_name,
        currentVersion
      ) > 0,

    downloadUrl:
      apk?.browser_download_url ?? null,

    prerelease: latest.prerelease,
  };
}
`.trimStart();

  const serviceFile = path.join(
    destination,
    'src',
    'services',
    'app-update.ts'
  );

  fs.mkdirSync(
    path.dirname(serviceFile),
    { recursive: true }
  );

  fs.writeFileSync(
    serviceFile,
    updateService,
    'utf8'
  );

  // ==========================================================
  // 11. GENERATE AUTO UPDATE CHECKER
  // ==========================================================

  const autoCheckerSource = String.raw`
import { useEffect } from 'react';

import {
  Alert,
  Linking,
  Platform,
} from 'react-native';

import Constants from 'expo-constants';

import {
  checkForAppUpdate,
} from '@/services/app-update';

export default function AutoUpdateChecker() {
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    let cancelled = false;

    const appName = String(
      Constants.expoConfig?.extra?.project?.appName ??
      Constants.expoConfig?.name ??
      'Aplikasi'
    );

    async function check() {
      try {
        const update =
          await checkForAppUpdate();

        if (
          cancelled ||
          !update.hasUpdate ||
          !update.downloadUrl
        ) {
          return;
        }

        const url = update.downloadUrl;

        Alert.alert(
          'Pembaruan Tersedia',
          appName + ' v' +
            update.latestVersion +
            ' tersedia.\n' +
            'Versi terpasang: v' +
            update.currentVersion,

          [
            {
              text: 'Nanti',
              style: 'cancel',
            },
            {
              text: 'Update Sekarang',
              onPress: () => {
                Linking.openURL(url).catch(() => {
                  Alert.alert(
                    'Gagal',
                    'Tidak dapat membuka tautan APK.'
                  );
                });
              },
            },
          ],

          {
            cancelable: true,
          }
        );
      } catch {
        // Ketika offline, aplikasi tetap berjalan.
      }
    }

    void check();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
`.trimStart();

  const autoCheckerFile = path.join(
    destination,
    'src',
    'components',
    'auto-update-checker.tsx'
  );

  fs.mkdirSync(
    path.dirname(autoCheckerFile),
    { recursive: true }
  );

  fs.writeFileSync(
    autoCheckerFile,
    autoCheckerSource,
    'utf8'
  );

  // ==========================================================
  // 12. UPDATE package.json
  // ==========================================================

  const packageFile = path.join(
    destination,
    'package.json'
  );

  const packageJson = JSON.parse(
    fs.readFileSync(packageFile, 'utf8')
  );

  packageJson.name = appKey;
  packageJson.version = '1.0.0';

  writeJson(packageFile, packageJson);

  // ==========================================================
  // 13. UPDATE package-lock.json
  // ==========================================================

  const lockFile = path.join(
    destination,
    'package-lock.json'
  );

  if (fs.existsSync(lockFile)) {
    const lock = JSON.parse(
      fs.readFileSync(lockFile, 'utf8')
    );

    lock.name = appKey;
    lock.version = '1.0.0';

    if (lock.packages?.['']) {
      lock.packages[''].name = appKey;
      lock.packages[''].version = '1.0.0';
    }

    writeJson(lockFile, lock);
  }

  // ==========================================================
  // 14. GENERATE UNIVERSAL GITHUB ACTIONS
  // ==========================================================

  const workflowDirectory = path.join(
    destination,
    '.github',
    'workflows'
  );

  fs.mkdirSync(
    workflowDirectory,
    {
      recursive: true,
    }
  );

  fs.copyFileSync(
    workflowTemplate,
    path.join(
      workflowDirectory,
      'release-android.yml'
    )
  );

  // ==========================================================
  // 15. GENERATOR RESULT
  // ==========================================================

  console.log('');
  console.log('========================================');
  console.log(' DEBIYAN PROJECT GENERATOR');
  console.log('========================================');

  console.log('');
  console.log('Project created successfully.');
  console.log('');

  console.log('Brand      : Debiyan');
  console.log('App        :', appName);
  console.log('App Key    :', appKey);
  console.log('Slug       :', slug);

  console.log('Package    :', applicationId);
  console.log('Database   :', databaseName);

  console.log('Primary    :', primaryColor);
  console.log('Background :', backgroundColor);

  console.log(
    'Icon       :',
    iconSource ?? 'Starter kit default'
  );

  console.log('Version    : 1.0.0');
  console.log('Folder     :', destination);
  console.log('Workflow   : generated');
  console.log('EAS Project: not configured');

  console.log('');
  console.log('Selanjutnya:');

  console.log(`cd /d "${destination}"`);
  console.log('npm ci');
  console.log('npx expo config --type public');
  console.log('npx tsc --noEmit');
  console.log('npx expo start --web --clear');
  console.log('npx eas-cli@latest init');

  console.log('');
} catch (error) {
  // Hanya hapus folder baru hasil proses generator.
  // Project utama dan project lama tidak diubah.
  fs.rmSync(destination, {
    recursive: true,
    force: true,
  });

  throw error;
}
