import { createHmac } from "crypto";
import { env } from "../config/env";

interface SignParams {
  path: string;
  timestamp: number;
  accessToken?: string;
  shopId?: string;
}

export function signShopeeRequest({ path, timestamp, accessToken, shopId }: SignParams): string {
  let baseString = `${env.shopeePartnerId}${path}${timestamp}`;
  if (accessToken) baseString += accessToken;
  if (shopId) baseString += shopId;

  return createHmac("sha256", env.shopeePartnerKey).update(baseString).digest("hex");
}

export function buildShopeeUrl(path: string, params: Record<string, string | number | undefined>, opts?: { accessToken?: string; shopId?: string }): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const sign = signShopeeRequest({ path, timestamp, accessToken: opts?.accessToken, shopId: opts?.shopId });

  const search = new URLSearchParams({
    partner_id: env.shopeePartnerId,
    timestamp: String(timestamp),
    sign,
  });
  if (opts?.accessToken) search.set("access_token", opts.accessToken);
  if (opts?.shopId) search.set("shop_id", opts.shopId);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }

  return `${env.shopeeBaseUrl}${path}?${search.toString()}`;
}
