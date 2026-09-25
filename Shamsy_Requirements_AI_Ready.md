# SHAMSY — PROJECT REQUIREMENTS

> **Source:** Shamsy Job Post / Full-Stack Developer Requirement  
> **Purpose:** This document is the source-of-truth project requirement for AI agents and developers.
>
> **IMPORTANT FOR AI AGENTS**
> - Read this entire document before making implementation decisions.
> - Treat the requirements below as authoritative.
> - Do not silently add, remove, reinterpret, or replace requirements.
> - Preserve the terminology used in this document.
> - Distinguish between requirements for this project and explicitly deferred/later-phase functionality.
> - When a requirement is unclear, flag it instead of inventing behavior.
> - Do not build functionality explicitly marked "later phase" or "not in this project" unless separately requested.
> - The technical stack marked "not negotiable" must be followed.
> - Business rules, permissions, currency history, financial calculations, and acceptance-test behavior are critical requirements.
> - Security/permissions must not rely only on UI hiding; the source explicitly requires database-level enforcement.
> - Historical financial values must remain immutable/reproducible according to the stated rules.
>
> ## Project Scope
> Steps 1–9 are part of this project.
>
> Steps 10–12 are later phases. The system must be structured so those later phases can be added without rework, but their actual functionality is not part of this project.
>
> ## Non-Negotiable Technology Stack
> - Next.js with App Router
> - TypeScript
> - Nx monorepo
> - Supabase
>   - PostgreSQL
>   - Authentication
>   - Row Level Security (RLS)
>   - Storage
> - Tailwind CSS
> - Vercel
> - GitHub Actions for tests and deployment
>
> ## Critical Architectural Requirements
> - Multi-tenant data model from day one.
> - Every permission enforced in the database.
> - Four roles with database-enforced access.
> - Financial history must never change because current exchange-rate settings change.
> - Money must be stored as integers in the smallest unit, never floating-point numbers.
> - Historical rates must be stored at the time of each transaction and never recalculated from current rates.
> - The interface starts in English.
> - The system must be designed for weak mobile/3G connections.
> - No hard-coded UI text because Arabic/RtL is a later phase.
> - Dealer screens are not part of this project, but the architecture must support future dealer access.
>
> ## AI Agent Implementation Rule
> Before implementing any feature:
> 1. Identify which project Step and Module it belongs to.
> 2. Check the applicable business rules and role permissions.
> 3. Check whether the feature is in-scope or explicitly deferred.
> 4. Identify affected database entities and historical-data requirements.
> 5. Implement server/database enforcement where required; do not rely only on frontend validation.
> 6. Add tests matching the acceptance behavior described in the requirement.
> 7. Do not modify existing business rules to make an implementation easier.
> 8. If requirements conflict or are insufficient, stop and ask/flag the ambiguity.
>


---

# Page 1

Shamsy
1
Job post
Full-stack developer · Shamsy all-in-one business platform
Title: Full-stack developer (Next.js + Supabase) — all-in-one business platform for a solar
distributor and its dealers: orders, finance, stock and customers
Short description: I need a full-stack Next.js and Supabase developer to build an all-in-one
business platform for a solar distributor and, later, its dealers — orders, finance, stock and
customers on one foundation, built feature by feature with tests under our technical lead.
Category: Web Development → Full Stack Development
Skills: Next.js, Supabase, PostgreSQL, TypeScript, Tailwind CSS, React
Type: Fixed price, milestone based
What we do
We import solar equipment — inverters, batteries, solar air conditioners, panels,
balance-of-system parts and pumps — and sell it in Sudan to a network of about 570 dealers
and installers. Our latest battery container was over $220,000 of goods at purchase price. We
do not install anything; our dealers do.
The war destroyed most of the national grid. Generating capacity fell from 4,400 MW to around
1,100 MW, and blackouts run to eighteen hours a day. Demand is not our problem. Running the
business is.
The problem you would be solving
Sudan's banking does not work normally. Customers pay in Sudanese pounds, in transfers
capped at 3 million each, into bank accounts held by four money exchangers, and each account
can take only about 15 million a day. Proof of payment arrives as Arabic bank screenshots on
WhatsApp, often twice. Each one has to be matched to an order and forwarded to the right
exchanger — and when that forwarding is forgotten, money sits with an exchanger who does
not know it is ours.
Today this runs on an offline sales tool in Arabic, a spreadsheet per adviser, a shipment cost
dossier and a ledger rebuilt by hand from 211 screenshots. On the last shipment we reconciled
64 proofs against 22 orders. The margin was known weeks after the goods had gone.
What we want to build, in this order
How the platform is built. One foundation, three modules on top of it, and a dashboard in
front. Every feature we need belongs to exactly one of these. Nothing is built outside them.
Part
What it holds
Foundation
What every module stands on: login, users and roles, permissions in the database,
environments for Shamsy and later for dealers, branding, and all configurable
settings such as rates, currencies and discount thresholds.

