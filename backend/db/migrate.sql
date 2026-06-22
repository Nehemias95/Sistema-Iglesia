CREATE TABLE IF NOT EXISTS miembros (
    id_miembro SERIAL PRIMARY KEY,
    numero_identidad VARCHAR(20) UNIQUE NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE,
    genero VARCHAR(10) NOT NULL CHECK (genero IN ('Masculino', 'Femenino')),
    direccion TEXT,
    telefono VARCHAR(15),
    email VARCHAR(100),
    fecha_registro DATE DEFAULT CURRENT_DATE,
    estado VARCHAR(15) DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo', 'Trasladado', 'Fallecido')),
    fecha_bautismo DATE,
    actividad_economica VARCHAR(150),
    telefono_contacto VARCHAR(15),
    observaciones TEXT,
    foto VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS cargos (
    id_cargo SERIAL PRIMARY KEY,
    nombre_cargo VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    nivel_jerarquia INT DEFAULT 0,
    requiere_eleccion BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS privilegios (
    id_privilegio SERIAL PRIMARY KEY,
    nombre_privilegio VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    nivel_acceso INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS miembros_cargos (
    id_miembro_cargo SERIAL PRIMARY KEY,
    id_miembro INT NOT NULL REFERENCES miembros(id_miembro) ON DELETE CASCADE,
    id_cargo INT NOT NULL REFERENCES cargos(id_cargo) ON DELETE CASCADE,
    fecha_asignacion DATE DEFAULT CURRENT_DATE,
    fecha_fin DATE,
    activo BOOLEAN DEFAULT TRUE,
    UNIQUE (id_miembro, id_cargo, activo)
);

CREATE TABLE IF NOT EXISTS miembros_privilegios (
    id_miembro_privilegio SERIAL PRIMARY KEY,
    id_miembro INT NOT NULL REFERENCES miembros(id_miembro) ON DELETE CASCADE,
    id_privilegio INT NOT NULL REFERENCES privilegios(id_privilegio) ON DELETE CASCADE,
    fecha_asignacion DATE DEFAULT CURRENT_DATE,
    fecha_expiracion DATE,
    activo BOOLEAN DEFAULT TRUE,
    UNIQUE (id_miembro, id_privilegio, activo)
);

CREATE TABLE IF NOT EXISTS ministerios (
    id_ministerio SERIAL PRIMARY KEY,
    nombre_ministerio VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    fecha_creacion DATE DEFAULT CURRENT_DATE,
    estado VARCHAR(10) DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
    lider_id INT REFERENCES miembros(id_miembro) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS miembros_ministerios (
    id_miembro_ministerio SERIAL PRIMARY KEY,
    id_miembro INT NOT NULL REFERENCES miembros(id_miembro) ON DELETE CASCADE,
    id_ministerio INT NOT NULL REFERENCES ministerios(id_ministerio) ON DELETE CASCADE,
    fecha_ingreso DATE DEFAULT CURRENT_DATE,
    fecha_salida DATE,
    rol VARCHAR(50),
    activo BOOLEAN DEFAULT TRUE,
    UNIQUE (id_miembro, id_ministerio, activo)
);

CREATE TABLE IF NOT EXISTS ofrendas (
    id_ofrenda SERIAL PRIMARY KEY,
    fecha DATE DEFAULT CURRENT_DATE,
    monto DECIMAL(12,2) NOT NULL,
    id_miembro INT REFERENCES miembros(id_miembro) ON DELETE SET NULL,
    metodo_pago VARCHAR(15) DEFAULT 'Efectivo' CHECK (metodo_pago IN ('Efectivo', 'Transferencia', 'Cheque', 'Tarjeta', 'Otro')),
    referencia VARCHAR(100),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT
);

CREATE TABLE IF NOT EXISTS categorias_ofrendas (
    id_categoria SERIAL PRIMARY KEY,
    nombre_categoria VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    codigo_contable VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ofrendas_categorias (
    id_ofrenda_categoria SERIAL PRIMARY KEY,
    id_ofrenda INT NOT NULL REFERENCES ofrendas(id_ofrenda) ON DELETE CASCADE,
    id_categoria INT NOT NULL REFERENCES categorias_ofrendas(id_categoria) ON DELETE CASCADE,
    monto_asignado DECIMAL(12,2) NOT NULL CHECK (monto_asignado > 0),
    porcentaje DECIMAL(5,2),
    observaciones TEXT
);

CREATE TABLE IF NOT EXISTS eventos (
    id_evento SERIAL PRIMARY KEY,
    nombre_evento VARCHAR(200) NOT NULL,
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP,
    lugar VARCHAR(200),
    id_ministerio INT REFERENCES ministerios(id_ministerio) ON DELETE SET NULL,
    descripcion TEXT,
    estado VARCHAR(12) DEFAULT 'Programado' CHECK (estado IN ('Programado', 'En curso', 'Finalizado', 'Cancelado'))
);

CREATE TABLE IF NOT EXISTS asistencia (
    id_asistencia SERIAL PRIMARY KEY,
    id_miembro INT NOT NULL REFERENCES miembros(id_miembro) ON DELETE CASCADE,
    id_evento INT NOT NULL REFERENCES eventos(id_evento) ON DELETE CASCADE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado_asistencia VARCHAR(12) DEFAULT 'Presente' CHECK (estado_asistencia IN ('Presente', 'Ausente', 'Justificado')),
    hora_llegada TIME,
    observaciones TEXT,
    UNIQUE (id_miembro, id_evento)
);

CREATE INDEX IF NOT EXISTS idx_miembros_nombres ON miembros(nombres, apellidos);
CREATE INDEX IF NOT EXISTS idx_miembros_estado ON miembros(estado);
CREATE INDEX IF NOT EXISTS idx_miembros_fecha_registro ON miembros(fecha_registro);
CREATE INDEX IF NOT EXISTS idx_ofrendas_fecha ON ofrendas(fecha);
CREATE INDEX IF NOT EXISTS idx_ofrendas_miembro ON ofrendas(id_miembro);
CREATE INDEX IF NOT EXISTS idx_ofrendas_metodo ON ofrendas(metodo_pago);
CREATE INDEX IF NOT EXISTS idx_ofrendas_categorias_categoria ON ofrendas_categorias(id_categoria);
CREATE INDEX IF NOT EXISTS idx_ofrendas_categorias_ofrenda ON ofrendas_categorias(id_ofrenda);
CREATE INDEX IF NOT EXISTS idx_miembros_cargos_miembro ON miembros_cargos(id_miembro);
CREATE INDEX IF NOT EXISTS idx_miembros_cargos_cargo ON miembros_cargos(id_cargo);
CREATE INDEX IF NOT EXISTS idx_miembros_cargos_activo ON miembros_cargos(activo);
CREATE INDEX IF NOT EXISTS idx_miembros_ministerios_miembro ON miembros_ministerios(id_miembro);
CREATE INDEX IF NOT EXISTS idx_miembros_ministerios_ministerio ON miembros_ministerios(id_ministerio);
CREATE INDEX IF NOT EXISTS idx_miembros_ministerios_activo ON miembros_ministerios(activo);
CREATE INDEX IF NOT EXISTS idx_asistencia_evento ON asistencia(id_evento);
CREATE INDEX IF NOT EXISTS idx_asistencia_miembro ON asistencia(id_miembro);
CREATE INDEX IF NOT EXISTS idx_asistencia_fecha ON asistencia(fecha_registro);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha_inicio ON eventos(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_eventos_estado ON eventos(estado);
CREATE INDEX IF NOT EXISTS idx_eventos_ministerio ON eventos(id_ministerio);
CREATE INDEX IF NOT EXISTS idx_miembros_privilegios_miembro ON miembros_privilegios(id_miembro);
CREATE INDEX IF NOT EXISTS idx_miembros_privilegios_privilegio ON miembros_privilegios(id_privilegio);
CREATE INDEX IF NOT EXISTS idx_miembros_privilegios_activo ON miembros_privilegios(activo);

-- Migración para tablas existentes (agrega columnas faltantes)
ALTER TABLE miembros ADD COLUMN IF NOT EXISTS actividad_economica VARCHAR(150);
ALTER TABLE miembros ADD COLUMN IF NOT EXISTS telefono_contacto VARCHAR(15);
ALTER TABLE ofrendas ADD COLUMN IF NOT EXISTS id_evento INT REFERENCES eventos(id_evento) ON DELETE SET NULL;

-- =============================================
-- TABLA DE CONFIGURACIÓN
-- =============================================
CREATE TABLE IF NOT EXISTS configuracion (
    id_config SERIAL PRIMARY KEY,
    clave VARCHAR(50) UNIQUE NOT NULL,
    valor TEXT,
    tipo VARCHAR(20) DEFAULT 'texto',
    descripcion VARCHAR(200)
);

INSERT INTO configuracion (clave, valor, tipo, descripcion)
SELECT 'nombre_iglesia', 'Iglesia EFESO', 'texto', 'Nombre de la iglesia'
WHERE NOT EXISTS (SELECT 1 FROM configuracion WHERE clave = 'nombre_iglesia');

INSERT INTO configuracion (clave, valor, tipo, descripcion)
SELECT 'email_servidor', '', 'texto', 'Servidor SMTP (ej: smtp.gmail.com)'
WHERE NOT EXISTS (SELECT 1 FROM configuracion WHERE clave = 'email_servidor');

INSERT INTO configuracion (clave, valor, tipo, descripcion)
SELECT 'email_puerto', '587', 'numero', 'Puerto SMTP'
WHERE NOT EXISTS (SELECT 1 FROM configuracion WHERE clave = 'email_puerto');

INSERT INTO configuracion (clave, valor, tipo, descripcion)
SELECT 'email_usuario', '', 'texto', 'Usuario de correo electrónico'
WHERE NOT EXISTS (SELECT 1 FROM configuracion WHERE clave = 'email_usuario');

INSERT INTO configuracion (clave, valor, tipo, descripcion)
SELECT 'email_password', '', 'password', 'Contraseña de correo electrónico'
WHERE NOT EXISTS (SELECT 1 FROM configuracion WHERE clave = 'email_password');

INSERT INTO configuracion (clave, valor, tipo, descripcion)
SELECT 'email_ssl', 'true', 'booleano', 'Usar SSL/TLS'
WHERE NOT EXISTS (SELECT 1 FROM configuracion WHERE clave = 'email_ssl');

INSERT INTO configuracion (clave, valor, tipo, descripcion)
SELECT 'logo_iglesia', '', 'texto', 'Logo o sello de la iglesia (ruta de imagen)'
WHERE NOT EXISTS (SELECT 1 FROM configuracion WHERE clave = 'logo_iglesia');

INSERT INTO configuracion (clave, valor, tipo, descripcion)
SELECT 'mision_iglesia', '', 'texto', 'Misión a la que pertenece la iglesia'
WHERE NOT EXISTS (SELECT 1 FROM configuracion WHERE clave = 'mision_iglesia');

-- =============================================
-- TABLA DE USUARIOS
-- =============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(100) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('Admin', 'Pastor', 'Tesorero', 'Digitador')),
    id_miembro INT REFERENCES miembros(id_miembro) ON DELETE SET NULL,
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usuario admin por defecto (password: admin)
-- IMPORTANTE: Cambiar la contraseña después del primer inicio de sesión
INSERT INTO usuarios (username, password_hash, nombre_completo, rol)
SELECT 'admin', '$2b$10$rI.aaQNE9NnYp0CZXECIA.lrlL67TL6pZrVZZCT852Lj60Z7KUkPC', 'Administrador', 'Admin'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE username = 'admin');

-- =============================================
-- TABLA DE BITÁCORA (AUDITORÍA)
-- =============================================
CREATE TABLE IF NOT EXISTS bitacora (
    id_bitacora SERIAL PRIMARY KEY,
    id_usuario INT REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    username VARCHAR(50),
    nombre_usuario VARCHAR(100),
    accion VARCHAR(20) NOT NULL,
    tabla VARCHAR(50) NOT NULL,
    id_registro INT,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    direccion_ip VARCHAR(45),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bitacora_fecha ON bitacora(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_bitacora_usuario ON bitacora(id_usuario);
CREATE INDEX IF NOT EXISTS idx_bitacora_tabla ON bitacora(tabla);

-- =============================================
-- TABLA DE DIEZMOS
-- =============================================
CREATE TABLE IF NOT EXISTS diezmos (
    id_diezmo SERIAL PRIMARY KEY,
    monto DECIMAL(12,2) NOT NULL,
    id_miembro INT REFERENCES miembros(id_miembro) ON DELETE SET NULL,
    metodo_pago VARCHAR(20) DEFAULT 'Efectivo',
    referencia VARCHAR(100),
    observaciones TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
