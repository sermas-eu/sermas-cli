export interface KeycloakJwtTokenDto {
  exp: number;
  iat: number;
  jti: string;
  iss: string;
  aud: string;
  sub: string;
  typ: string;
  azp: string;
  acr: string;
  "allowed-origins": string[];
  realm_access: KeycloakJwtTokenRealmAccess;
  resource_access: KeycloakJwtTokenResourceAccess;
  scope: string;
  email_verified: boolean;
  clientId: string;
  clientHost: string;
  preferred_username: string;
  clientAddress: string;
}

export interface KeycloakJwtTokenRealmAccess {
  roles: string[];
}

export interface KeycloakJwtTokenResourceAccess
  extends Record<string, KeycloakJwtTokenRealmAccess> {
  account: KeycloakJwtTokenRealmAccess;
}
