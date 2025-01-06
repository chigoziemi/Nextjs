import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';
import { users, customers, invoices, revenue } from '../lib/placeholder-data';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedUsers() {
  try {
    const { error } = await supabase.from('users').upsert(
      users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        password: bcrypt.hashSync(user.password, 10),
      })),
      { onConflict: 'id' }
    );
    if (error) throw error;
  } catch (error) {
    console.error('Error seeding users:', error);
  }
}

async function seedCustomers() {
  try {
    const { error } = await supabase.from('customers').upsert(
      customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        image_url: customer.image_url,
      })),
      { onConflict: 'id' }
    );
    if (error) throw error;
  } catch (error) {
    console.error('Error seeding customers:', error);
  }
}

async function seedInvoices() {
  try {
    const { error } = await supabase.from('invoices').upsert(
      invoices.map((invoice) => ({
        customer_id: invoice.customer_id,
        amount: invoice.amount,
        status: invoice.status,
        date: invoice.date,
      })),
      { onConflict: 'id' }
    );
    if (error) throw error;
  } catch (error) {
    console.error('Error seeding invoices:', error);
  }
}

async function seedRevenue() {
  try {
    const { error } = await supabase.from('revenue').upsert(
      revenue.map((rev) => ({
        month: rev.month,
        revenue: rev.revenue,
      })),
      { onConflict: 'month' }
    );
    if (error) throw error;
  } catch (error) {
    console.error('Error seeding revenue:', error);
  }
}

export async function GET() {
  try {
    await seedUsers();
    await seedCustomers();
    await seedInvoices();
    await seedRevenue();
    return new Response(
      JSON.stringify({ message: 'Database seeded successfully' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}