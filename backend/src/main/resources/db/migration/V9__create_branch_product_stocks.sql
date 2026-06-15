CREATE TABLE branch_product_stocks (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id),
    branch_id BIGINT NOT NULL REFERENCES branches(id),
    stock INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_branch_product_stocks_product_branch UNIQUE (product_id, branch_id)
);

CREATE INDEX idx_branch_product_stocks_branch_product ON branch_product_stocks(branch_id, product_id);
CREATE INDEX idx_branch_product_stocks_product_branch ON branch_product_stocks(product_id, branch_id);
CREATE INDEX idx_branch_product_stocks_stock ON branch_product_stocks(stock);

INSERT INTO branch_product_stocks (product_id, branch_id, stock, created_at, updated_at)
SELECT product.id,
       (
           SELECT branch.id
           FROM branches branch
           WHERE branch.active = true
           ORDER BY branch.id
           LIMIT 1
       ),
       product.stock,
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
FROM products product
WHERE EXISTS (
    SELECT 1
    FROM branches branch
    WHERE branch.active = true
)
AND product.stock > 0;

INSERT INTO branch_product_stocks (product_id, branch_id, stock, created_at, updated_at)
SELECT product.id,
       (
           SELECT branch.id
           FROM branches branch
           ORDER BY branch.id
           LIMIT 1
       ),
       product.stock,
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
FROM products product
WHERE product.stock > 0
  AND NOT EXISTS (SELECT 1 FROM branch_product_stocks)
  AND EXISTS (SELECT 1 FROM branches);
