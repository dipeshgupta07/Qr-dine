# QR Dine - Restaurant Operations, Simplified

QR based ordering for restaurants. Customers scan a table QR, pick a language, order, track the order and get a digital receipt. Kitchen, waiter, accountant and manager each get a live panel.

**Stack**
- Next.js 14 (App Router) for the frontend and routing
- Supabase (PostgreSQL, Auth, Realtime, Row Level Security) as the database and backend
- Vercel for hosting
- react-icons (Font Awesome 6) for icons, no emojis anywhere

> A note on "MERN": MERN means MongoDB, Express, React, Node. This project replaces MongoDB with Supabase (Postgres) and Express with Supabase's API plus SQL functions, and uses Next.js (React on Node). For your IIT report you can describe it as a "Next.js + Supabase (React/Node based) stack, a modern alternative to MERN".

## Features included

| Feature | Where |
|---|---|
| Landing page (problem, solution, USP, journey, roadmap) | `/` |
| QR scan menu, 5 languages, live stock badges | `/t/[tableId]` |
| Server side price and stock check, no cheating from the browser | `place_order` SQL function |
| Order tracking and digital receipt, WhatsApp share, UPI pay link | `/order/[id]` |
| Customer requests (water, napkins, bill, call waiter) | `/t/[tableId]` |
| Kitchen panel: live tickets, stock management | `/staff` (kitchen role) |
| Waiter panel: serve, requests with 3 minute SLA alarm, table linking | `/staff` (waiter role) |
| Accountant panel: combined billing for linked tables, cash/UPI/card, daily totals | `/staff` (accountant role) |
| Manager: all panels plus printable table QR codes | `/staff` (manager role) |

Future phases from your roadmap (leave approvals, salary, multi-branch analytics, Swiggy/Zomato integration) are not built yet.

---

## Step by step guide

### Step 0: Install the tools (once)
1. Install Node.js 18 or newer from nodejs.org. Check with `node -v`.
2. Install Git from git-scm.com.
3. Make free accounts on supabase.com, github.com and vercel.com (sign in to Vercel with GitHub).

### Step 1: Run the project locally
```bash
cd qr-dine
npm install
cp .env.example .env.local     # on Windows: copy .env.example .env.local
npm run dev
```
Open http://localhost:3000. The landing page works already. The menu and staff pages need Supabase (next step).

### Step 2: Create the Supabase project
1. In Supabase click **New project**. Pick a name, set a database password (save it), choose the region nearest to you (Mumbai, ap-south-1).
2. Wait about two minutes until it finishes setting up.
3. Go to **Project Settings, API**. Copy the **Project URL** and the **anon public key**.
4. Paste them into `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_RESTAURANT_NAME=Your Restaurant Name
NEXT_PUBLIC_UPI_ID=yourname@upi
```
Never use the `service_role` key in this project. Only the anon key goes in the frontend.

### Step 3: Create the database
1. In Supabase open **SQL Editor, New query**.
2. Open `supabase/schema.sql` from this project, copy everything, paste it and press **Run**.
3. Check **Table Editor**. You should see `profiles`, `dining_tables`, `menu_items`, `orders`, `order_items`, `service_requests`, with 6 sample tables and 7 sample dishes.

If the last `alter publication` line errors with "already member", ignore it.

### Step 4: Create your first staff user
1. Supabase, **Authentication, Users, Add user, Create new user**. Enter an email and password, tick "Auto Confirm User".
2. Click the user and copy their **User UID**.
3. In SQL Editor run:
```sql
insert into profiles(id, full_name, role)
values ('PASTE-USER-UID-HERE', 'Your Name', 'manager');
```
4. Create more users the same way for staff. Valid roles: `kitchen`, `waiter`, `accountant`, `manager`, `owner`.

### Step 5: Test the whole flow locally
1. Restart `npm run dev` after editing `.env.local`.
2. Go to `/staff`, sign in as the manager, open the **QR Codes** tab.
3. Open `/t/demo` in a second browser tab (or scan a QR from your phone on the same Wi-Fi using your laptop's IP address). Add items and place an order.
4. In the staff panel: Kitchen shows the ticket, press Start cooking, then Mark ready. Waiter presses Mark served. Accountant takes payment.
5. On the customer order page the status bar moves along within 5 seconds.
6. Try ordering more than the stock of Gulab Jamun (only 3). The order is rejected.

### Step 6: Put the code on GitHub
```bash
git init
git add .
git commit -m "QR Dine first version"
```
Create an empty repository on github.com, then:
```bash
git remote add origin https://github.com/YOUR-USERNAME/qr-dine.git
git branch -M main
git push -u origin main
```
`.env.local` is in `.gitignore`, so your keys are not uploaded.

### Step 7: Deploy on Vercel
1. On vercel.com click **Add New, Project**, import the `qr-dine` repository.
2. Framework preset is detected as Next.js. Leave build settings as they are.
3. Open **Environment Variables** and add the four variables from your `.env.local` (same names and values).
4. Click **Deploy**. After about a minute you get a URL like `https://qr-dine-yourname.vercel.app`.
5. In Supabase, **Authentication, URL Configuration**, set **Site URL** to your Vercel URL.
6. Open the Vercel URL, sign in at `/staff`, go to **QR Codes** and print them. They now point to the live site.

Every `git push` to `main` redeploys automatically.

### Step 8: Submission checklist for IIT
- Live URL on Vercel and the GitHub link.
- A short demo video: customer scans, orders, kitchen cooks, waiter serves, accountant bills.
- Screenshots: landing page, customer menu in Hindi, order tracking, three staff panels, QR codes.
- A report with these sections: problem statement (from your infographic), architecture (Next.js, Supabase, Vercel), database schema (ER diagram from Supabase, Database, Schema Visualizer), security (RLS plus `place_order` function), features, roadmap, learnings.
- Test credentials for each role so the evaluator can log in.

---

## How the security works (good for viva questions)
- Customers are anonymous. They can only read the menu and tables, create a service request, and call two functions: `place_order` and `get_order`.
- `place_order` runs on the server side of the database. It recomputes prices from the menu table and locks the stock rows, so a customer cannot change a price or oversell an item.
- All operational tables (orders, items, requests) are readable and writable only by logged-in users who have a row in `profiles`.
- Order ids are random UUIDs, so only someone who holds the order link can see that order.

## Project structure
```
app/
  page.js                landing page
  t/[tableId]/page.js    customer menu and cart
  order/[id]/page.js     tracking and receipt
  staff/page.js          login and role based panels
components/              Kitchen, Waiter, Accountant, QrManager
lib/supabase.js          client, languages, helpers
supabase/schema.sql      tables, RLS, functions, seed data
```

## Ideas for the next phase
- Edit menu items and translations from a Manager screen.
- Add an "add to existing order" flow so mid-order additions merge into one bill line.
- Real WhatsApp receipts using the WhatsApp Business Cloud API from a Supabase Edge Function.
- Leave and salary modules for the Manager panel, then multi-branch analytics for the Owner.
