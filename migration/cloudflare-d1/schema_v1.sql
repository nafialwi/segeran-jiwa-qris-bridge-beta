PRAGMA foreign_keys = ON;

-- Segeran Jiwa Legacy -> Cloudflare D1 shadow schema v1.
-- Shadow-only: Firebase remains production authority until parity/cutover approval.
CREATE TABLE IF NOT EXISTS sj_schema_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT INTO sj_schema_meta(key,value) VALUES('schema_version','1')
ON CONFLICT(key) DO UPDATE SET value='1';

CREATE TABLE IF NOT EXISTS sj_products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  unit_price INTEGER NOT NULL DEFAULT 0,
  track_stock INTEGER NOT NULL DEFAULT 0 CHECK(track_stock IN (0,1)),
  cup_code TEXT,
  media_sha256 TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  legacy_path TEXT NOT NULL,
  raw_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sj_products_category ON sj_products(category,name);

CREATE TABLE IF NOT EXISTS sj_shifts (
  id TEXT PRIMARY KEY,
  business_date TEXT NOT NULL,
  shift_code TEXT,
  cashier_id TEXT,
  cashier_name TEXT,
  status TEXT,
  opened_at INTEGER,
  closed_at INTEGER,
  opening_cash INTEGER NOT NULL DEFAULT 0,
  expected_cash INTEGER,
  closing_cash INTEGER,
  sales_total INTEGER NOT NULL DEFAULT 0,
  cash_sales INTEGER NOT NULL DEFAULT 0,
  legacy_path TEXT NOT NULL,
  raw_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sj_shift_business_date ON sj_shifts(business_date,id);

CREATE TABLE IF NOT EXISTS sj_transactions (
  id TEXT PRIMARY KEY,
  operation_id TEXT,
  shift_id TEXT NOT NULL,
  business_date TEXT NOT NULL,
  created_at INTEGER,
  cashier_id TEXT,
  cashier_name TEXT,
  payment_method TEXT,
  subtotal INTEGER,
  discount_total INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  status TEXT,
  customer_id TEXT,
  legacy_path TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  FOREIGN KEY(shift_id) REFERENCES sj_shifts(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sj_tx_operation_id ON sj_transactions(operation_id) WHERE operation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sj_tx_business_date ON sj_transactions(business_date,created_at,id);
CREATE INDEX IF NOT EXISTS idx_sj_tx_shift ON sj_transactions(shift_id,created_at,id);

CREATE TABLE IF NOT EXISTS sj_transaction_items (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  line_no INTEGER NOT NULL,
  product_id TEXT,
  product_name TEXT NOT NULL,
  qty REAL NOT NULL,
  unit_price INTEGER NOT NULL DEFAULT 0,
  line_total INTEGER NOT NULL DEFAULT 0,
  cup_code TEXT,
  media_sha256 TEXT,
  legacy_path TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  FOREIGN KEY(transaction_id) REFERENCES sj_transactions(id)
);
CREATE INDEX IF NOT EXISTS idx_sj_tx_items_tx ON sj_transaction_items(transaction_id,line_no);
CREATE INDEX IF NOT EXISTS idx_sj_tx_items_product ON sj_transaction_items(product_id,transaction_id);

CREATE TABLE IF NOT EXISTS sj_expenses (
  id TEXT PRIMARY KEY,
  operation_id TEXT,
  shift_id TEXT,
  business_date TEXT NOT NULL,
  created_at INTEGER,
  amount INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  description TEXT,
  source TEXT,
  status TEXT,
  legacy_path TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  FOREIGN KEY(shift_id) REFERENCES sj_shifts(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sj_expense_operation_id ON sj_expenses(operation_id) WHERE operation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sj_expenses_date ON sj_expenses(business_date,created_at,id);

CREATE TABLE IF NOT EXISTS sj_customer_debts (
  id TEXT PRIMARY KEY,
  operation_id TEXT,
  customer_id TEXT,
  customer_name TEXT,
  origin_transaction_id TEXT,
  created_at INTEGER,
  original_amount INTEGER NOT NULL DEFAULT 0,
  paid_amount INTEGER NOT NULL DEFAULT 0,
  remaining_amount INTEGER NOT NULL DEFAULT 0,
  status TEXT,
  legacy_path TEXT NOT NULL,
  raw_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sj_customer_debts_customer ON sj_customer_debts(customer_id,status,created_at);

CREATE TABLE IF NOT EXISTS sj_debt_payments (
  id TEXT PRIMARY KEY,
  operation_id TEXT,
  debt_id TEXT NOT NULL,
  created_at INTEGER,
  amount INTEGER NOT NULL DEFAULT 0,
  payment_method TEXT,
  shift_id TEXT,
  legacy_path TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  FOREIGN KEY(debt_id) REFERENCES sj_customer_debts(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sj_debt_payment_operation_id ON sj_debt_payments(operation_id) WHERE operation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sj_debt_payments_debt ON sj_debt_payments(debt_id,created_at);

CREATE TABLE IF NOT EXISTS sj_inventory_purchases (
  id TEXT PRIMARY KEY,
  operation_id TEXT,
  created_at INTEGER,
  product_id TEXT,
  ingredient_id TEXT,
  qty REAL NOT NULL DEFAULT 0,
  total_cost INTEGER NOT NULL DEFAULT 0,
  source TEXT,
  status TEXT,
  reversed_by TEXT,
  legacy_path TEXT NOT NULL,
  raw_json TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sj_purchase_operation_id ON sj_inventory_purchases(operation_id) WHERE operation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sj_purchases_time ON sj_inventory_purchases(created_at,id);

CREATE TABLE IF NOT EXISTS sj_inventory_movements (
  id TEXT PRIMARY KEY,
  operation_id TEXT,
  created_at INTEGER,
  item_id TEXT,
  location_from TEXT,
  location_to TEXT,
  delta REAL NOT NULL DEFAULT 0,
  movement_type TEXT,
  shift_id TEXT,
  legacy_path TEXT NOT NULL,
  raw_json TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sj_inventory_movement_operation_id ON sj_inventory_movements(operation_id) WHERE operation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sj_inventory_movements_item ON sj_inventory_movements(item_id,created_at,id);

CREATE TABLE IF NOT EXISTS sj_refunds (
  id TEXT PRIMARY KEY,
  operation_id TEXT,
  original_transaction_id TEXT,
  shift_id TEXT,
  business_date TEXT,
  created_at INTEGER,
  total INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  status TEXT,
  legacy_path TEXT NOT NULL,
  raw_json TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sj_refund_operation_id ON sj_refunds(operation_id) WHERE operation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sj_refunds_tx ON sj_refunds(original_transaction_id,created_at);
CREATE INDEX IF NOT EXISTS idx_sj_refunds_date ON sj_refunds(business_date,created_at,id);

CREATE TABLE IF NOT EXISTS sj_restock_requests (
  id TEXT PRIMARY KEY,
  operation_id TEXT,
  created_at INTEGER,
  item_id TEXT,
  requested_qty REAL NOT NULL DEFAULT 0,
  sent_qty REAL,
  received_qty REAL,
  variance REAL,
  variance_reason TEXT,
  status TEXT,
  requested_by TEXT,
  received_by TEXT,
  legacy_path TEXT NOT NULL,
  raw_json TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sj_restock_operation_id ON sj_restock_requests(operation_id) WHERE operation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sj_restock_status ON sj_restock_requests(status,created_at,id);

CREATE TABLE IF NOT EXISTS sj_cup_counts (
  id TEXT PRIMARY KEY,
  operation_id TEXT,
  shift_id TEXT,
  cup_code TEXT NOT NULL,
  count_type TEXT NOT NULL,
  physical_qty REAL NOT NULL DEFAULT 0,
  expected_qty REAL,
  variance REAL,
  reason TEXT,
  created_at INTEGER,
  actor_id TEXT,
  legacy_path TEXT NOT NULL,
  raw_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sj_cup_counts_shift ON sj_cup_counts(shift_id,count_type,cup_code);

CREATE TABLE IF NOT EXISTS sj_owner_events (
  id TEXT PRIMARY KEY,
  operation_id TEXT,
  event_type TEXT NOT NULL,
  amount INTEGER,
  created_at INTEGER,
  actor_id TEXT,
  note TEXT,
  legacy_path TEXT NOT NULL,
  raw_json TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sj_owner_event_operation_id ON sj_owner_events(operation_id) WHERE operation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sj_owner_events_time ON sj_owner_events(created_at,event_type,id);

CREATE TABLE IF NOT EXISTS sj_month_close_events (
  id TEXT PRIMARY KEY,
  operation_id TEXT,
  month_key TEXT NOT NULL,
  event_type TEXT NOT NULL,
  created_at INTEGER,
  actor_id TEXT,
  snapshot_json TEXT,
  legacy_path TEXT NOT NULL,
  raw_json TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sj_month_close_operation_id ON sj_month_close_events(operation_id) WHERE operation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sj_month_close_month ON sj_month_close_events(month_key,created_at,id);

CREATE TABLE IF NOT EXISTS sj_audit_logs (
  id TEXT PRIMARY KEY,
  operation_id TEXT,
  action TEXT,
  actor_id TEXT,
  actor_name TEXT,
  detail TEXT,
  created_at INTEGER,
  legacy_path TEXT NOT NULL,
  raw_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sj_audit_time ON sj_audit_logs(created_at,id);
CREATE INDEX IF NOT EXISTS idx_sj_audit_action ON sj_audit_logs(action,created_at,id);

CREATE TABLE IF NOT EXISTS sj_media_objects (
  sha256 TEXT PRIMARY KEY,
  r2_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  byte_length INTEGER NOT NULL,
  source_count INTEGER NOT NULL DEFAULT 1,
  first_legacy_path TEXT NOT NULL,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS sj_import_ledger (
  id TEXT PRIMARY KEY,
  operation_id TEXT,
  source_name TEXT NOT NULL,
  source_sha256 TEXT NOT NULL,
  imported_at INTEGER NOT NULL,
  schema_version INTEGER NOT NULL,
  row_counts_json TEXT NOT NULL,
  parity_json TEXT NOT NULL,
  legacy_path TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sj_import_source_hash ON sj_import_ledger(source_sha256,schema_version);
