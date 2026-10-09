import { databaseTlsOptions } from '../src/utils/database-tls';

describe('database TLS', () => {
  it('keeps the local non-TLS default', () => expect(databaseTlsOptions({})).toEqual({}));
  it('verifies external certificates by default', () => expect(databaseTlsOptions({ DB_TLS: 'true' })).toEqual({ ssl: { require: true, rejectUnauthorized: true } }));
  it('supports Render internal self-signed TLS only explicitly', () => expect(databaseTlsOptions({ DB_TLS: 'true', DB_TLS_REJECT_UNAUTHORIZED: 'false' })).toEqual({ ssl: { require: true, rejectUnauthorized: false } }));
  it('refuses accidental production database names in homologacao', () => expect(() => databaseTlsOptions({ APP_ENV: 'homologacao', DB_DATABASE: 'production', DB_USERNAME: 'production', DB_TLS: 'true' })).toThrow());
  it('requires TLS for homologacao', () => expect(() => databaseTlsOptions({ APP_ENV: 'homologacao', DB_DATABASE: 'sellou_homologacao', DB_USERNAME: 'sellou_homologacao' })).toThrow());
  it('rejects ambiguous boolean settings', () => expect(() => databaseTlsOptions({ DB_TLS: 'yes' })).toThrow());
});
