PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS emg_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT INTO emg_meta(key,value) VALUES('schema_version','1')
ON CONFLICT(key) DO UPDATE SET value='1';

CREATE TABLE IF NOT EXISTS emg_master_snapshots (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  version INTEGER NOT NULL,
  payload_json TEXT NOT NULL,
  checksum TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 0 CHECK(active IN (0,1))
);
CREATE INDEX IF NOT EXISTS idx_emg_master_active ON emg_master_snapshots(active,created_at);

CREATE TABLE IF NOT EXISTS emg_shifts (
  id TEXT PRIMARY KEY,
  business_date TEXT NOT NULL,
  shift_code TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('ACTIVE','CLOSED')),
  cashier_id TEXT NOT NULL,
  cashier_name TEXT NOT NULL,
  opened_at TEXT NOT NULL,
  closed_at TEXT,
  opening_cash INTEGER NOT NULL DEFAULT 0 CHECK(opening_cash >= 0),
  closing_cash INTEGER CHECK(closing_cash IS NULL OR closing_cash >= 0),
  expected_cash INTEGER,
  variance INTEGER,
  note TEXT,
  open_operation_id TEXT NOT NULL UNIQUE,
  close_operation_id TEXT UNIQUE,
  is_drill INTEGER NOT NULL DEFAULT 0 CHECK(is_drill IN (0,1))
);
CREATE INDEX IF NOT EXISTS idx_emg_shift_status ON emg_shifts(status,opened_at);
CREATE INDEX IF NOT EXISTS idx_emg_shift_date ON emg_shifts(business_date,shift_code);

CREATE TABLE IF NOT EXISTS emg_transactions (
  id TEXT PRIMARY KEY,
  operation_id TEXT NOT NULL UNIQUE,
  shift_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  cashier_id TEXT NOT NULL,
  cashier_name TEXT NOT NULL,
  method TEXT NOT NULL CHECK(method IN ('TUNAI','TRANSFER','QRIS')),
  subtotal INTEGER NOT NULL CHECK(subtotal >= 0),
  discount_total INTEGER NOT NULL DEFAULT 0 CHECK(discount_total >= 0),
  total INTEGER NOT NULL CHECK(total >= 0),
  cash_received INTEGER NOT NULL DEFAULT 0 CHECK(cash_received >= 0),
  status TEXT NOT NULL CHECK(status IN ('COMPLETED','VOIDED')),
  payload_json TEXT NOT NULL,
  reconciled_at TEXT,
  is_drill INTEGER NOT NULL DEFAULT 0 CHECK(is_drill IN (0,1)),
  FOREIGN KEY(shift_id) REFERENCES emg_shifts(id)
);
CREATE INDEX IF NOT EXISTS idx_emg_tx_shift_time ON emg_transactions(shift_id,created_at);
CREATE INDEX IF NOT EXISTS idx_emg_tx_unreconciled ON emg_transactions(reconciled_at,is_drill,created_at);

CREATE TABLE IF NOT EXISTS emg_transaction_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tx_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  qty REAL NOT NULL CHECK(qty > 0),
  unit_price INTEGER NOT NULL CHECK(unit_price >= 0),
  cup_code TEXT,
  line_total INTEGER NOT NULL CHECK(line_total >= 0),
  payload_json TEXT NOT NULL,
  FOREIGN KEY(tx_id) REFERENCES emg_transactions(id)
);
CREATE INDEX IF NOT EXISTS idx_emg_tx_items_tx ON emg_transaction_items(tx_id);

CREATE TABLE IF NOT EXISTS emg_cash_events (
  id TEXT PRIMARY KEY,
  operation_id TEXT NOT NULL UNIQUE,
  shift_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('OPENING','EXPENSE','CASH_IN','CASH_OUT','CLOSING')),
  amount INTEGER NOT NULL CHECK(amount >= 0),
  note TEXT,
  created_at TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  reconciled_at TEXT,
  is_drill INTEGER NOT NULL DEFAULT 0 CHECK(is_drill IN (0,1)),
  FOREIGN KEY(shift_id) REFERENCES emg_shifts(id)
);
CREATE INDEX IF NOT EXISTS idx_emg_cash_shift ON emg_cash_events(shift_id,created_at);

CREATE TABLE IF NOT EXISTS emg_inventory_balance (
  product_id TEXT PRIMARY KEY,
  qty REAL NOT NULL CHECK(qty >= 0),
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS emg_inventory_events (
  id TEXT PRIMARY KEY,
  operation_id TEXT NOT NULL UNIQUE,
  shift_id TEXT NOT NULL,
  product_id TEXT,
  cup_code TEXT,
  delta REAL NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('SALE','ADJUSTMENT','OPENING','CLOSING')),
  created_at TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  reconciled_at TEXT,
  is_drill INTEGER NOT NULL DEFAULT 0 CHECK(is_drill IN (0,1)),
  FOREIGN KEY(shift_id) REFERENCES emg_shifts(id)
);
CREATE INDEX IF NOT EXISTS idx_emg_inv_shift ON emg_inventory_events(shift_id,created_at);
CREATE INDEX IF NOT EXISTS idx_emg_inv_unreconciled ON emg_inventory_events(reconciled_at,is_drill,created_at);

CREATE TABLE IF NOT EXISTS emg_audit (
  id TEXT PRIMARY KEY,
  operation_id TEXT,
  action TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  detail_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  is_drill INTEGER NOT NULL DEFAULT 0 CHECK(is_drill IN (0,1))
);
CREATE INDEX IF NOT EXISTS idx_emg_audit_time ON emg_audit(created_at);

CREATE TABLE IF NOT EXISTS emg_auth_attempts (
  fingerprint TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  failures INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER NOT NULL DEFAULT 0
);
