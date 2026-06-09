import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { getProjectRefFromUrl } from "./config";

const PLANT_PHOTOS_BUCKET = "plant-photos";
const PUBLIC_PROBE_PATH = ".__plantpal_setup_probe__";

export interface StorageBucketProbeDebug {
  projectHost: string | null;
  checkMethod: string;
  storageError: string | null;
  bucketsReturned: string[];
  /** Extra detail for troubleshooting — never includes keys. */
  details: {
    listBucketsError: string | null;
    getBucketError: string | null;
    publicProbeStatus: number | null;
    publicProbeMessage: string | null;
    usedServiceRole: boolean;
  };
}

export interface StorageBucketProbeResult {
  exists: boolean;
  debug: StorageBucketProbeDebug;
}

function hostnameFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return getProjectRefFromUrl(url)
      ? `${getProjectRefFromUrl(url)}.supabase.co`
      : null;
  }
}

function parseStorageJsonMessage(body: string): string {
  try {
    const parsed = JSON.parse(body) as { message?: string; error?: string };
    return parsed.message ?? parsed.error ?? body;
  } catch {
    return body.slice(0, 300);
  }
}

/**
 * Public buckets return "Object not found" for a missing object path.
 * Missing buckets return "Bucket not found" — works with anon key, no sign-in.
 */
async function probePublicBucketObject(
  supabaseUrl: string,
  bucketId: string
): Promise<{ exists: boolean; status: number; message: string }> {
  const probeUrl = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${bucketId}/${PUBLIC_PROBE_PATH}`;
  const res = await fetch(probeUrl, { cache: "no-store" });
  const body = await res.text();
  const message = parseStorageJsonMessage(body);

  if (/bucket not found/i.test(message)) {
    return { exists: false, status: res.status, message };
  }

  if (/object not found|not_found/i.test(message)) {
    return { exists: true, status: res.status, message };
  }

  // Unexpected response — do not treat as missing bucket.
  return { exists: false, status: res.status, message };
}

export async function probePlantPhotosBucket(
  supabase: SupabaseClient,
  options: { url: string }
): Promise<StorageBucketProbeResult> {
  const projectHost = hostnameFromUrl(options.url);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  let listBucketsError: string | null = null;
  let bucketsReturned: string[] = [];
  let getBucketError: string | null = null;
  let usedServiceRole = false;

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    listBucketsError = listError.message;
  }
  bucketsReturned = buckets?.map((b) => b.id) ?? [];

  if (bucketsReturned.includes(PLANT_PHOTOS_BUCKET)) {
    return {
      exists: true,
      debug: {
        projectHost,
        checkMethod: "storage.listBuckets()",
        storageError: null,
        bucketsReturned,
        details: {
          listBucketsError,
          getBucketError: null,
          publicProbeStatus: null,
          publicProbeMessage: null,
          usedServiceRole: false,
        },
      },
    };
  }

  if (serviceRoleKey && options.url) {
    usedServiceRole = true;
    const admin = createClient(options.url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: adminBuckets, error: adminListError } =
      await admin.storage.listBuckets();
    if (adminListError) {
      listBucketsError = listBucketsError
        ? `${listBucketsError}; service role: ${adminListError.message}`
        : adminListError.message;
    } else {
      bucketsReturned = adminBuckets?.map((b) => b.id) ?? bucketsReturned;
      if (bucketsReturned.includes(PLANT_PHOTOS_BUCKET)) {
        return {
          exists: true,
          debug: {
            projectHost,
            checkMethod: "storage.listBuckets() (service role)",
            storageError: null,
            bucketsReturned,
            details: {
              listBucketsError,
              getBucketError: null,
              publicProbeStatus: null,
              publicProbeMessage: null,
              usedServiceRole: true,
            },
          },
        };
      }
    }

    const { data: bucket, error: adminGetError } =
      await admin.storage.getBucket(PLANT_PHOTOS_BUCKET);
    if (adminGetError) {
      getBucketError = adminGetError.message;
    } else if (bucket?.id === PLANT_PHOTOS_BUCKET) {
      return {
        exists: true,
        debug: {
          projectHost,
          checkMethod: "storage.getBucket() (service role)",
          storageError: null,
          bucketsReturned,
          details: {
            listBucketsError,
            getBucketError: null,
            publicProbeStatus: null,
            publicProbeMessage: null,
            usedServiceRole: true,
          },
        },
      };
    }
  } else {
    const { error: getError } = await supabase.storage.getBucket(PLANT_PHOTOS_BUCKET);
    if (getError) {
      getBucketError = getError.message;
    }
  }

  const publicProbe = await probePublicBucketObject(options.url, PLANT_PHOTOS_BUCKET);
  if (publicProbe.exists) {
    return {
      exists: true,
      debug: {
        projectHost,
        checkMethod: "GET /storage/v1/object/public/{bucket}/… (anon)",
        storageError: listBucketsError,
        bucketsReturned,
        details: {
          listBucketsError,
          getBucketError,
          publicProbeStatus: publicProbe.status,
          publicProbeMessage: publicProbe.message,
          usedServiceRole,
        },
      },
    };
  }

  const storageError =
    publicProbe.message ||
    getBucketError ||
    listBucketsError ||
    (bucketsReturned.length === 0
      ? "listBuckets() returned an empty array (anon key cannot list buckets)."
      : null);

  return {
    exists: false,
    debug: {
      projectHost,
      checkMethod: "GET /storage/v1/object/public/{bucket}/… (anon)",
      storageError,
      bucketsReturned,
      details: {
        listBucketsError,
        getBucketError,
        publicProbeStatus: publicProbe.status,
        publicProbeMessage: publicProbe.message,
        usedServiceRole,
      },
    },
  };
}
