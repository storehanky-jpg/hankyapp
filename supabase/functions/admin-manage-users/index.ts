import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface UserRow {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface PermissionsRow {
  user_id: string;
  dashboard: string;
  recipe: string;
  chocolat: string;
  materials: string;
  charges: string;
  production: string;
  customers: string;
  bulksales: string;
  pricing: string;
  reports: string;
  history: string;
  settings: string;
  admin: string;
}

const PAGE_KEYS = [
  "dashboard", "recipe", "chocolat", "materials", "charges",
  "production", "customers", "bulksales", "pricing", "reports",
  "history", "settings", "admin",
] as const;

async function verifyAdmin(supabaseUrl: string, serviceRoleKey: string, authHeader: string | null) {
  if (!authHeader) return { ok: false, status: 401, error: "Non autorisé" };
  const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return { ok: false, status: 401, error: "Non autorisé" };

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: callerProfile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (!callerProfile || callerProfile.role !== "admin") {
    return { ok: false, status: 403, error: "Accès refusé. Administrateur uniquement." };
  }
  return { ok: true, adminClient, userId: userData.user.id };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "";

    // ── LOGIN HISTORY (records a login event) ──
    if (action === "login_history" && req.method === "POST") {
      const check = await verifyAdmin(supabaseUrl, serviceRoleKey, authHeader);
      if (!check.ok) {
        return new Response(JSON.stringify({ error: check.error }), {
          status: check.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const adminClient = check.adminClient!;
      const body = await req.json();
      const { user_id, email, device_info } = body;
      if (!user_id || !email) {
        return new Response(JSON.stringify({ error: "user_id et email requis" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error: logErr } = await adminClient.from("admin_login_history").insert({
        user_id, email, device_info: device_info || navigator.userAgent || "Unknown",
      });
      if (logErr) throw logErr;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── GET LOGIN HISTORY ──
    if (action === "login_history" && req.method === "GET") {
      const check = await verifyAdmin(supabaseUrl, serviceRoleKey, authHeader);
      if (!check.ok) {
        return new Response(JSON.stringify({ error: check.error }), {
          status: check.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const adminClient = check.adminClient!;
      const { data, error } = await adminClient
        .from("admin_login_history")
        .select("*")
        .order("login_time", { ascending: false })
        .limit(50);
      if (error) throw error;
      return new Response(JSON.stringify({ history: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── GET ACTION LOGS ──
    if (action === "action_logs" && req.method === "GET") {
      const check = await verifyAdmin(supabaseUrl, serviceRoleKey, authHeader);
      if (!check.ok) {
        return new Response(JSON.stringify({ error: check.error }), {
          status: check.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const adminClient = check.adminClient!;
      const { data, error } = await adminClient
        .from("admin_action_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return new Response(JSON.stringify({ logs: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── GET: list all users with profiles + permissions ──
    if (req.method === "GET" || action === "list") {
      const check = await verifyAdmin(supabaseUrl, serviceRoleKey, authHeader);
      if (!check.ok) {
        return new Response(JSON.stringify({ error: check.error }), {
          status: check.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const adminClient = check.adminClient!;

      const [{ data: profiles, error: pErr }, { data: perms, error: permErr }] = await Promise.all([
        adminClient.from("profiles").select("*").order("created_at", { ascending: true }),
        adminClient.from("user_permissions").select("*"),
      ]);
      if (pErr) throw pErr;
      if (permErr) throw permErr;

      const permMap = new Map<string, PermissionsRow>();
      (perms || []).forEach((p: PermissionsRow) => permMap.set(p.user_id, p));

      const users = (profiles || []).map((p: UserRow) => ({
        ...p,
        permissions: permMap.get(p.id) || null,
      }));

      return new Response(JSON.stringify({ users }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── POST: create user / reset password / log action ──
    if (req.method === "POST") {
      const check = await verifyAdmin(supabaseUrl, serviceRoleKey, authHeader);
      if (!check.ok) {
        return new Response(JSON.stringify({ error: check.error }), {
          status: check.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const adminClient = check.adminClient!;
      const body = await req.json();
      const { email, password, display_name, role, permissions, action: bodyAction } = body;

      if (bodyAction === "create") {
        if (!email || !password || typeof password !== "string" || password.length < 6) {
          return new Response(JSON.stringify({ error: "Email et mot de passe d'au moins 6 caractères requis" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
          email, password, email_confirm: true,
        });
        if (createErr) {
          return new Response(JSON.stringify({ error: createErr.message }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const userId = newUser.user!.id;

        // Ensure the profile exists even when the auth trigger is unavailable
        const { error: profErr } = await adminClient.from("profiles").upsert({
          id: userId,
          email,
          display_name: display_name || email.split('@')[0],
          role: role || "user",
          is_active: true,
        }, { onConflict: "id" });
        if (profErr) throw profErr;

        // Insert permissions (upsert in case a row was backfilled)
        const permInsert: Record<string, unknown> = { user_id: userId };
        if (permissions) {
          PAGE_KEYS.forEach(k => {
            permInsert[k] = permissions[k] || "none";
          });
        } else {
          PAGE_KEYS.forEach(k => { permInsert[k] = "none"; });
        }
        const { error: permErr } = await adminClient.from("user_permissions").upsert(permInsert);
        if (permErr) throw permErr;

        // Log the action
        await adminClient.from("admin_action_logs").insert({
          user_id: check.userId,
          user_email: (await adminClient.from("profiles").select("email").eq("id", check.userId).maybeSingle()).data?.email || "admin",
          action_type: "create",
          action_detail: `Création de l'utilisateur ${email}`,
          page: "admin",
        });

        return new Response(JSON.stringify({ success: true, user_id: userId }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (bodyAction === "reset_password") {
        if (!email || !password) {
          return new Response(JSON.stringify({ error: "Email et mot de passe requis" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data: profile } = await adminClient
          .from("profiles").select("id").eq("email", email).maybeSingle();
        if (!profile) {
          return new Response(JSON.stringify({ error: "Utilisateur introuvable" }), {
            status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { error: updateErr } = await adminClient.auth.admin.updateUserById(profile.id, { password });
        if (updateErr) {
          return new Response(JSON.stringify({ error: updateErr.message }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        await adminClient.from("admin_action_logs").insert({
          user_id: check.userId,
          user_email: (await adminClient.from("profiles").select("email").eq("id", check.userId).maybeSingle()).data?.email || "admin",
          action_type: "update",
          action_detail: `Réinitialisation du mot de passe pour ${email}`,
          page: "admin",
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (bodyAction === "log_action") {
        // Generic action logger callable from frontend
        const { user_id, user_email, action_type, action_detail, page } = body;
        if (!user_id || !action_type) {
          return new Response(JSON.stringify({ error: "user_id et action_type requis" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { error: logErr } = await adminClient.from("admin_action_logs").insert({
          user_id, user_email: user_email || "unknown",
          action_type, action_detail: action_detail || "",
          page: page || "",
        });
        if (logErr) throw logErr;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── PUT: update user profile / permissions / toggle active ──
    if (req.method === "PUT") {
      const check = await verifyAdmin(supabaseUrl, serviceRoleKey, authHeader);
      if (!check.ok) {
        return new Response(JSON.stringify({ error: check.error }), {
          status: check.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const adminClient = check.adminClient!;
      const body = await req.json();
      const { user_id, is_active, display_name, role, permissions } = body;

      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id requis" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update profile
      const profileUpdates: Record<string, unknown> = {};
      if (typeof is_active === "boolean") profileUpdates.is_active = is_active;
      if (display_name !== undefined) profileUpdates.display_name = display_name;
      if (role) profileUpdates.role = role;
      if (Object.keys(profileUpdates).length > 0) {
        const { error: pErr } = await adminClient.from("profiles").update(profileUpdates).eq("id", user_id);
        if (pErr) throw pErr;
      }

      // Update permissions
      if (permissions) {
        const permUpsert: Record<string, unknown> = { user_id, updated_at: new Date().toISOString() };
        PAGE_KEYS.forEach(k => {
          permUpsert[k] = permissions[k] || "none";
        });
        const { error: permErr } = await adminClient.from("user_permissions").upsert(permUpsert);
        if (permErr) throw permErr;
      }

      // Log the action
      const adminEmail = (await adminClient.from("profiles").select("email").eq("id", check.userId).maybeSingle()).data?.email || "admin";
      let detail = "Modification utilisateur";
      if (typeof is_active === "boolean") detail = is_active ? "Activation utilisateur" : "Désactivation utilisateur";
      else if (role) detail = `Changement de rôle: ${role}`;
      else if (permissions) detail = "Modification des permissions";
      await adminClient.from("admin_action_logs").insert({
        user_id: check.userId,
        user_email: adminEmail,
        action_type: "update",
        action_detail: detail,
        page: "admin",
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── DELETE: remove a user ──
    if (req.method === "DELETE") {
      const check = await verifyAdmin(supabaseUrl, serviceRoleKey, authHeader);
      if (!check.ok) {
        return new Response(JSON.stringify({ error: check.error }), {
          status: check.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const adminClient = check.adminClient!;
      const body = await req.json();
      const { user_id } = body;

      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id requis" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (user_id === check.userId) {
        return new Response(JSON.stringify({ error: "Vous ne pouvez pas supprimer votre propre compte" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: targetProfile } = await adminClient.from("profiles").select("email").eq("id", user_id).maybeSingle();
      const { error: delErr } = await adminClient.auth.admin.deleteUser(user_id);
      if (delErr) {
        return new Response(JSON.stringify({ error: delErr.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const adminEmail = (await adminClient.from("profiles").select("email").eq("id", check.userId).maybeSingle()).data?.email || "admin";
      await adminClient.from("admin_action_logs").insert({
        user_id: check.userId,
        user_email: adminEmail,
        action_type: "delete",
        action_detail: `Suppression de l'utilisateur ${targetProfile?.email || user_id}`,
        page: "admin",
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Action non reconnue" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
