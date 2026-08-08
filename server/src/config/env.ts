import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3333),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  cookieName: process.env.COOKIE_NAME ?? "ecomm_token",
  r2AccountId: required("R2_ACCOUNT_ID"),
  r2AccessKeyId: required("R2_ACCESS_KEY_ID"),
  r2SecretAccessKey: required("R2_SECRET_ACCESS_KEY"),
  r2BucketName: required("R2_BUCKET_NAME"),
  r2PublicUrl: required("R2_PUBLIC_URL"),
  shopeePartnerId: required("SHOPEE_PARTNER_ID"),
  shopeePartnerKey: required("SHOPEE_PARTNER_KEY"),
  shopeeRedirectUrl: process.env.SHOPEE_REDIRECT_URL ?? `${process.env.CLIENT_URL ?? "http://localhost:5173"}/shopee/callback`,
  shopeeBaseUrl: process.env.SHOPEE_BASE_URL ?? "https://partner.test-stable.shopeemobile.com",
};

export const isProduction = env.nodeEnv === "production";