---

# Page 2

Shamsy
2
Part
What it holds
Finance
Everything with money: orders, receipts and proofs, accounts and their daily limits,
conversions between currencies, margin and profit, reports and closing checks.
Stock
Everything with goods: products, purchasing and shipments, landed cost, stock
levels and movements, release against paid orders.
Communication
Everything with customers: customer records and history, quotes and price lists, and
later WhatsApp.
Dashboard
The front layer. It holds no data of its own; it shows what the three modules hold, per
role.
A marketing module may follow later; it is not part of this project.
Steps 1 to 9 are this project. Steps 10 to 12 come later, but they are listed so you can build for
them now and nothing has to be done twice.
#
Step
Module
What it does
1
Platform setup
Foundation
Login: a personal account per user, email and password, with
password reset. Sessions that survive a weak connection. No
shared logins.
Roles: four, each enforced in the database with row level
security, not by hiding buttons.
• Owner — everything: prices, rates, users, margins, approvals.
• Marketing — reads customers, orders and stock, edits
customers; never sees cost prices or margins.
• Sales adviser — creates orders and receipts for her own
customers; never sees cost prices or margins.
• Warehouse — reads orders, records stock movements and
releases; sees no financial data.
Products and customers: the base records of the Stock and
Communication modules, created in this step because every
later step needs them.
Account holders: every exchanger account with all its name
spellings, so “Mogtaba”, “Mujtaba” and “Motgaba” are one
person.
Settings per environment: logo and house style, the discount
thresholds (now 3% and 5%), the minimum rate, which
currencies are used and which kinds of accounts exist — all
configurable, none of them written into the code.
Interface in English. Nothing else works without this step.

---

# Page 3

Shamsy
3
#
Step
Module
What it does
2
Orders
Finance
Prices: fixed in dollars; advisers cannot change them. Only the
owner can override a price.
Exchange rate: the day's rate converts dollars to pounds. It can
never be set below the minimum rate the owner sets and raises
as the pound falls.
Discounts: separate from the rate, per order line. Sand up to 3%
of the line value, red from 3% to 5%, blocked above 5% without
the owner's approval.
Payment instructions: which account to pay into, and in how
many transfers of 3,000,000.
3
Receipts, with
proof and
status
Finance
One line per unique transaction code, with photo, amount, from
and to account. A receipt can pay several orders. Duplicates
refused; same code with a different amount flagged. Status per
receipt: received, forwarded to the exchanger, confirmed.
4
Accounts,
limits and
movements
Finance
Every exchanger account, our own account, pass-through
accounts and our Airwallex account in the UAE, with live
balances. Today's intake against the daily limit. Transfers,
exchanger payouts in euros, cash taken by staff. Outstanding per
exchanger.
5
Release
against paid
orders
Stock
The warehouse can only release goods for a fully paid order.
6
Purchasing,
landed cost
and stock
Stock
Euro to dollar conversion with commission. Shipment costs in
USD, EUR, AED or SDG spread pro rata to purchase value with a
20% safety uplift on indirect costs — on our current shipment
that turns a $270 inverter into a true cost of $303.58. Stock,
movements, goods in transit, kits.
7
Margin, profit
and checks
Finance
Per product, order, customer, adviser, shipment and month,
every result viewable in dollars and in euros, as an amount
and as a margin: gross profit, net profit before currency, the
currency result, and net profit after currency. The currency
result per route — each exchanger and our UAE account —
because where we convert changes the result — on our August
shipment gross 25.7%, a $4,135 currency result, net 30.3%.
Expenses and refunds. Balance per account against the actual
balance, and closing checks that prove the books are right.
8
Quotes and
price lists
Communicati
on
Branded quote PDF in English, with validity and payment terms,
sent via a WhatsApp share link, converted to an order in one
click. The price list PDF from the same catalogue.
9
CRM
Communicati
on
Dealer profiles, segments A+ to D, pipeline labels, source of each
customer, revenue per active dealer.
10
WhatsApp
Business API —
later phase
Communicati
on
Not in this project. A shared inbox on one WhatsApp number,
every message linked to the customer record, approved
templates for follow-ups and shipment announcements, and the
24-hour conversation window respected. Until then we use
WhatsApp share links. Build the customer and message model so
this plugs in later without rework.

---

# Page 4

