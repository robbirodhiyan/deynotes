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
