import { createClient } from '@supabase/supabase-js';
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// export async function fetchRevenue() {
//   try {
//     const { data, error } = await supabase.from<Revenue>('revenue').select('*');
//     if (error) throw error;
//     return data;
//   } catch (error) {
//     console.error('Database Error:', error);
//     throw new Error('Failed to fetch revenue data.');
//   }
// }


export async function fetchLatestInvoices() {
  try {
    const { data, error } = await supabase
      .from<LatestInvoiceRaw>('invoices')
      .select('amount, id, customers(name, image_url, email)')
      .order('date', { ascending: false })
      .limit(5);

    if (error) throw error;

    return data?.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  try {
    const [{ count: invoiceCount }, { count: customerCount }, invoiceStatus] = await Promise.all([
      supabase.from('invoices').select('*', { count: 'exact', head: true }),
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase
        .from('invoices')
        .select('SUM(amount) as paid', { count: 'exact' })
        .eq('status', 'paid')
        .single(),
    ]);

    return {
      numberOfCustomers: customerCount ?? 0,
      numberOfInvoices: invoiceCount ?? 0,
      totalPaidInvoices: formatCurrency(invoiceStatus?.paid ?? 0),
      totalPendingInvoices: formatCurrency(invoiceStatus?.pending ?? 0),
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

// Update remaining functions similarly

export async function fetchFilteredInvoices(query: string, currentPage: number) {
  const ITEMS_PER_PAGE = 6;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const { data, error } = await supabase
      .from<InvoicesTable>('invoices')
      .select('id, amount, date, status, customers(name, email, image_url)')
      .ilike('customers.name', `%${query}%`)
      .order('date', { ascending: false })
      .range(offset, offset + ITEMS_PER_PAGE - 1);

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

// Implement other functions using the Supabase client similarly.