Shamsy
4
#
Step
Module
What it does
11
Arabic
interface —
later phase
Foundation
Not in this project. An Arabic right-to-left interface and Arabic
quote PDFs, as the advisers use today in the sales tool. Build for
it from day one: no hard-coded text, every string in translation
files, layouts that can be mirrored, number and date formats per
language — so adding Arabic is translation work, not a rebuild.
12
Dealer access
— later phase
Foundation
Not in this project. Dealers log in to run their own quotes,
customers, stock and bookkeeping on our catalogue. Build the
data model multi-tenant, with every permission in the database,
from day one — so this becomes a switch rather than a rewrite.
The project brief explains each step, the rules behind it, and the data model as we see it.
Answer these four questions in your proposal
Proposals that skip them are not read.
1. Links to two applications you built with Next.js and Supabase. Working software, not
screenshots.
2. How would you store an amount priced in US dollars, paid in Sudanese pounds and reported
in euros, so that a report run today still gives the same numbers in six months?
3. Your price and timeline per step, and how many hours per week you are available, in which
timezone.
4. Do you work with AI coding tools, and how do you check what they produce? Which tests do
you write, and how do you document your work?
If anything in this post looks like the wrong approach, say so. We would rather hear it now.
Why this becomes a product
Phase one is for our team of five. Later we open the same system to our 570 dealers: their
quotes, customers, stock and bookkeeping. A dealer who runs his business in our system orders
from us, and through it we see what the market is quoting and selling before it reaches us as an
order.
So the data model is multi-tenant from day one, with every permission in the database. Do not
build the dealer screens. Do build a structure that will not need rewriting for them.
What makes it technically serious
Currency, and history that must never move. We price in dollars, customers pay in
Sudanese pounds, and we report in euros. The pound falls almost every day — from around
6,050 per dollar in June 2026 to above 8,000 in September. That is exactly the danger. An order
placed today at 8,000 must still show 8,000 in six months, when the rate may be 11,000. The
same holds for every payment and every conversion to euros: each is stored with the rate of
the day it happened, and that rate is never looked up again or recalculated from a newer one. A
report on last month must give exactly the same numbers whether it is run today, next week or
in six months — to the last pound. If it moves by a single pound, the implementation is wrong
and the books can no longer be trusted. So: store the amount, the currency and the rate on
every order line, receipt and conversion at the moment it happens; never derive a historical

---

# Page 5

Shamsy
5
amount from a current rate; and keep money as integers in the smallest unit, never as
floating-point numbers, so rounding cannot drift over thousands of records.
A real ledger. Every money movement is one line with an origin and a destination.
Pass-through accounts must net to zero. Contradictions are shown, never smoothed over.
On phones, on 3G. The advisers work on phones in Dongola and Khartoum. The interface
must be fast and must not lose an entry when the connection drops. It starts in English; Arabic
right-to-left follows later, so no text may be hard-coded.
Permissions in the database. The four roles in step 1 are enforced with row level security,
not hidden columns. An adviser must not be able to reach a cost price even by querying the
database directly.
Not in this project
The WhatsApp Business API with a shared inbox. Dealer screens. A native mobile app.
Accounting export. Warranty tracking. Automatic reading of payment screenshots — though we
want your view on it.
What you get on day one
• Our current sales tool, the offline HTML app the advisers use today
• The daily administration spreadsheet the advisers work in
• The shipment cost dossier with landed cost per product
• The cash ledger built from 211 payment screenshots, plus sample screenshots
• A working HTML dashboard prototype with our layout, colours and typography
• A project brief with the rules, the screens and the data model
• Our price list, brand assets and product catalogues
Stack — not negotiable
Next.js with the App Router and TypeScript, in an Nx monorepo. Supabase for Postgres,
authentication, row level security and storage. Tailwind CSS. Deployed on Vercel. GitHub
Actions for tests and deployment.
How we work
With our technical lead. You work under the guidance of our technical lead, who defines
every feature in advance with a goal prompt, the acceptance tests it must pass, and the
functional result we expect. He also joins the video interviews. You build feature by feature, and
a feature is finished when its tests pass and it works as described — not when the code is
written.
In the code. An Nx monorepo on GitHub. GitHub Actions run the tests and deploy on every
change. Every change comes with tests, and goes in through a pull request that is reviewed
before it is merged. Documentation is written as you go, not at the end.
Repository on our GitHub organisation from the first commit. Supabase on a paid plan with daily
backups, on our account. Paid per milestone, one milestone per step, released when that
milestone's acceptance tests pass — for example: a report from last month must give identical

---

# Page 6

