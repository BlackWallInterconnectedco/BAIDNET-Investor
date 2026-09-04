export const KNOWLEDGE = `# BAIDNET Platform Knowledge Base

## 1) Platform At-a-Glance
BAIDNET operates as one platform with a common transaction architecture and distinct settlement paths: a blockchain path for digital-asset settlement and a fiat path for bank-rail settlement behind sponsor-bank integration boundaries. Internal BAIDNET FinTech engineering is COMPLETE / PASS. Live sponsor-bank production parity remains OPEN as an external dependency.

## 2) Governing Architecture and Authority Boundary
The governing rule is to extend existing BAIDNET architecture and not create a duplicate fintech core. BAIDNET controls internal transaction representation, correlation, workflow evidence, reconciliation logic, APIs, and integration boundaries. The sponsor bank remains authoritative for regulated bank execution records and settlement references.

## 3) Product and Service Catalog
Active/evidence-backed capabilities include wallet valuation and balance consumption, blockchain-settled payment execution, fiat transaction lifecycle engineering, versioned financial primitives APIs, reconciliation and exception operations, dispute workflow, sponsor-bank boundary runtime evidence, and runtime closeout gates. External sponsor-bank gates remain open.

## 4) Compliance and Governance Posture
Classification framework: INHERITED, EXTEND, INTEGRATE, BUILD, VERIFY, BANK DECISION, COUNSEL / CONTRACT. Sponsor-bank parity assertions remain external and open, including live settlement verification, callback parity, reconciliation parity, partner rail onboarding for ACH/debit/FBO, and formal attestation/sign-off.

## 5) Risk Mitigation and Control Model
Controls include canonical currency routing, fail-closed USD-on-blockchain prevention, idempotency enforcement, normalized risk classification, deterministic reconciliation, exception workflow, and explicit timeout/transport/HTTP failure handling.

## 6) Security Baseline
Security controls include Helmet/custom headers, Express rate limiting, failed-auth tracking and temporary lockout, CSRF controls, protected routes, and sponsor-bank callback controls using webhook keys, timestamp skew checks, optional HMAC verification, and timing-safe comparison.

## 7) API Structure and Contract Layers
Primary mounts include /api/fiat, /api/v1/financial, and /api/payments. Capabilities cover fiat lifecycle actions, callback ingress, reconciliation, workflow, runtime health/closeout/integration-boundary evidence, versioned financial primitives, idempotent lifecycle actions, dispute workflow, context/events/correlation/audit-trail/export, and standardized versioned response envelopes.

## 8) Data and Evidence Integrity Model
Canonical evidence surfaces include FiatTransaction, TransactionLifecycleEvent, FinancialApiEvent, idempotency persistence, audit/outbox/agency-ledger journaling, and deterministic SHA-256 bundleHash export receipts.

## 9) Technical Integrity and Cross-Workstream Continuity
A through G establish continuity from runtime baseline, to fiat lifecycle, to versioned financial primitives, unified audit reconstruction, deterministic reconciliation, sponsor-bank integration boundary, and end-to-end validation/final closeout.

## 10) Frontend Web Baseline
The active frontend consumes backend-authoritative valuation and authentication mappings. Frontends must not manufacture authoritative financial state.

## 11) Mobile Baseline
The mobile baseline consumes valuation/account data, supports BDC/USD/ETH/BTC/USDC display contexts, includes fail-closed USD hover policy requiring the fiat lifecycle path, and exposes fiat transaction history by participant.

## 12) UI/UX Extension Program Requirements
The Wallet <-> FinTech toggle changes context only and performs no implicit transfer or conversion. Fiat and blockchain balances remain separated. Selected currency stays stable through execution. USD never settles through blockchain and blockchain assets never settle through fiat. Frontends consume backend-authoritative state. Sponsor-bank-dependent capabilities remain marked external until validated.

## 13) Program Status
Workstream A: pass. B: engineering pass with live parity external. C: pass. D: pass. E: internal engineering pass. F: F1 pass, F2 external attestation initiated. G: G1 pass and final A-G closeout closed.

## 14) External Gaps and Dependency Register
EXT-01 sponsor-bank live settlement verification: OPEN EXTERNAL. EXT-02 callback parity verification: OPEN EXTERNAL. EXT-03 reconciliation parity verification: OPEN EXTERNAL. EXT-04 partner-specific ACH/debit/FBO onboarding/sign-off: OPEN EXTERNAL. EXT-05 completed sponsor-bank attestation artifacts: OPEN EXTERNAL.

## 15) Canonical Verification Evidence Index
Primary evidence includes workstream A-G traceability matrices and final consolidated closeout artifacts, backend fiat lifecycle and financial primitives documentation, and frontend/mobile runtime and valuation consumption maps.

## 16) Maintenance Protocol
Update the knowledge base when workstream status, API contracts, security posture, sponsor-bank evidence, or Web/Mobile UI evidence changes. Evidence rule: no material claim without a corresponding approved source or repository artifact reference.`;
