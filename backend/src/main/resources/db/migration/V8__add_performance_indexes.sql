CREATE INDEX idx_sales_status_branch_created ON sales(status, branch_id, created_at);
CREATE INDEX idx_sales_status_creator_created ON sales(status, created_by, created_at);

CREATE INDEX idx_purchases_status_branch_created ON purchases(status, branch_id, created_at);
CREATE INDEX idx_purchases_status_supplier_created ON purchases(status, supplier_id, created_at);

CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);

CREATE INDEX idx_purchase_items_purchase ON purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_product ON purchase_items(product_id);

CREATE INDEX idx_stock_movements_product_branch_created ON stock_movements(product_id, branch_id, created_at);

CREATE INDEX idx_products_active_category_name ON products(active, category, name);
CREATE INDEX idx_products_active_stock ON products(active, stock);

CREATE INDEX idx_branches_active_name ON branches(active, name);
CREATE INDEX idx_suppliers_active_name ON suppliers(active, name);