Shamsy
6
numbers after today's rate is changed, and an adviser must not be able to retrieve a cost price
even by querying the database.
Before go-live you import our opening balances, open orders, outstanding amounts, current
stock and payment ledger from our spreadsheets, so the system starts complete. Sixty days of
free fixes after final handover. The project brief and our data are shared with shortlisted
candidates after a signed confidentiality agreement. Daily commits, a short written update
twice a week, clean code with a README another developer could take over from. All
intellectual property transfers to us.
Paid trial task
What this is. Before we award the project, the shortlisted candidates each build one small,
real piece of it: the screen where a sales adviser records an order. It takes six to eight hours
for it, whether or not we continue with you. It shows us how you think about
money, rules and phones — which is what the whole project depends on.
The situation you are building for. A dealer in Khartoum asks our sales adviser on
WhatsApp for four inverters, two small batteries and one large battery. The adviser opens this
screen on her phone, picks the dealer, adds the products, gives a small discount where she is
allowed to, enters today's exchange rate, and sees what the dealer has to pay in US dollars and
in Sudanese pounds. Then she saves the order.
The rules the screen must enforce
1. Prices are fixed. Each product has a price in US dollars. The adviser cannot change it.
2. Discount is per line, and separate from everything else. The adviser may give a
discount in dollars on any line. The discount is measured as a percentage of that line's value
(price × quantity):
– above 0% and up to 3% — the line turns sand, and saving is allowed
– above 3% and up to 5% — the line turns red, and saving is still allowed
– above 5% — saving is blocked until the owner approves that line
3. The exchange rate is one number for the whole order. It converts dollars to pounds. It
has nothing to do with discounts or prices. It can never be lower than the minimum rate of
8,000 SDG per dollar. If the adviser types a lower number, the screen refuses it and puts
the value back to 8,000. A higher number is always fine.
4. A saved order never changes. The rate the adviser entered is stored on the order. If the
rate setting changes tomorrow, yesterday's order still shows exactly the same amounts.
Test data to use
Product
Price per unit
SPF 6000 ES Plus — 6 kW inverter
$515
SPE 12000 ES — 12 kW inverter
$975
Hope 5.0L-B1 — 5 kWh battery
$810
Hope 16.0LM-A1 — 16 kWh battery
$2,070

---

# Page 7

Shamsy
7
Customers: three invented dealers, for example Ahmed Trading in Khartoum, Nile Solar in
Omdurman and Dongola Power in Dongola.
Users: two accounts — one adviser, one owner. Only the owner can approve a discount above
5%.
A worked example — your screen must produce exactly these numbers
Rate entered: 8,200 SDG per dollar.
Line
Quantity ×
price
Line value
Discount
Discount %
Colour
Line total
SPF 6000 ES
Plus
4 × $515
$2,060
$40
1.94%
sand
$2,020
Hope
5.0L-B1
2 × $810
$1,620
$70
4.32%
red
$1,550
Hope
16.0LM-A1
1 × $2,070
$2,070
$150
7.25%
blocked
$1,920
As the adviser, the order cannot be saved while line 3 is blocked. If she removes line 3 instead,
the order totals $3,570, which is 29,274,000 SDG, and can be saved.
After the owner approves line 3: the order totals $5,490, which is 45,018,000 SDG.
Then change the rate setting to 9,000 and reopen the saved order. It must still show 8,200 and
45,018,000 SDG.
Try to enter a rate of 7,900: it must be refused and return to 8,000.
What you do not need to build. Payments, stock, PDF quotes, customer management,
Arabic, and polished design. Plain and clean is fine. We are judging the logic, not the looks.
Technical expectations
• Next.js with TypeScript, Supabase, Tailwind — the same stack as the real project
• Money stored as whole numbers in cents, never as decimals
• The rate stored on each saved order
• The discount rules enforced in the database or on the server, not only in the browser
• Works on a phone screen
What you deliver
1. A link to the working screen, hosted on your own Vercel and Supabase
2. Access to the code repository
3. A screen recording of five minutes or less, walking through the worked example above
4. A short note: what you would do differently when building the real system, and anything in
our rules that seems unclear or wrong
How we judge it

---

# Page 8

Shamsy
8
What we check
Why it matters
The worked example gives exactly the numbers
above
Every report in the real system depends on correct
arithmetic
The 5% block cannot be bypassed, not even by
calling the server directly
Discount control is money control
A saved order does not change when the rate
changes
This is the rule the whole administration rests on
Money is stored in cents and the rate is stored on
the order
Rounding errors and moving history are the
costliest bugs we can get
It works on a phone
Our advisers work on phones, on weak connections
Your note shows you understood the problem
We want someone who thinks along, not only builds
Time and payment. Six to eight hours. You have three working days from receiving the task.
We pay $100 on delivery, whether or not we award you the project.
