/**
 * Seed script — run once to set up demo data.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/seed.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 * Safe to re-run — checks existing data before inserting.
 */

import { createAdminClient } from '../lib/supabase/admin'

const admin = createAdminClient()

// ── SETTINGS ──────────────────────────────────────────────────────────────────

async function seedSettings() {
  console.log('Seeding settings…')

  const rows = [
    { key: 'minimum_rate',            value: 8000 }, // 8,000 SDG per $1
    { key: 'discount_threshold_sand', value: 300  }, // 3.00% → sand
    { key: 'discount_threshold_red',  value: 500  }, // 5.00% → red; above → blocked
  ]

  for (const row of rows) {
    const { data: existing } = await admin
      .from('settings')
      .select('key')
      .eq('key', row.key)
      .single()

    if (!existing) {
      const { error } = await admin.from('settings').insert(row)
      if (error) throw new Error(`Settings insert failed: ${error.message}`)
      console.log(`  ✓ ${row.key} = ${row.value}`)
    } else {
      console.log(`  – ${row.key} already exists, skipping`)
    }
  }
}

// ── PRODUCTS ──────────────────────────────────────────────────────────────────

async function seedProducts() {
  console.log('Seeding products…')

  const products = [
    { name: 'SPF 6000 ES Plus — 6 kW inverter',    price_usd_cents:  51500 }, // $515.00
    { name: 'SPE 12000 ES — 12 kW inverter',        price_usd_cents:  97500 }, // $975.00
    { name: 'Hope 5.0L-B1 — 5 kWh battery',        price_usd_cents:  81000 }, // $810.00
    { name: 'Hope 16.0LM-A1 — 16 kWh battery',     price_usd_cents: 207000 }, // $2,070.00
  ]

  for (const p of products) {
    const { data: existing } = await admin
      .from('products')
      .select('id')
      .eq('name', p.name)
      .single()

    if (!existing) {
      const { error } = await admin.from('products').insert(p)
      if (error) throw new Error(`Product insert failed: ${error.message}`)
      console.log(`  ✓ ${p.name} — $${(p.price_usd_cents / 100).toFixed(2)}`)
    } else {
      console.log(`  – "${p.name}" already exists, skipping`)
    }
  }
}

// ── CUSTOMERS ─────────────────────────────────────────────────────────────────

async function seedCustomers() {
  console.log('Seeding customers…')

  const customers = [
    { name: 'Ahmed Trading',   city: 'Khartoum'  },
    { name: 'Nile Solar',      city: 'Omdurman'  },
    { name: 'Dongola Power',   city: 'Dongola'   },
  ]

  for (const c of customers) {
    const { data: existing } = await admin
      .from('customers')
      .select('id')
      .eq('name', c.name)
      .single()

    if (!existing) {
      const { error } = await admin.from('customers').insert(c)
      if (error) throw new Error(`Customer insert failed: ${error.message}`)
      console.log(`  ✓ ${c.name} — ${c.city}`)
    } else {
      console.log(`  – "${c.name}" already exists, skipping`)
    }
  }
}

// ── USERS ─────────────────────────────────────────────────────────────────────

async function seedUsers() {
  console.log('Seeding users…')

  const users = [
    {
      email: 'adviser@shamsy.demo',
      password: 'Demo1234!',
      role: 'adviser',
      full_name: 'Sara Ahmed',
    },
    {
      email: 'owner@shamsy.demo',
      password: 'Demo1234!',
      role: 'owner',
      full_name: 'Shamsy Owner',
    },
  ]

  for (const u of users) {
    // Check if user already exists
    const { data: list } = await admin.auth.admin.listUsers()
    const existing = list?.users.find(x => x.email === u.email)

    if (!existing) {
      const { data, error } = await admin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: {
          role: u.role,
          full_name: u.full_name,
        },
      })
      if (error) throw new Error(`User create failed (${u.email}): ${error.message}`)
      console.log(`  ✓ ${u.email} (${u.role}) — id: ${data.user.id}`)
    } else {
      console.log(`  – ${u.email} already exists, skipping`)
    }
  }
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Starting seed…\n')
  try {
    await seedSettings()
    await seedProducts()
    await seedCustomers()
    await seedUsers()
    console.log('\n✅ Seed complete.')
    console.log('\nTest accounts:')
    console.log('  Adviser — adviser@shamsy.demo / Demo1234!')
    console.log('  Owner   — owner@shamsy.demo   / Demo1234!')
  } catch (err) {
    console.error('\n❌ Seed failed:', err)
    process.exit(1)
  }
}

main()
