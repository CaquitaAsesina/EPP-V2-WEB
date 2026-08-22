-- =====================================================
-- SISTEMA DE INVENTARIO DE EPP - BASE DE DATOS
-- =====================================================
-- Motor: MySQL 8.0+
-- =====================================================

DROP DATABASE IF EXISTS epp_inventory;
CREATE DATABASE epp_inventory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE epp_inventory;

-- =====================================================
-- TABLA: roles
-- =====================================================
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: users
-- =====================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(200),
    role_id INT NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    INDEX idx_users_role (role_id),
    INDEX idx_users_active (is_active)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: periods
-- =====================================================
CREATE TABLE periods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active TINYINT(1) DEFAULT 1,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_periods_active (is_active),
    INDEX idx_periods_dates (start_date, end_date)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: epp_types
-- =====================================================
CREATE TABLE epp_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_epp_types_active (is_active)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: sizes
-- =====================================================
CREATE TABLE sizes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sizes_active (is_active)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: epp_type_sizes (relación EPP-Talla)
-- =====================================================
CREATE TABLE epp_type_sizes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    epp_type_id INT NOT NULL,
    size_id INT NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_epp_type_size (epp_type_id, size_id),
    FOREIGN KEY (epp_type_id) REFERENCES epp_types(id) ON DELETE CASCADE,
    FOREIGN KEY (size_id) REFERENCES sizes(id) ON DELETE CASCADE,
    INDEX idx_epp_type_sizes_active (is_active)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: workers
-- =====================================================
CREATE TABLE workers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(200) NOT NULL,
    dni_encrypted TEXT NOT NULL,
    dni_hash VARCHAR(255) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_workers_dni_hash (dni_hash),
    INDEX idx_workers_active (is_active),
    INDEX idx_workers_name (full_name)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: user_preferences
-- =====================================================
CREATE TABLE user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    primary_color VARCHAR(7) DEFAULT '#DC2626',
    secondary_color VARCHAR(7) DEFAULT '#FFFFFF',
    background_color VARCHAR(7) DEFAULT '#F3F4F6',
    card_color VARCHAR(7) DEFAULT '#FFFFFF',
    text_color VARCHAR(7) DEFAULT '#1F2937',
    theme_mode VARCHAR(20) DEFAULT 'light',
    sidebar_style VARCHAR(20) DEFAULT 'dark',
    density VARCHAR(20) DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_preferences_user (user_id)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: clean_inventory_initial_stock
