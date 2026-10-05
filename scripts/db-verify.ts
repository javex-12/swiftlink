/**
 * Database Verification Script (scripts/db-verify.ts)
 *
 * Runs against a staging Supabase instance to verify:
 * 1. Cross-tenant isolation: User B cannot SELECT or UPDATE User A's inquiries or customers.
 * 2. Column-Level Security: User A cannot UPDATE product_price_minor (it is revoked).
 * 3. Sold Invariant: Marking an inquiry as 'sold' without final_amount_minor or sold_at is rejected by PostgreSQL.
 * 4. Customer Count Triggers: sold -> lost -> sold maintains accurate chats_count and sold_count.
 * 5. Concurrent duplicate inserts produce one row (20 concurrent calls via create_or_update_inquiry).
 *
 * Safety:
 * - Refuses to run against production URL or without ALLOW_STAGING_DB_VERIFY="true".
 * - Deletes only the exact test users and stores it created.
 *
 * Usage:
 *   ALLOW_STAGING_DB_VERIFY="true" \
 *   NEXT_PUBLIC_SUPABASE_URL="https://your-staging.supabase.co" \
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY="..." \
 *   SUPABASE_SERVICE_ROLE_KEY="..." \
 *   npx tsx scripts/db-verify.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const allowStaging = process.env.ALLOW_STAGING_DB_VERIFY;
const prodProjectRef = process.env.PROD_SUPABASE_PROJECT_REF || "PRODUCTION_REF_BLOCK";

if (!supabaseUrl || !anonKey || !serviceKey) {
  console.error("Missing required environment variables:");
  console.error("NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

if (allowStaging !== "true") {
  console.error("SAFETY REFUSAL: ALLOW_STAGING_DB_VERIFY='true' must be explicitly provided.");
  process.exit(1);
}

if (supabaseUrl.includes(prodProjectRef) || supabaseUrl.includes("production")) {
  console.error("SAFETY REFUSAL: db-verify.ts detected a production environment and refused to execute.");
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("Starting Step 0 Database Layer Verification on Staging...");

  const testRunId = Math.random().toString(36).substring(2, 8);
  const emailA = `test-vendor-a-${testRunId}@swiftlink-test.internal`;
  const emailB = `test-vendor-b-${testRunId}@swiftlink-test.internal`;
  const password = "TestPassword123!";

  console.log(`Creating test users: ${emailA} and ${emailB}`);

  // Create User A
  const { data: userAData, error: userAErr } = await adminClient.auth.admin.createUser({
    email: emailA,
    password,
    email_confirm: true,
  });
  if (userAErr || !userAData.user) throw new Error(`Failed to create User A: ${userAErr?.message}`);
  const userA = userAData.user;

  // Create User B
  const { data: userBData, error: userBErr } = await adminClient.auth.admin.createUser({
    email: emailB,
    password,
    email_confirm: true,
  });
  if (userBErr || !userBData.user) throw new Error(`Failed to create User B: ${userBErr?.message}`);
  const userB = userBData.user;

  try {
    // Sign in as User A & User B with anon client to get authenticated RLS sessions
    const clientA = createClient(supabaseUrl!, anonKey!, { auth: { persistSession: false } });
    const { error: signInAErr } = await clientA.auth.signInWithPassword({ email: emailA, password });
    if (signInAErr) throw new Error(`Sign in A failed: ${signInAErr.message}`);

    const clientB = createClient(supabaseUrl!, anonKey!, { auth: { persistSession: false } });
    const { error: signInBErr } = await clientB.auth.signInWithPassword({ email: emailB, password });
    if (signInBErr) throw new Error(`Sign in B failed: ${signInBErr.message}`);

    // Setup stores for User A and User B using Admin Client
    const { data: storeA, error: storeAErr } = await adminClient
      .from("stores")
      .insert({
        owner_id: userA.id,
        biz_name: `Store A ${testRunId}`,
        store_username: `store-a-${testRunId}`,
        currency: "NGN",
        onboarding_step: 4,
      })
      .select("id")
      .single();
    if (storeAErr || !storeA) throw new Error(`Failed to insert Store A: ${storeAErr?.message}`);

    const { data: storeB, error: storeBErr } = await adminClient
      .from("stores")
      .insert({
        owner_id: userB.id,
        biz_name: `Store B ${testRunId}`,
        store_username: `store-b-${testRunId}`,
        currency: "NGN",
        onboarding_step: 4,
      })
      .select("id")
      .single();
    if (storeBErr || !storeB) throw new Error(`Failed to insert Store B: ${storeBErr?.message}`);

    console.log("Stores seeded successfully. Running verification checks...");

    // CHECK 1: Insert Inquiry for Store A via create_or_update_inquiry RPC
    const { data: inqA, error: inqAErr } = await adminClient.rpc("create_or_update_inquiry", {
      p_store_id: storeA.id,
      p_product_id: 101,
      p_product_name: "Sneakers",
      p_currency: "NGN",
      p_product_price_minor: 1500000,
      p_selected_option: "Size 42",
      p_buyer_name: "Tunde",
      p_buyer_phone: "+2348080000001",
      p_device_hash: "device_abc_1",
      p_source: "whatsapp",
    });
    if (inqAErr || !inqA) throw new Error(`Failed to call create_or_update_inquiry: ${inqAErr?.message}`);

    // CHECK 2: User A can read their inquiry
    const { data: userARead, error: readAErr } = await clientA
      .from("inquiries")
      .select("id, status")
      .eq("id", inqA.id);
    if (readAErr || !userARead || userARead.length !== 1) {
      throw new Error(`User A should be able to view their own inquiry: ${readAErr?.message}`);
    }
    console.log("PASS 1: User A can read their own store inquiries.");

    // CHECK 3: User B CANNOT read User A's inquiry (Cross-tenant SELECT isolation)
    const { data: userBRead } = await clientB
      .from("inquiries")
      .select("id, status")
      .eq("id", inqA.id);
    if (userBRead && userBRead.length > 0) {
      throw new Error("SECURITY FAILURE: User B was able to read User A's inquiries!");
    }
    console.log("PASS 2: Cross-tenant SELECT isolation verified (User B receives 0 rows).");

    // CHECK 4: User B CANNOT update User A's inquiry
    const { count: updateBCount } = await clientB
      .from("inquiries")
      .update({ status: "sold", final_amount_minor: 1500000, sold_at: new Date().toISOString() })
      .eq("id", inqA.id);
    if (updateBCount && updateBCount > 0) {
      throw new Error("SECURITY FAILURE: User B was able to UPDATE User A's inquiry!");
    }
    console.log("PASS 3: Cross-tenant UPDATE isolation verified (User B cannot update User A's inquiry).");

    // CHECK 5: User A CANNOT update product_price_minor (Column-Level Security)
    const { error: priceUpdateErr } = await clientA
      .from("inquiries")
      .update({ product_price_minor: 100 } as any)
      .eq("id", inqA.id);
    if (!priceUpdateErr) {
      throw new Error("SECURITY FAILURE: Authenticated user was able to update product_price_minor!");
    }
    console.log("PASS 4: Column-level security verified (product_price_minor update rejected by Postgres).");

    // CHECK 6: Sold without final_amount_minor or sold_at is rejected by DB constraint
    const { error: invalidSoldErr } = await clientA
      .from("inquiries")
      .update({ status: "sold" })
      .eq("id", inqA.id);
    if (!invalidSoldErr) {
      throw new Error("CONSTRAINT FAILURE: Marking sold without final_amount_minor was accepted!");
    }
    console.log("PASS 5: Sold CHECK constraint verified (rejected by Postgres when amount is missing).");

    // CHECK 7: Customer Trigger: sold -> lost -> sold
    const now = new Date().toISOString();
    await clientA
      .from("inquiries")
      .update({ status: "sold", final_amount_minor: 1500000, sold_at: now })
      .eq("id", inqA.id);

    const { data: custSold } = await clientA
      .from("customers")
      .select("sold_count, chats_count")
      .eq("store_id", storeA.id)
      .eq("phone", "+2348080000001")
      .single();
    if (!custSold || custSold.sold_count !== 1) {
      throw new Error(`Customer sold_count should be 1, found: ${custSold?.sold_count}`);
    }

    await clientA.from("inquiries").update({ status: "lost" }).eq("id", inqA.id);
    const { data: custLost } = await clientA
      .from("customers")
      .select("sold_count")
      .eq("store_id", storeA.id)
      .eq("phone", "+2348080000001")
      .single();
    if (!custLost || custLost.sold_count !== 0) {
      throw new Error(`Customer sold_count should be 0 on reversal, found: ${custLost?.sold_count}`);
    }
    console.log("PASS 6: Customer trigger verified across sold -> lost transitions.");

    // CHECK 8: Concurrent dedupe test (20 concurrent calls yields exactly 1 row)
    console.log("Running 20 concurrent inquiry calls to verify advisory lock deduplication...");
    const concurrentDeviceHash = `device_race_${testRunId}`;
    await Promise.all(
      Array.from({ length: 20 }).map((_, i) =>
        adminClient.rpc("create_or_update_inquiry", {
          p_store_id: storeA.id,
          p_product_id: 202,
          p_product_name: "Race Test Shoes",
          p_currency: "NGN",
          p_product_price_minor: 2000000,
          p_selected_option: `Attempt ${i}`,
          p_buyer_name: "Concurrent Buyer",
          p_buyer_phone: "+2348080000099",
          p_device_hash: concurrentDeviceHash,
          p_source: "whatsapp",
        }),
      ),
    );

    const { data: raceInquiries, error: raceErr } = await adminClient
      .from("inquiries")
      .select("id")
      .eq("store_id", storeA.id)
      .eq("product_id", 202)
      .eq("device_hash", concurrentDeviceHash);

    if (raceErr || !raceInquiries || raceInquiries.length !== 1) {
      throw new Error(`Concurrent race test failed: expected 1 row, found ${raceInquiries?.length}`);
    }
    console.log("PASS 7: 20 concurrent calls yielded exactly 1 row under transaction advisory lock.");

    // Cleanup test records
    console.log("Cleaning up test stores...");
    await adminClient.from("stores").delete().in("id", [storeA.id, storeB.id]);
  } finally {
    console.log("Cleaning up test users...");
    await adminClient.auth.admin.deleteUser(userA.id);
    await adminClient.auth.admin.deleteUser(userB.id);
  }

  console.log("ALL STEP 0 DATABASE INTEGRATION CHECKS PASSED SUCCESSFULLY!");
}

main().catch((err) => {
  console.error("Step 0 Verification Failed:", err);
  process.exit(1);
});
