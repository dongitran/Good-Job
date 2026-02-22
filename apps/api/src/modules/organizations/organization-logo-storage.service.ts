import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;
const SIGNED_URL_TTL_MS = 15 * 60 * 1000;
const SIGNED_URL_REUSE_BUFFER_MS = 60 * 1000;
const MAX_SIGNED_URL_CACHE_SIZE = 500;
const ALLOWED_LOGO_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
]);

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
};

interface UploadLogoInput {
  orgId: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}

interface BucketObjectRef {
  bucket: string;
  objectPath: string;
}

interface GcsCredentials {
  client_email?: string;
  private_key?: string;
}

interface SignedUrlCacheEntry {
  url: string;
  expiresAt: number;
}

@Injectable()
export class OrganizationLogoStorageService {
  private readonly logger = new Logger(OrganizationLogoStorageService.name);

  private readonly gcsProjectId: string;
  private readonly gcsCredentialsRaw: string;
  private readonly gcsBucketName: string;
  private readonly gcsStorage: Storage;
  private readonly signedUrlCache = new Map<string, SignedUrlCacheEntry>();

  constructor(private readonly configService: ConfigService) {
    this.gcsProjectId = (
      this.configService.get<string>('GCP_GCS_PROJECT_ID') ?? ''
    ).trim();
    this.gcsCredentialsRaw = (
      this.configService.get<string>('GCP_GCS_CREDENTIALS') ?? ''
    ).trim();
    this.gcsBucketName = (
      this.configService.get<string>('GCP_GCS_BUCKET') ||
      (this.gcsProjectId ? `${this.gcsProjectId}-goodjob-assets` : '')
    ).trim();

    const credentials = this.parseCredentials(this.gcsCredentialsRaw);
    this.gcsStorage = new Storage({
      projectId: this.gcsProjectId,
      credentials,
    });
  }

  async uploadOrganizationLogo(input: UploadLogoInput): Promise<string> {
    this.validateLogoFile(input.mimeType, input.size);

    const extension = EXTENSION_BY_MIME_TYPE[input.mimeType];
    const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
    const objectPath = path.posix.join('org-logos', input.orgId, filename);
    return this.uploadToGcs(objectPath, input);
  }

  async toSignedLogoUrl(
    storedValue: string | null | undefined,
  ): Promise<string | null> {
    if (!storedValue) return null;

    const ref = this.resolveBucketObjectRef(storedValue);
    if (!ref) {
      return storedValue;
    }

    const now = Date.now();
    const cacheKey = `${ref.bucket}/${ref.objectPath}`;
    const cached = this.signedUrlCache.get(cacheKey);
    if (cached && cached.expiresAt - now > SIGNED_URL_REUSE_BUFFER_MS) {
      return cached.url;
    }

    try {
      const [signedUrl] = await this.gcsStorage
        .bucket(ref.bucket)
        .file(ref.objectPath)
        .getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: now + SIGNED_URL_TTL_MS,
        });
      this.signedUrlCache.set(cacheKey, {
        url: signedUrl,
        expiresAt: now + SIGNED_URL_TTL_MS,
      });
      this.pruneSignedUrlCache(now);
      return signedUrl;
    } catch (error) {
      this.logger.warn(
        `Failed to sign logo URL "${storedValue}": ${String(error)}`,
      );
      return null;
    }
  }

  private validateLogoFile(mimeType: string, size: number): void {
    if (!ALLOWED_LOGO_MIME_TYPES.has(mimeType)) {
      throw new BadRequestException(
        'Unsupported image type. Please upload PNG or JPG.',
      );
    }

    if (size <= 0) {
      throw new BadRequestException('Logo file is empty.');
    }

    if (size > MAX_LOGO_SIZE_BYTES) {
      throw new BadRequestException('Logo file must be 2MB or smaller.');
    }
  }

  private parseCredentials(raw: string): GcsCredentials {
    const tryParse = (value: string): GcsCredentials | null => {
      try {
        const parsed = JSON.parse(value) as GcsCredentials;
        if (!parsed.client_email || !parsed.private_key) return null;
        return {
          client_email: parsed.client_email,
          private_key: parsed.private_key.replace(/\\n/g, '\n'),
        };
      } catch {
        return null;
      }
    };

    const parsedJson = tryParse(raw);
    if (parsedJson) return parsedJson;

    const parsedBase64 = tryParse(Buffer.from(raw, 'base64').toString('utf8'));
    if (parsedBase64) return parsedBase64;

    throw new InternalServerErrorException(
      'Invalid GCP_GCS_CREDENTIALS format.',
    );
  }

  private async uploadToGcs(
    objectPath: string,
    input: UploadLogoInput,
  ): Promise<string> {
    try {
      const bucket = this.gcsStorage.bucket(this.gcsBucketName);
      const file = bucket.file(objectPath);

      await file.save(input.buffer, {
        resumable: false,
        contentType: input.mimeType,
        metadata: {
          cacheControl: 'public, max-age=31536000, immutable',
        },
      });

      return objectPath;
    } catch (error) {
      this.logger.error(
        `Failed to upload organization logo to GCS: ${String(error)}`,
      );
      throw new InternalServerErrorException('Failed to upload logo.');
    }
  }

  private resolveBucketObjectRef(storedValue: string): BucketObjectRef | null {
    const raw = storedValue.trim();
    if (!raw) return null;

    if (raw.startsWith('gs://')) {
      const withoutScheme = raw.slice(5);
      const slashIndex = withoutScheme.indexOf('/');
      if (slashIndex <= 0) return null;
      const bucket = withoutScheme.slice(0, slashIndex);
      const objectPath = withoutScheme.slice(slashIndex + 1);
      return objectPath ? { bucket, objectPath } : null;
    }

    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      try {
        const url = new URL(raw);
        if (url.hostname === 'storage.googleapis.com') {
          const normalized = url.pathname.replace(/^\/+/, '');
          const slashIndex = normalized.indexOf('/');
          if (slashIndex <= 0) return null;
          const bucket = normalized.slice(0, slashIndex);
          const objectPath = decodeURIComponent(
            normalized.slice(slashIndex + 1),
          );
          return objectPath ? { bucket, objectPath } : null;
        }

        if (url.hostname.endsWith('.storage.googleapis.com')) {
          const bucket = url.hostname.replace(
            /\.storage\.googleapis\.com$/,
            '',
          );
          const objectPath = decodeURIComponent(
            url.pathname.replace(/^\/+/, ''),
          );
          return objectPath ? { bucket, objectPath } : null;
        }
      } catch {
        return null;
      }
      return null;
    }

    return {
      bucket: this.gcsBucketName,
      objectPath: raw.replace(/^\/+/, ''),
    };
  }

  private pruneSignedUrlCache(now: number): void {
    for (const [key, entry] of this.signedUrlCache.entries()) {
      if (entry.expiresAt <= now) {
        this.signedUrlCache.delete(key);
      }
    }

    if (this.signedUrlCache.size <= MAX_SIGNED_URL_CACHE_SIZE) return;

    const overflow = this.signedUrlCache.size - MAX_SIGNED_URL_CACHE_SIZE;
    let removed = 0;
    for (const key of this.signedUrlCache.keys()) {
      this.signedUrlCache.delete(key);
      removed += 1;
      if (removed >= overflow) break;
    }
  }
}
