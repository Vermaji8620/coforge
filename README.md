<!--
  CodeForge Runner: Comprehensive Architecture & Product Guide.
  Documents the Next.js fullstack structure, MongoDB Atlas direct connection,
  multi-stage agentic pipeline, concurrency guards, and compliance workflows.
-->

# CodeForge Runner — Intelligent Document Operations & Compliance Platform

CodeForge Runner is a production-grade AI document processing, contract intelligence, and compliance auditing platform built with **Next.js 14 App Router**, **MongoDB**, **Mongoose**, and **Tailwind CSS**. It replicates enterprise document operations with live agent telemetry (OCR $\rightarrow$ Classify $\rightarrow$ Extract $\rightarrow$ Comply), natural language contract search, synchronized clause inspection, and multi-agent provenance audit logs.

---

## 📁 Highly Organized Next.js File Structure

Every file in the codebase begins with a **3-4 line description header** at the very top detailing its operational purpose and architecture.

```
codeforge-runner/
├── .env.example                          # Environment variable template for local & Vercel deployment
├── .env.local                            # Local MongoDB Atlas direct replicaSet URI & JWT secrets
├── next.config.mjs                       # Next.js configuration (external server packages & remote images)
├── package.json                          # Dependencies, scripts, and runtime engines
├── postcss.config.mjs                    # PostCSS Tailwind and Autoprefixer rules
├── tailwind.config.ts                    # Design system color tokens, utilities, and badges
├── tsconfig.json                         # TypeScript compiler configuration and path aliases (@/*)
├── vercel.json                           # Vercel deployment framework & serverless specification
├── README.md                             # Architecture, database setup, and operational guide
├── scripts/
│   └── seed.mjs                          # Standalone MongoDB database seed script
└── src/
    ├── middleware.ts                     # Edge routing middleware gating unauthenticated sessions
    ├── types/
    │   └── index.ts                      # Shared TypeScript models (IUser, IDocument, IClause, etc.)
    ├── lib/
    │   ├── db.ts                         # Resilient MongoDB connector with pooling & platform guards
    │   ├── auth.ts                       # bcrypt password hashing & JWT token verification
    │   └── sampleData.ts                 # Authentic seed dataset matching design mockups
    ├── models/
    │   ├── User.ts                       # Mongoose model for user accounts & hashed credentials
    │   ├── Document.ts                   # Mongoose model for contracts, extracted fields & clauses
    │   ├── ComplianceIssue.ts            # Mongoose model for audit flags & decision trails
    │   └── PipelineStat.ts               # Mongoose model for live pipeline telemetry
    ├── components/
    │   ├── Sidebar.tsx                   # Collapsible left navigation bar with active route indicators
    │   ├── Topbar.tsx                    # Header with query bar, breadcrumbs, and upload CTA
    │   ├── PipelineVisualizer.tsx        # 4-stage agent telemetry status cards
    │   ├── DocumentsPerHourChart.tsx     # Interactive 24h / 7d / 30d throughput bar chart
    │   ├── DocumentViewer.tsx            # Multi-format document inspector (PDF, TIFF, Invoices)
    │   └── DecisionTrail.tsx             # 5-step agent provenance audit timeline & override modal
    └── app/
        ├── layout.tsx                    # Root layout with Sidebar & persistent Auth context
        ├── globals.css                   # Global styles, custom scrollbars, and typography
        ├── page.tsx                      # Screen 1: Executive Operations Dashboard
        ├── upload/page.tsx               # Screen 2: Document Ingestion & Live Pipeline
        ├── search/page.tsx               # Screen 3: Semantic Natural Language Search
        ├── documents/[id]/page.tsx       # Screen 4: Deep Document Viewer & Inspector
        ├── compliance/page.tsx           # Screen 5: Compliance & Audit Decision Trail
        ├── login/page.tsx                # Split-screen authenticated portal (Login & Register)
        └── api/                          # Serverless REST API Route Handlers
            ├── auth/
            │   ├── login/route.ts        # Verifies bcrypt hash and sets HTTP-only JWT cookie
            │   ├── register/route.ts     # Creates user account and issues JWT session
            │   ├── logout/route.ts       # Clears session cookies on sign out
            │   └── me/route.ts           # Validates JWT token and resolves active user session
            ├── documents/
            │   ├── route.ts              # GET filtered documents / POST new uploads
            │   └── [id]/route.ts         # GET document details by ID or slug / PATCH updates
            ├── pipeline/
            │   └── status/route.ts       # Real-time agent workloads & operational throughput
            ├── compliance/
            │   ├── route.ts              # Flagged issues & risk severity counts
            │   └── [id]/override/route.ts # Human review decision override
            ├── search/route.ts           # Query decomposition & AI answer synthesis
            └── seed/route.ts             # Atomic MongoDB seeding and sync endpoint
```

---

## 🗄️ Database Architecture & Concurrency Protections

### 1. MongoDB Atlas Direct Replica Set Connection
The application connects to MongoDB Atlas using the **direct standard replica set URI** configured in `.env.local`:
```ini
MONGODB_URI=mongodb://<USERNAME>:<PASSWORD>@<HOST_1>:27017,<HOST_2>:27017,<HOST_3>:27017/<DATABASE_NAME>?ssl=true&replicaSet=<REPLICA_SET_NAME>&authSource=admin&retryWrites=true&w=majority
```
* **Why this format?** Unlike `mongodb+srv://`, which delegates DNS SRV queries to local ISP/router DNS (frequently causing `querySrv ECONNREFUSED` on Windows machines), the direct standard replica set URI specifies the exact shard nodes directly. This performs standard DNS lookups that work reliably across all operating systems and cloud environments without DNS SRV failures.

