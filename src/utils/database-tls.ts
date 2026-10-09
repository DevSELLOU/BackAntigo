export function databaseTlsOptions(env: Record<string, unknown>) {
  const tls = env.DB_TLS ?? 'false';
  const verify = env.DB_TLS_REJECT_UNAUTHORIZED ?? 'true';
  if (!['true', 'false'].includes(String(tls)) || !['true', 'false'].includes(String(verify))) {
    throw new Error('DB_TLS and DB_TLS_REJECT_UNAUTHORIZED must be true or false');
  }
  if (env.APP_ENV === 'homologacao') {
    if (env.DB_DATABASE !== 'sellou_homologacao' || env.DB_USERNAME !== 'sellou_homologacao' || tls !== 'true') {
      throw new Error('Homologacao requires its dedicated database/user and TLS');
    }
  }
  return tls === 'true'
    ? { ssl: { require: true, rejectUnauthorized: verify === 'true', ...(env.DB_TLS_CA ? { ca: String(env.DB_TLS_CA) } : {}) } }
    : {};
}
