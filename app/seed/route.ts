import bcrypt from 'bcrypt';
import { supabase } from '@/utils/supabaseClient'; // Update with your Supabase client import
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

async function seedUsers() {
  const { error } = await supabase.rpc('uuid_generate_v4');
  if (error) console.error('Error enabling uuid-ossp extension:', error);

  const { error: tableError } = await supabase.raw(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `);
  if (tableError) console.error('Error creating users table:', tableError);

  const promises = users.map(async (user) => {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const { error: insertError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        name: user.name,
        email: user.email,
        password: hashedPassword,
      });
    if (insertError) console.error(`Error inserting user ${user.name}:`, insertError);
  });

  await Promise.all(promises);
}

async function seedInvoices() {
  const { error } = await supabase.raw(`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `);
  if (error) console.error('Error creating invoices table:', error);

  const promises = invoices.map((invoice) =>
    supabase.from('invoices').upsert(invoice)
  );
  await Promise.all(promises);
}

async function seedCustomers() {
  const { error } = await supabase.raw(`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `);
  if (error) console.error('Error creating customers table:', error);

  const promises = customers.map((customer) =>
    supabase.from('customers').upsert(customer)
  );
  await Promise.all(promises);
}

async function seedRevenue() {
  const { error } = await supabase.raw(`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `);
  if (error) console.error('Error creating revenue table:', error);

  const promises = revenue.map((rev) =>
    supabase.from('revenue').upsert(rev)
  );
  await Promise.all(promises);
}

export async function GET() {
  try {
    await supabase.sql`BEGIN`; // Supabase transactions (optional, requires raw SQL)
    await seedUsers();
    await seedCustomers();
    await seedInvoices();
    await seedRevenue();
    await supabase.sql`COMMIT`;

    return new Response(JSON.stringify({ message: 'Database seeded successfully' }), { status: 200 });
  } catch (error) {
    console.error('Error seeding database:', error);
    await supabase.sql`ROLLBACK`;
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
