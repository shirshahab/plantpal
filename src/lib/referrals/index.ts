import { saveUserProfile, loadUserProfile } from "@/lib/profile/user-profile";
import { readLocalJson } from "@/lib/storage/safe-local-storage";
import { grantReferralTrial } from "@/lib/referrals/referral-trial";
import { trackEvent } from "@/lib/analytics/track";

export const REFERRAL_PENDING_KEY = "plantpal-pending-referral";
export const REFERRAL_STORAGE_KEY = "plantpal-referrals";

export interface ReferralRecord {
  code: string;
  redeemedBy: string[];
  trialGrantedAt: string | null;
  referrerTrialPending?: number;
}

function loadReferrals(): Record<string, ReferralRecord> {
  if (typeof window === "undefined") return {};
  return readLocalJson(REFERRAL_STORAGE_KEY, {} as Record<string, ReferralRecord>);
}

function saveReferrals(map: Record<string, ReferralRecord>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(map));
}

function randomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function getOrCreateReferralCode(): string {
  const profile = loadUserProfile();
  if (profile.referralCode) return profile.referralCode;

  const map = loadReferrals();
  let code = randomCode();
  while (map[code]) code = randomCode();

  saveUserProfile({ referralCode: code });
  map[code] = { code, redeemedBy: [], trialGrantedAt: null };
  saveReferrals(map);
  return code;
}

export function getReferralLink(code: string): string {
  if (typeof window === "undefined") {
    return `https://getplantpal.com/login?ref=${code}`;
  }
  return `${window.location.origin}/login?ref=${code}`;
}

export function capturePendingReferral(code: string | null): void {
  if (typeof window === "undefined" || !code) return;
  const normalized = code.trim().toUpperCase();
  if (normalized.length < 6) return;
  sessionStorage.setItem(REFERRAL_PENDING_KEY, normalized);
}

export function getPendingReferral(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(REFERRAL_PENDING_KEY);
}

export function clearPendingReferral(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(REFERRAL_PENDING_KEY);
}

export interface ReferralRedeemResult {
  ok: boolean;
  message: string;
  trialGranted: boolean;
}

/** Redeem a referral when a new user completes onboarding. Grants trial to both parties. */
export function redeemReferral(referrerCode: string, newUserId: string): ReferralRedeemResult {
  const code = referrerCode.trim().toUpperCase();
  const profile = loadUserProfile();

  if (profile.referralCode === code) {
    return { ok: false, message: "You cannot use your own referral code.", trialGranted: false };
  }

  const map = loadReferrals();
  const record = map[code];
  if (!record) {
    return { ok: false, message: "Invalid referral code.", trialGranted: false };
  }

  if (record.redeemedBy.includes(newUserId)) {
    return { ok: false, message: "Referral already redeemed.", trialGranted: false };
  }

  record.redeemedBy.push(newUserId);
  record.trialGrantedAt = new Date().toISOString();
  record.referrerTrialPending = (record.referrerTrialPending ?? 0) + 1;
  map[code] = record;
  saveReferrals(map);

  saveUserProfile({ referredBy: code });
  grantReferralTrial(7, "referral_invitee");
  trackEvent("referral_redeemed", { role: "invitee", code });

  return {
    ok: true,
    message: "Thanks for using a referral link. Subscribe in the app to unlock Pro.",
    trialGranted: false,
  };
}

/** Grant pending referrer trial credits when the code owner opens the app. */
export function claimReferrerTrialCredits(): void {
  const profile = loadUserProfile();
  if (!profile.referralCode) return;

  const map = loadReferrals();
  const record = map[profile.referralCode];
  if (!record?.referrerTrialPending || record.referrerTrialPending <= 0) return;

  grantReferralTrial(7, "referral_referrer");
  record.referrerTrialPending -= 1;
  map[profile.referralCode] = record;
  saveReferrals(map);
}

export function getReferralStats(code: string): { invites: number } {
  const map = loadReferrals();
  const record = map[code];
  return { invites: record?.redeemedBy.length ?? 0 };
}
