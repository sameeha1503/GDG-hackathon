/**
 * Mock Supabase Fetch Handler
 *
 * Intercepts requests when SUPABASE_URL is a placeholder (e.g. your-project-id.supabase.co)
 * or when network fetch fails, allowing full authentication and data operations
 * without needing an external cloud database.
 */

function toBase64(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "utf-8").toString("base64");
  }
  if (typeof btoa !== "undefined") {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))));
  }
  return "";
}

function fromBase64(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "base64").toString("utf-8");
  }
  if (typeof atob !== "undefined") {
    return decodeURIComponent(Array.prototype.map.call(atob(str), (c: string) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join(""));
  }
  return "";
}

export function b64Url(str: string): string {
  return toBase64(str).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export function createMockJwt(user: { id: string; email: string; user_metadata?: Record<string, any> }): string {
  const header = b64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = b64Url(
    JSON.stringify({
      sub: user.id,
      aud: "authenticated",
      role: "authenticated",
      email: user.email,
      user_metadata: user.user_metadata || {},
      app_metadata: { provider: "email", providers: ["email"] },
      exp: now + 365 * 24 * 3600,
      iat: now,
    }),
  );
  const sig = b64Url("mock_signature_for_local_environment");
  return `${header}.${payload}.${sig}`;
}

export function decodeMockJwt(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || !parts[1]) return null;
    let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    return JSON.parse(fromBase64(b64));
  } catch {
    return null;
  }
}

// In-memory store
interface MockDb {
  users: Array<{
    id: string;
    email: string;
    password?: string;
    user_metadata: Record<string, any>;
  }>;
  profiles: Array<Record<string, any>>;
  user_roles: Array<Record<string, any>>;
  patients: Array<Record<string, any>>;
  care_records: Array<Record<string, any>>;
  blood_donors: Array<Record<string, any>>;
  reminder_log: Array<Record<string, any>>;
}

const STORAGE_KEY = "raktlink_mock_db";

function getInitialDb(): MockDb {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  return {
    users: [],
    profiles: [],
    user_roles: [],
    patients: [],
    care_records: [],
    blood_donors: [],
    reminder_log: [],
  };
}

let db: MockDb = getInitialDb();

