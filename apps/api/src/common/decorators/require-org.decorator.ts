import { SetMetadata } from '@nestjs/common';

export const REQUIRE_ORG_KEY = 'requireOrg';
export const RequireOrg = () => SetMetadata(REQUIRE_ORG_KEY, true);