-- =====================================================
CREATE TABLE clean_inventory_initial_stock (
    id INT AUTO_INCREMENT PRIMARY KEY,
    period_id INT NOT NULL,
    epp_type_id INT NOT NULL,
    size_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_clean_stock_period_epp_size (period_id, epp_type_id, size_id),
    FOREIGN KEY (period_id) REFERENCES periods(id) ON DELETE CASCADE,
    FOREIGN KEY (epp_type_id) REFERENCES epp_types(id) ON DELETE RESTRICT,
    FOREIGN KEY (size_id) REFERENCES sizes(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_clean_stock_period (period_id),
    CONSTRAINT chk_clean_stock_qty CHECK (quantity >= 0)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: physical_inventories
-- =====================================================
CREATE TABLE physical_inventories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    period_id INT NOT NULL,
    epp_type_id INT NOT NULL,
    size_id INT NOT NULL,
    quantity INT NOT NULL,
    inventory_date DATE NOT NULL,
    observed_by INT,
    observation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_physical_inv_period_epp_size (period_id, epp_type_id, size_id),
    FOREIGN KEY (period_id) REFERENCES periods(id) ON DELETE CASCADE,
    FOREIGN KEY (epp_type_id) REFERENCES epp_types(id) ON DELETE RESTRICT,
    FOREIGN KEY (size_id) REFERENCES sizes(id) ON DELETE RESTRICT,
    FOREIGN KEY (observed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_physical_inv_period (period_id),
    INDEX idx_physical_inv_date (inventory_date),
    CONSTRAINT chk_physical_inv_qty CHECK (quantity >= 0)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: incomes (Ingresos de EPP)
-- =====================================================
CREATE TABLE incomes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    period_id INT NOT NULL,
    epp_type_id INT NOT NULL,
    size_id INT NOT NULL,
    quantity INT NOT NULL,
    reception_date DATE NOT NULL,
    provider VARCHAR(200),
    document_number VARCHAR(100),
    observation TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (period_id) REFERENCES periods(id) ON DELETE CASCADE,
    FOREIGN KEY (epp_type_id) REFERENCES epp_types(id) ON DELETE RESTRICT,
    FOREIGN KEY (size_id) REFERENCES sizes(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_incomes_period (period_id),
    INDEX idx_incomes_epp (epp_type_id, size_id),
    INDEX idx_incomes_date (reception_date),
    CONSTRAINT chk_incomes_qty CHECK (quantity > 0)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: deliveries (Entregas de EPP)
-- =====================================================
CREATE TABLE deliveries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    period_id INT NOT NULL,
    epp_type_id INT NOT NULL,
    size_id INT NOT NULL,
    worker_id INT NOT NULL,
    quantity INT NOT NULL,
    delivery_date DATE NOT NULL,
    observation TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (period_id) REFERENCES periods(id) ON DELETE CASCADE,
    FOREIGN KEY (epp_type_id) REFERENCES epp_types(id) ON DELETE RESTRICT,
    FOREIGN KEY (size_id) REFERENCES sizes(id) ON DELETE RESTRICT,
    FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_deliveries_period (period_id),
    INDEX idx_deliveries_epp (epp_type_id, size_id),
    INDEX idx_deliveries_worker (worker_id),
    INDEX idx_deliveries_date (delivery_date),
    CONSTRAINT chk_deliveries_qty CHECK (quantity > 0)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: returns (Devoluciones de EPP)
-- =====================================================
CREATE TABLE returns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    period_id INT NOT NULL,
    epp_type_id INT NOT NULL,
    size_id INT NOT NULL,
    worker_id INT NOT NULL,
    quantity INT NOT NULL,
    return_date DATE NOT NULL,
    observation TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (period_id) REFERENCES periods(id) ON DELETE CASCADE,
    FOREIGN KEY (epp_type_id) REFERENCES epp_types(id) ON DELETE RESTRICT,
    FOREIGN KEY (size_id) REFERENCES sizes(id) ON DELETE RESTRICT,
    FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_returns_period (period_id),
    INDEX idx_returns_epp (epp_type_id, size_id),
    INDEX idx_returns_worker (worker_id),
    INDEX idx_returns_date (return_date),
    CONSTRAINT chk_returns_qty CHECK (quantity > 0)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: laundry_movements (Movimientos de lavado)
-- =====================================================
CREATE TABLE laundry_movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    period_id INT NOT NULL,
    epp_type_id INT NOT NULL,
    size_id INT NOT NULL,
    quantity INT NOT NULL,
    status ENUM('para_lavar', 'mandado_lavar', 'lavado') NOT NULL DEFAULT 'para_lavar',
    movement_date DATE NOT NULL,
    observation TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (period_id) REFERENCES periods(id) ON DELETE CASCADE,
    FOREIGN KEY (epp_type_id) REFERENCES epp_types(id) ON DELETE RESTRICT,
    FOREIGN KEY (size_id) REFERENCES sizes(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_laundry_period (period_id),
    INDEX idx_laundry_epp (epp_type_id, size_id),
    INDEX idx_laundry_status (status),
    INDEX idx_laundry_date (movement_date),
    CONSTRAINT chk_laundry_qty CHECK (quantity > 0)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: inventory_movements (Kardex / Trazabilidad)
-- =====================================================
CREATE TABLE inventory_movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    period_id INT NOT NULL,
    movement_type VARCHAR(50) NOT NULL,
    epp_type_id INT NOT NULL,
    size_id INT NOT NULL,
    quantity INT NOT NULL,
    direction ENUM('in', 'out') NOT NULL,
    reference_id INT,
    reference_type VARCHAR(50),
    worker_id INT,
    observation TEXT,
    created_by INT,
    movement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (period_id) REFERENCES periods(id) ON DELETE CASCADE,
    FOREIGN KEY (epp_type_id) REFERENCES epp_types(id) ON DELETE RESTRICT,
    FOREIGN KEY (size_id) REFERENCES sizes(id) ON DELETE RESTRICT,
    FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_movements_period (period_id),
    INDEX idx_movements_type (movement_type),
    INDEX idx_movements_epp (epp_type_id, size_id),
    INDEX idx_movements_date (movement_date),
    INDEX idx_movements_reference (reference_id, reference_type)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: inventory_adjustments (Ajustes)
-- =====================================================
CREATE TABLE inventory_adjustments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    period_id INT NOT NULL,
    epp_type_id INT NOT NULL,
    size_id INT NOT NULL,
    adjustment_type ENUM('clean', 'dirty') NOT NULL,
    quantity INT NOT NULL,
    reason TEXT NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (period_id) REFERENCES periods(id) ON DELETE CASCADE,
    FOREIGN KEY (epp_type_id) REFERENCES epp_types(id) ON DELETE RESTRICT,
    FOREIGN KEY (size_id) REFERENCES sizes(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_adjustments_period (period_id)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: audit_logs
-- =====================================================
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(50) NOT NULL,
    module VARCHAR(100) NOT NULL,
    entity VARCHAR(100),
    entity_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_module (module),
    INDEX idx_audit_entity (entity, entity_id),
    INDEX idx_audit_date (created_at),
    INDEX idx_audit_action (action)
) ENGINE=InnoDB;

-- =====================================================
-- DATOS SEMILLA
-- =====================================================

-- Roles
INSERT INTO roles (name, description) VALUES
    ('admin', 'Administrador con acceso total al sistema'),
    ('lector', 'Usuario de solo lectura');

-- Usuarios semilla (el usuario admin se crea con la app, NO usar este hash)
-- Para crear el usuario admin, ejecutar el setup desde la interfaz o usar:
--   INSERT INTO users (username, password_hash, full_name, email, role_id)
--   VALUES ('admin', 'GENERAR_HASH_CON_BCRYPT', 'Administrador', 'admin@tudominio.com', 1);
-- Generar hash: node -e "console.log(require('bcryptjs').hashSync('TU_PASSWORD', 10))"

-- Tipos de EPP
INSERT INTO epp_types (name, description) VALUES
    ('Casco', 'Casco de protección industrial'),
    ('Chaleco', 'Chaleco de seguridad'),
    ('Polo', 'Polo de trabajo'),
    ('Pantalón', 'Pantalón de trabajo'),
    ('Botas', 'Botas de seguridad');

-- Tallas
INSERT INTO sizes (name, description) VALUES
    ('S', 'Pequeño'),
    ('M', 'Mediano'),
    ('L', 'Grande'),
    ('XL', 'Extra Grande'),
    ('XXL', 'Doble Extra Grande');

-- Preferencias del admin (se crean automáticamente al registrar el usuario)

-- Relación EPP-Todas las tallas
INSERT INTO epp_type_sizes (epp_type_id, size_id) VALUES
    (1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
    (2, 1), (2, 2), (2, 3), (2, 4), (2, 5),
    (3, 1), (3, 2), (3, 3), (3, 4), (3, 5),
    (4, 1), (4, 2), (4, 3), (4, 4), (4, 5),
    (5, 1), (5, 2), (5, 3), (5, 4), (5, 5);
