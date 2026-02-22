import { ConfigService } from '@nestjs/config';
import { OrganizationLogoStorageService } from './organization-logo-storage.service';

function createConfigService(): ConfigService {
  const gcsCredentials = JSON.stringify({
    client_email: 'uploader@demo-project.iam.gserviceaccount.com',
    private_key:
      '-----BEGIN PRIVATE KEY-----\\ndemo\\n-----END PRIVATE KEY-----\\n',
  });

  return {
    get: jest.fn((key: string) => {
      if (key === 'GCP_GCS_PROJECT_ID') return 'demo-project';
      if (key === 'GCP_GCS_CREDENTIALS') return gcsCredentials;
      if (key === 'GCP_GCS_BUCKET') return 'demo-bucket';
      return undefined;
    }),
  } as unknown as ConfigService;
}

describe('OrganizationLogoStorageService', () => {
  it('reuses signed URL from cache for the same object path', async () => {
    const service = new OrganizationLogoStorageService(createConfigService());

    const getSignedUrl = jest
      .fn<Promise<[string]>, []>()
      .mockResolvedValueOnce([
        'https://storage.googleapis.com/demo-bucket/logo-1',
      ])
      .mockResolvedValueOnce([
        'https://storage.googleapis.com/demo-bucket/logo-2',
      ]);
    const file = jest.fn(() => ({ getSignedUrl }));
    const bucket = jest.fn(() => ({ file }));

    (
      service as unknown as { gcsStorage: { bucket: typeof bucket } }
    ).gcsStorage = {
      bucket,
    };

    const first = await service.toSignedLogoUrl('org-logos/org-1/logo.png');
    const second = await service.toSignedLogoUrl('org-logos/org-1/logo.png');

    expect(first).toBe('https://storage.googleapis.com/demo-bucket/logo-1');
    expect(second).toBe('https://storage.googleapis.com/demo-bucket/logo-1');
    expect(getSignedUrl).toHaveBeenCalledTimes(1);
  });

  it('returns null when stored logo value is empty', async () => {
    const service = new OrganizationLogoStorageService(createConfigService());

    await expect(service.toSignedLogoUrl(null)).resolves.toBeNull();
    await expect(service.toSignedLogoUrl(undefined)).resolves.toBeNull();
    await expect(service.toSignedLogoUrl('')).resolves.toBeNull();
  });
});