### 2. Automatic Serverless & Platform Guards
* In [`src/lib/db.ts`](file:///c:/Users/Adi/Desktop/coforge/src/lib/db.ts), DNS server configuration is scoped specifically to Windows to prevent overriding native DNS resolution on Linux cloud hosts (such as Vercel).
* In local development, an optional embedded in-memory database (`mongodb-memory-server`) provides offline resilience, while production environments enforce direct, secure Atlas cluster connections.

### 3. Atomic Upserts & Race Condition Prevention
* User accounts and sample datasets are initialized using atomic `findOneAndUpdate` with `{ upsert: true, $setOnInsert: ... }`.
* Concurrent parallel requests (e.g., initial page boot executing `/api/auth/me` and `/api/documents` simultaneously) cannot trigger `E11000 duplicate key` errors on unique indexes.
* Schema validation guards in [`src/models/ComplianceIssue.ts`](file:///c:/Users/Adi/Desktop/coforge/src/models/ComplianceIssue.ts) guarantee required relation paths like `documentId` are always populated.

---

## 🖥️ Walkthrough of Core Screens & Real-World Workflows

### Screen 1: Executive Dashboard (`/`)
* **KPI Metrics**: Real-time counters for *Documents processed today* (12,480, +8.2%), *In queue* (342, median wait 41s), *Field-level accuracy* (98.6%), and *Open compliance alerts* (17, with 4 critical and 6 high badges).
* **Pipeline Right Now Monitor**: Real-time throughput cards for **01 OCR**, **02 Classify**, **03 Extract**, and **04 Comply** with active counts, queued items, latencies, and an active health pulse.
* **Documents per Hour Bar Chart**: Interactive bar chart with `24 h`, `7 d`, and `30 d` intervals, hover tooltips, and the "Now" highlight bar.
* **Alerts Ticker**: Live list of high-risk items (*Unlimited liability clause*, *Unredacted PAN detected*, *Auto-renewal without notice period*).
* **Recently Processed Documents**: Filterable table with status badges (`Flagged`, `Approved`, `Needs review`) and direct links to document review.

### Screen 2: Upload Documents & Live Pipeline (`/upload`)
* **Multi-Format Ingestion**: Drag-and-drop file uploader supporting PDF, TIFF, JPG, PNG, and DOCX files.
* **Workspace & Policy Routing**: Select workspace (*Legal · Contracts*), document type (*Auto-detect* / manual), compliance policy (*Commercial contracts v4*), and confidence threshold routing.
* **Batch Monitor & Live Activity**: Batch progress bar and live agent activity stream with millisecond timestamps (*Extract found 23 fields...*, *Classify labelled Invoice...*, *OCR deskewed 3 pages...*).
* **Multi-Stage Processing Queue**: Real-time progress bars showing files advancing through `OCR` $\rightarrow$ `Classify` $\rightarrow$ `Extract` $\rightarrow$ `Comply`.
* **Dynamic Document Routing**: Clicking any file in the processing table navigates directly to that document's dedicated viewer.

### Screen 3: Semantic Natural Language Search (`/search`)
* **Natural Language Query Decomposition**: Parses queries like *"Vendor contracts that auto-renew before June 2027 without a termination notice period"* into structured filter tags (`Type: Vendor contract`, `Renewal: Automatic`, `Renews before 30 Jun 2027`, `Notice period: none`).
* **AI Synthesized Answer**: Executive summary synthesized across matched contracts.
* **Faceted Sidebar Filters**: Filter by document type counts, risk severity badges (Critical, High, Medium, Low), counterparty, and minimum confidence slider.
* **Results Cards**: Displays highlighted matching clause snippets, renewal dates, contract value, counterparty, and match confidence %.

### Screen 4: Deep Document Review & Inspector (`/documents/[id]`)
* **Adaptive Multi-Format Canvas**:
  * **Master Agreements (PDF)**: Renders legal contract typography with sections for fees, renewal, liability caps, and governing jurisdiction.
  * **Scanned Files (TIFF)**: Displays raw optical scan telemetry (300 DPI, deskew angles) and deskewed text with OCR confidence ratings.
  * **Commercial Invoices**: Renders structured billing blocks, line-item itemizations, total sums, and payment terms discrepancy alerts.
* **Interactive Highlights**: Extracted fields (indigo borders) and risk clauses (rose borders).
* **Bidirectional Synchronization**: Clicking any extracted field or clause in the inspector highlights the text on the document page, and vice versa.
* **Status Controls**: **"Approve extraction"** and **"Send to legal review"** buttons persist status updates in MongoDB.

### Screen 5: Compliance & Audit Log (`/compliance`)
* **Severity Dashboard Tabs**: Filter issues by *All open issues* (17), *Critical* (4), *High* (6), *Medium* (5), and *Low* (2).
* **Chronological Decision Trail**: Full 5-step agent provenance timeline (OCR agent $\rightarrow$ Classify agent $\rightarrow$ Extract agent $\rightarrow$ Comply agent $\rightarrow$ Human review) with version tags and latencies.
* **Decision Override Modal**: Human reviewers can provide justification notes, appending an immutable audit record to the issue.
* **Export Audit Log**: Generates downloadable JSON audit reports.

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Create a production build
npm run build
npm run start
```