function saveDb() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
      // ignore
    }
  }
}

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function handleMockSupabaseRequest(
  urlStr: string,
  init?: RequestInit,
): Promise<Response | null> {
  const url = new URL(urlStr);
  const pathname = url.pathname;
  const method = (init?.method || "GET").toUpperCase();

  let body: any = null;
  if (init?.body && typeof init.body === "string") {
    try {
      body = JSON.parse(init.body);
    } catch {
      body = init.body;
    }
  }

  // --- Auth endpoints ---
  if (pathname.includes("/auth/v1/signup")) {
    const email = body?.email?.toLowerCase().trim() || "user@raktlink.org";
    const password = body?.password || "";
    const meta = body?.data || body?.options?.data || {};

    let user = db.users.find((u) => u.email === email);
    if (!user) {
      user = {
        id: generateId(),
        email,
        password,
        user_metadata: meta,
      };
      db.users.push(user);
    } else {
      user.user_metadata = { ...user.user_metadata, ...meta };
    }

    // Also register profile & role
    const existingProfile = db.profiles.find((p) => p["id"] === user.id);
    if (!existingProfile) {
      db.profiles.push({
        id: user.id,
        full_name: meta.full_name || "Health worker",
        facility: meta.facility || "Field facility",
        updated_at: new Date().toISOString(),
      });
    }

    const existingRole = db.user_roles.find((r) => r["user_id"] === user.id);
    if (!existingRole) {
      db.user_roles.push({
        id: generateId(),
        user_id: user.id,
        role: meta.role || "health_worker",
      });
    }

    saveDb();

    const token = createMockJwt(user);
    const now = Math.floor(Date.now() / 1000);

    const responsePayload = {
      access_token: token,
      token_type: "bearer",
      expires_in: 31536000,
      expires_at: now + 31536000,
      refresh_token: "mock-refresh-" + user.id,
      user: {
        id: user.id,
        aud: "authenticated",
        role: "authenticated",
        email: user.email,
        user_metadata: user.user_metadata,
        app_metadata: { provider: "email", providers: ["email"] },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      session: {
        access_token: token,
        token_type: "bearer",
        expires_in: 31536000,
        expires_at: now + 31536000,
        refresh_token: "mock-refresh-" + user.id,
        user: {
          id: user.id,
          aud: "authenticated",
          role: "authenticated",
          email: user.email,
          user_metadata: user.user_metadata,
          app_metadata: { provider: "email", providers: ["email"] },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (pathname.includes("/auth/v1/token")) {
    const email = body?.email?.toLowerCase().trim() || "";
    let user = db.users.find((u) => u.email === email);
    if (!user) {
      // In local mode, auto-create to never block testing
      user = {
        id: generateId(),
        email: email || "worker@raktlink.org",
        user_metadata: { full_name: "Health worker", facility: "Local PHC", role: "health_worker" },
      };
      db.users.push(user);
      db.profiles.push({
        id: user.id,
        full_name: "Health worker",
        facility: "Local PHC",
        updated_at: new Date().toISOString(),
      });
      db.user_roles.push({
        id: generateId(),
        user_id: user.id,
        role: "health_worker",
      });
      saveDb();
    }

    const token = createMockJwt(user);
    const now = Math.floor(Date.now() / 1000);

    const responsePayload = {
      access_token: token,
      token_type: "bearer",
      expires_in: 31536000,
      expires_at: now + 31536000,
      refresh_token: "mock-refresh-" + user.id,
      user: {
        id: user.id,
        aud: "authenticated",
        role: "authenticated",
        email: user.email,
        user_metadata: user.user_metadata,
        app_metadata: { provider: "email", providers: ["email"] },
      },
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (pathname.includes("/auth/v1/user")) {
    const authHeader = (init?.headers as any)?.Authorization || (init?.headers as any)?.authorization || "";
    const token = authHeader.replace("Bearer ", "").trim();
    const claims = decodeMockJwt(token);

    const user = db.users.find((u) => u.id === claims?.sub) || {
      id: claims?.sub || "local-user",
      email: claims?.email || "worker@raktlink.org",
      user_metadata: claims?.user_metadata || {},
      aud: "authenticated",
      role: "authenticated",
    };

    return new Response(JSON.stringify(user), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (pathname.includes("/auth/v1/logout")) {
    return new Response("{}", {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // --- PostgREST tables (/rest/v1/:table) ---
  const restMatch = pathname.match(/\/rest\/v1\/([a-zA-Z0-9_]+)/);
  if (restMatch) {
    const table = restMatch[1] as keyof MockDb;
    if (!db[table]) {
      (db as any)[table] = [];
    }
    const items: Array<Record<string, any>> = db[table] as any;

    if (method === "GET") {
      let filtered = [...items];
      // Basic param matching: ?id=eq.X or ?user_id=eq.X
      url.searchParams.forEach((val, key) => {
        if (key === "select" || key === "order" || key === "limit") return;
        if (val.startsWith("eq.")) {
          const expected = val.slice(3);
          filtered = filtered.filter((row) => String(row[key]) === expected);
        }
      });

      return new Response(JSON.stringify(filtered), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (method === "POST") {
      const records = Array.isArray(body) ? body : [body];
      const inserted: any[] = [];
      for (const rec of records) {
        if (!rec) continue;
        const row = { ...rec };
        if (!row.id) row.id = generateId();
        // Check upsert
        const existingIdx = items.findIndex((i) => i["id"] === row.id);
        if (existingIdx >= 0) {
          items[existingIdx] = { ...items[existingIdx], ...row };
          inserted.push(items[existingIdx]);
        } else {
          items.push(row);
          inserted.push(row);
        }
      }
      saveDb();

      return new Response(JSON.stringify(inserted.length === 1 ? inserted[0] : inserted), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (method === "PATCH") {
      let updated: any[] = [];
      url.searchParams.forEach((val, key) => {
        if (val.startsWith("eq.")) {
          const expected = val.slice(3);
          items.forEach((row, idx) => {
            if (String(row[key]) === expected) {
              items[idx] = { ...row, ...body };
              updated.push(items[idx]);
            }
          });
        }
      });
      saveDb();

      return new Response(JSON.stringify(updated.length === 1 ? updated[0] : updated), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return null;
}
