import express from 'express';
import cors from 'cors';
import db from './config/db.js';

const app = express();
app.use(cors());
app.use(express.json());

// ====================================
//              HOME
// ====================================
app.get('/', (req, res) => {
  res.json({ 
    message: 'API funcionando correctamente',
    version: '2.0.0',
    endpoints: {
      usuarios: '/usuario',
      usuario_especifico: '/usuario/:id',
      usuario_estado: '/usuario/:id/estado',
      impresoras: '/impresoras',
      login: '/login',
      verificarCodigo: '/impresoras/verificar-codigo?codigo=VEDXXXX',
      crear_columnas_usuario: '/crear-columnas-usuario',
      crear_columna_fecha: '/crear-columna-fecha'
    }
  });
});

// ====================================
//              USUARIOS
// ====================================

// Obtener todos los usuarios (ACTUALIZADO CON TODOS LOS CAMPOS)
app.get('/usuario', (req, res) => {
  const sql = `
    SELECT 
      id, 
      username, 
      password, 
      nombre_completo, 
      correo,
      COALESCE(fecha_registro, NOW()) as fecha_registro,
      COALESCE(estado, 'activo') as estado,
      COALESCE(telefono, 'No especificado') as telefono,
      COALESCE(rol, 'usuario') as rol,
      COALESCE(ultimo_acceso, NOW()) as ultimo_acceso
    FROM usuario
    ORDER BY COALESCE(fecha_registro, NOW()) DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Obtener un usuario por ID (ACTUALIZADO CON TODOS LOS CAMPOS)
app.get('/usuario/:id', (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      id, 
      username, 
      password, 
      nombre_completo, 
      correo,
      COALESCE(fecha_registro, NOW()) as fecha_registro,
      COALESCE(estado, 'activo') as estado,
      COALESCE(telefono, 'No especificado') as telefono,
      COALESCE(rol, 'usuario') as rol,
      COALESCE(ultimo_acceso, NOW()) as ultimo_acceso
    FROM usuario 
    WHERE id = ?
  `;
  
  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length === 0)
      return res.status(404).json({ error: "Usuario no encontrado" });

    res.json(results[0]);
  });
});

// Crear usuario (ACTUALIZADO CON TODOS LOS CAMPOS)
app.post('/usuario', (req, res) => {
  const { 
    username, 
    password, 
    nombre_completo, 
    correo,
    telefono,
    rol
  } = req.body;

  // Validación de campos obligatorios
  if (!username || !password || !nombre_completo || !correo) {
    return res.status(400).json({ 
      error: "Todos los campos son obligatorios (username, password, nombre_completo, correo)" 
    });
  }

  const sql = `
    INSERT INTO usuario 
    (username, password, nombre_completo, correo, telefono, rol, fecha_registro, estado)
    VALUES (?, ?, ?, ?, ?, ?, NOW(), 'activo')
  `;

  const params = [
    username, 
    password, 
    nombre_completo, 
    correo,
    telefono || 'No especificado',
    rol || 'usuario'
  ];

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    // Devolver el usuario creado con todos sus datos
    const getSql = `
      SELECT 
        id, 
        username, 
        password, 
        nombre_completo, 
        correo,
        COALESCE(fecha_registro, NOW()) as fecha_registro,
        COALESCE(estado, 'activo') as estado,
        COALESCE(telefono, 'No especificado') as telefono,
        COALESCE(rol, 'usuario') as rol,
        COALESCE(ultimo_acceso, NOW()) as ultimo_acceso
      FROM usuario 
      WHERE id = ?
    `;

    db.query(getSql, [result.insertId], (err, userResult) => {
      if (err) return res.status(500).json({ error: err.message });

      res.status(201).json({ 
        message: "Usuario creado correctamente", 
        id: result.insertId,
        user: userResult[0]
      });
    });
  });
});

// Actualizar usuario (NUEVO ENDPOINT)
app.put('/usuario/:id', (req, res) => {
  const { id } = req.params;
  const { 
    username, 
    password, 
    nombre_completo, 
    correo,
    telefono,
    rol,
    estado
  } = req.body;

  // Primero obtener el usuario actual
  const getSql = `
    SELECT 
      id, 
      username, 
      password, 
      nombre_completo, 
      correo,
      COALESCE(telefono, 'No especificado') as telefono,
      COALESCE(rol, 'usuario') as rol,
      COALESCE(estado, 'activo') as estado
    FROM usuario 
    WHERE id = ?
  `;
  
  db.query(getSql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (results.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const user = results[0];
    
    // Usar valores existentes si no se proporcionan nuevos
    const updatedData = {
      username: username || user.username,
      password: password || user.password,
      nombre_completo: nombre_completo || user.nombre_completo,
      correo: correo || user.correo,
      telefono: telefono || user.telefono,
      rol: rol || user.rol,
      estado: estado || user.estado,
      ultimo_acceso: new Date()
    };

    const updateSql = `
      UPDATE usuario 
      SET 
        username = ?, 
        password = ?, 
        nombre_completo = ?, 
        correo = ?, 
        telefono = ?, 
        rol = ?, 
        estado = ?,
        ultimo_acceso = ?
      WHERE id = ?
    `;

    const params = [
      updatedData.username,
      updatedData.password,
      updatedData.nombre_completo,
      updatedData.correo,
      updatedData.telefono,
      updatedData.rol,
      updatedData.estado,
      updatedData.ultimo_acceso,
      id
    ];

    db.query(updateSql, params, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      // Devolver el usuario actualizado
      const getUpdatedSql = `
        SELECT 
          id, 
          username, 
          password, 
          nombre_completo, 
          correo,
          COALESCE(fecha_registro, NOW()) as fecha_registro,
          COALESCE(estado, 'activo') as estado,
          COALESCE(telefono, 'No especificado') as telefono,
          COALESCE(rol, 'usuario') as rol,
          COALESCE(ultimo_acceso, NOW()) as ultimo_acceso
        FROM usuario 
        WHERE id = ?
      `;

      db.query(getUpdatedSql, [id], (err, updatedUser) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({ 
          message: "Usuario actualizado correctamente",
          user: updatedUser[0]
        });
      });
    });
  });
});

// Activar/Desactivar usuario (NUEVO ENDPOINT)
app.put('/usuario/:id/estado', (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  // Validar que el estado sea válido
  if (estado !== 'activo' && estado !== 'inactivo') {
    return res.status(400).json({ 
      error: "Estado no válido. Debe ser 'activo' o 'inactivo'" 
    });
  }

  const sql = `
    UPDATE usuario 
    SET estado = ?, ultimo_acceso = NOW() 
    WHERE id = ?
  `;

  db.query(sql, [estado, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Devolver el usuario actualizado
    const getSql = `
      SELECT 
        id, 
        username, 
        nombre_completo, 
        correo,
        COALESCE(fecha_registro, NOW()) as fecha_registro,
        COALESCE(estado, 'activo') as estado,
        COALESCE(telefono, 'No especificado') as telefono,
        COALESCE(rol, 'usuario') as rol,
        COALESCE(ultimo_acceso, NOW()) as ultimo_acceso
      FROM usuario 
      WHERE id = ?
    `;

    db.query(getSql, [id], (err, userResult) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json({ 
        message: `Usuario ${estado === 'activo' ? 'activado' : 'desactivado'} correctamente`,
        estado: estado,
        user: userResult[0]
      });
    });
  });
});

// Eliminar usuario (YA EXISTENTE Y FUNCIONAL)
app.delete('/usuario/:id', (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM usuario WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ 
      message: "Usuario eliminado correctamente",
      id: id
    });
  });
});

// ====================================
//              IMPRESORAS
// ====================================

// NUEVO: Verificar si un código es único
app.get('/impresoras/verificar-codigo', (req, res) => {
  const { codigo } = req.query;

  console.log('🔍 Verificando código:', codigo);

  if (!codigo) {
    return res.status(400).json({ 
      error: 'Se requiere el parámetro "codigo"' 
    });
  }

  // Verificar que el código empiece con VED
  if (!codigo.startsWith('VED')) {
    return res.status(400).json({ 
      error: 'El código debe comenzar con VED' 
    });
  }

  const sql = "SELECT COUNT(*) as count FROM impresoras WHERE codigo_rastreo = ?";
  
  console.log('SQL a ejecutar:', sql, 'con valor:', codigo);
  
  db.query(sql, [codigo], (err, results) => {
    if (err) {
      console.error('❌ Error verificando código:', err);
      return res.status(500).json({ 
        error: 'Error del servidor al verificar código',
        details: err.message 
      });
    }

    console.log('✅ Resultados:', results);
    
    // Asegurarse de que results tenga la estructura correcta
    const count = results && results[0] ? results[0].count : 0;
    const existe = count > 0;
    
    console.log(`📊 Código ${codigo} - Existe: ${existe}, Count: ${count}`);
    
    res.json({
      codigo: codigo,
      disponible: !existe,
      existe: existe,
      count: count,
      mensaje: existe 
        ? `El código ${codigo} ya está registrado` 
        : `El código ${codigo} está disponible`
    });
  });
});

// Obtener todas las impresoras (CORREGIDO: quitar ORDER BY fecha_registro si no existe)
app.get('/impresoras', (req, res) => {
  // Primero verificar si existe la columna fecha_registro
  const checkColumnSql = `
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'impresoras' 
    AND COLUMN_NAME = 'fecha_registro'
  `;

  db.query(checkColumnSql, (err, columnResults) => {
    if (err) {
      console.error('Error verificando columna:', err);
      // Si hay error, usar consulta sin fecha_registro
      const query = `
        SELECT i.*, u.nombre_completo AS registrado_por_nombre
        FROM impresoras i
        LEFT JOIN usuario u ON i.registrado_por = u.id
        ORDER BY i.id DESC
      `;

      db.query(query, (err, results) => {
        if (err) {
          console.error('Error obteniendo impresoras:', err);
          return res.status(500).json({ error: err.message });
        }
        res.json(results);
      });
      return;
    }

    // Si existe la columna fecha_registro
    if (columnResults.length > 0) {
      const query = `
        SELECT i.*, u.nombre_completo AS registrado_por_nombre
        FROM impresoras i
        LEFT JOIN usuario u ON i.registrado_por = u.id
        ORDER BY i.fecha_registro DESC
      `;

      db.query(query, (err, results) => {
        if (err) {
          console.error('Error obteniendo impresoras:', err);
          return res.status(500).json({ error: err.message });
        }
        res.json(results);
      });
    } else {
      // Si no existe la columna fecha_registro
      const query = `
        SELECT i.*, u.nombre_completo AS registrado_por_nombre
        FROM impresoras i
        LEFT JOIN usuario u ON i.registrado_por = u.id
        ORDER BY i.id DESC
      `;

      db.query(query, (err, results) => {
        if (err) {
          console.error('Error obteniendo impresoras:', err);
          return res.status(500).json({ error: err.message });
        }
        res.json(results);
      });
    }
  });
});

// Obtener detalles de una impresora (CORREGIDO: manejar fecha_registro opcional)
app.get('/impresoras/:id/detalles', (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT i.*, u.nombre_completo, u.username
    FROM impresoras i
    LEFT JOIN usuario u ON i.registrado_por = u.id
    WHERE i.id = ?
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error obteniendo detalles:', err);
      return res.status(500).json({ error: 'Error del servidor' });
    }

    if (results.length === 0)
      return res.status(404).json({ error: 'Impresora no encontrada' });

    const impresora = results[0];

    // Construir respuesta sin fecha_registro si no existe
    const response = {
      id: impresora.id,
      codigo_rastreo: impresora.codigo_rastreo,
      cliente: impresora.cliente,
      cedula: impresora.cedula,
      celular: impresora.celular,
      problema: impresora.problema,
      estado: impresora.estado,
      marca: impresora.marca,
      modelo: impresora.modelo,
      registrado_por: impresora.registrado_por,
      fecha_registro: impresora.fecha_registro || new Date().toISOString(), // Valor por defecto
      usuario_registrador: {
        id: impresora.registrado_por,
        nombre_completo: impresora.nombre_completo,
        username: impresora.username
      }
    };

    res.json(response);
  });
});

// Buscar impresora por código
app.get('/impresoras/codigo/:codigo_rastreo', (req, res) => {
  const { codigo_rastreo } = req.params;
  const sql = "SELECT * FROM impresoras WHERE codigo_rastreo = ?";

  db.query(sql, [codigo_rastreo], (err, results) => {
    if (err) {
      console.error('Error buscando por código:', err);
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) return res.status(404).json({ error: "No encontrada" });

    res.json(results[0]);
  });
});

// Crear impresora (CORREGIDO: sin fecha_registro)
app.post('/impresoras', (req, res) => {
  const { codigo_rastreo, cliente, cedula, celular, problema, estado, marca, modelo, registrado_por } = req.body;

  console.log('📝 Creando impresora con datos:', req.body);

  // Validación de campos requeridos
  if (!codigo_rastreo || !cliente || !cedula || !celular || !problema || !marca || !modelo || !registrado_por) {
    return res.status(400).json({ 
      error: "Todos los campos son obligatorios excepto estado",
      campos_recibidos: Object.keys(req.body)
    });
  }

  // Validar formato del código
  if (!codigo_rastreo.startsWith('VED')) {
    return res.status(400).json({ error: "El código debe comenzar con 'VED'" });
  }

  // Validar cédula ecuatoriana (10 dígitos)
  if (!/^\d{10}$/.test(cedula)) {
    return res.status(400).json({ error: "Cédula inválida. Debe tener 10 dígitos" });
  }

  // Validar celular ecuatoriano
  if (!/^09\d{8}$/.test(celular)) {
    return res.status(400).json({ error: "Celular inválido. Debe comenzar con 09 y tener 10 dígitos" });
  }

  // CAMBIADO: Estado por defecto ahora es '10%'
  const estadoFinal = estado || '10%';

  // Primero verificar si el código ya existe (doble seguridad)
  const verificarSql = "SELECT id FROM impresoras WHERE codigo_rastreo = ?";
  
  db.query(verificarSql, [codigo_rastreo], (err, results) => {
    if (err) {
      console.error('❌ Error verificando duplicado:', err);
      return res.status(500).json({ 
        error: "Error del servidor al verificar código",
        details: err.message 
      });
    }

    if (results.length > 0) {
      return res.status(409).json({ 
        error: "El código de rastreo ya existe",
        codigo: codigo_rastreo,
        suggestion: "Por favor, genere un nuevo código único"
      });
    }

    // Primero verificar si existe la columna fecha_registro
    const checkColumnSql = `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'impresoras' 
      AND COLUMN_NAME = 'fecha_registro'
    `;

    db.query(checkColumnSql, (checkErr, columnResults) => {
      if (checkErr) {
        console.error('Error verificando columna:', checkErr);
        // Si hay error, usar INSERT sin fecha_registro
        insertImpresora(false);
      } else if (columnResults.length > 0) {
        // Si existe la columna fecha_registro
        insertImpresora(true);
      } else {
        // Si no existe la columna fecha_registro
        insertImpresora(false);
      }
    });

    // Función para insertar impresora
    function insertImpresora(tieneFechaRegistro) {
      let insertSql, params;
      
      if (tieneFechaRegistro) {
        insertSql = `
          INSERT INTO impresoras 
          (codigo_rastreo, cliente, cedula, celular, problema, estado, marca, modelo, registrado_por, fecha_registro)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        params = [codigo_rastreo, cliente, cedula, celular, problema, estadoFinal, marca, modelo, registrado_por];
      } else {
        insertSql = `
          INSERT INTO impresoras 
          (codigo_rastreo, cliente, cedula, celular, problema, estado, marca, modelo, registrado_por)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        params = [codigo_rastreo, cliente, cedula, celular, problema, estadoFinal, marca, modelo, registrado_por];
      }

      console.log('📋 Ejecutando INSERT con SQL:', insertSql);
      console.log('📋 Parámetros:', params);

      db.query(insertSql, params, (err, result) => {
        if (err) {
          console.error('❌ Error insertando impresora:', err);
          
          // Manejar error de duplicado (por si acaso)
          if (err.code === 'ER_DUP_ENTRY' || err.message.includes('Duplicate')) {
            return res.status(409).json({ 
              error: "El código ya existe en la base de datos",
              codigo: codigo_rastreo
            });
          }
          
          return res.status(500).json({ 
            error: "Error del servidor al crear impresora",
            details: err.message 
          });
        }

        console.log('✅ Impresora creada con ID:', result.insertId);

        // Respuesta exitosa
        const responseData = {
          success: true,
          message: "Impresora registrada exitosamente", 
          id: result.insertId,
          codigo_rastreo: codigo_rastreo,
          data: {
            codigo_rastreo,
            cliente,
            cedula,
            celular,
            problema,
            estado: estadoFinal,
            marca,
            modelo,
            registrado_por
          }
        };

        // Agregar fecha solo si se insertó
        if (tieneFechaRegistro) {
          responseData.data.fecha_registro = new Date().toISOString();
        }

        res.status(201).json(responseData);
      });
    }
  });
});

// Actualizar estado - CAMBIADO: ahora acepta porcentajes
app.put('/impresoras/:id/estado', (req, res) => {
  const { id } = req.params;
  const { nuevoEstado } = req.body;

  if (!nuevoEstado) {
    return res.status(400).json({ error: "El nuevo estado es requerido" });
  }

  // CAMBIADO: Estados permitidos ahora son porcentajes
  const estadosPermitidos = ['10%', '30%', '70%', '75%', '100%'];
  
  if (!estadosPermitidos.includes(nuevoEstado)) {
    return res.status(400).json({ 
      error: "Estado no válido", 
      estadosPermitidos: estadosPermitidos,
      mensaje: "Los estados válidos son: 10%, 30%, 70%, 75%, 100%"
    });
  }

  const sql = "UPDATE impresoras SET estado = ? WHERE id = ?";
  db.query(sql, [nuevoEstado, id], (err, result) => {
    if (err) {
      console.error('Error actualizando estado:', err);
      return res.status(500).json({ error: "Error del servidor" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Impresora no encontrada" });
    }

    res.json({ 
      message: "Estado actualizado correctamente",
      id: id,
      nuevoEstado: nuevoEstado 
    });
  });
});

// Eliminar impresora
app.delete('/impresoras/:id', (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM impresoras WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error eliminando impresora:', err);
      return res.status(500).json({ error: "Error servidor" });
    }

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Impresora no encontrada" });

    res.json({ 
      message: "Impresora eliminada correctamente",
      id: id
    });
  });
});

// NUEVO: Generar sugerencia de código único
app.get('/impresoras/generar-sugerencia', (req, res) => {
  const generarCodigoSugerido = () => {
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin O,0,1,I
    const randomChars = Array.from({ length: 4 }, () => 
      caracteres[Math.floor(Math.random() * caracteres.length)]
    ).join('');
    return `VED${randomChars}`;
  };

  // Intentar generar un código único
  const generarCodigoUnico = (intentos = 0) => {
    if (intentos >= 5) {
      return res.status(500).json({ 
        error: "No se pudo generar un código único después de varios intentos" 
      });
    }

    const codigoSugerido = generarCodigoSugerido();
    
    const verificarSql = "SELECT id FROM impresoras WHERE codigo_rastreo = ?";
    
    db.query(verificarSql, [codigoSugerido], (err, results) => {
      if (err) {
        console.error('Error verificando sugerencia:', err);
        return res.status(500).json({ error: "Error del servidor" });
      }

      if (results.length === 0) {
        // Código disponible
        return res.json({
          sugerencia: codigoSugerido,
          disponible: true,
          mensaje: "Código sugerido disponible"
        });
      } else {
        // Código ya existe, intentar con otro
        generarCodigoUnico(intentos + 1);
      }
    });
  };

  generarCodigoUnico();
});

// ====================================
//              LOGIN
// ====================================
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: "Faltan credenciales" });

  const sql = `
    SELECT 
      id, 
      username, 
      password, 
      nombre_completo, 
      correo,
      COALESCE(fecha_registro, NOW()) as fecha_registro,
      COALESCE(estado, 'activo') as estado,
      COALESCE(telefono, 'No especificado') as telefono,
      COALESCE(rol, 'usuario') as rol,
      COALESCE(ultimo_acceso, NOW()) as ultimo_acceso
    FROM usuario 
    WHERE username = ? AND password = ? 
    LIMIT 1
  `;

  db.query(sql, [username, password], (err, results) => {
    if (err) {
      console.error('Error en login:', err);
      return res.status(500).json({ error: "Error en el servidor" });
    }

    if (results.length === 0)
      return res.json({ success: false, message: "Usuario o contraseña incorrectos" });

    // Actualizar último acceso
    const userId = results[0].id;
    const updateSql = "UPDATE usuario SET ultimo_acceso = NOW() WHERE id = ?";
    
    db.query(updateSql, [userId], (updateErr) => {
      if (updateErr) {
        console.error('Error actualizando último acceso:', updateErr);
      }

      // Obtener usuario actualizado
      const getUpdatedSql = `
        SELECT 
          id, 
          username, 
          password, 
          nombre_completo, 
          correo,
          COALESCE(fecha_registro, NOW()) as fecha_registro,
          COALESCE(estado, 'activo') as estado,
          COALESCE(telefono, 'No especificado') as telefono,
          COALESCE(rol, 'usuario') as rol,
          COALESCE(ultimo_acceso, NOW()) as ultimo_acceso
        FROM usuario 
        WHERE id = ?
      `;

      db.query(getUpdatedSql, [userId], (err, updatedUser) => {
        if (err) {
          res.json({ 
            success: true, 
            user: results[0],
            message: "Login exitoso"
          });
        } else {
          res.json({ 
            success: true, 
            user: updatedUser[0],
            message: "Login exitoso"
          });
        }
      });
    });
  });
});

// ====================================
//        ENDPOINTS DE PRUEBA
// ====================================

// Endpoint de prueba simple
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Test endpoint funcionando',
    timestamp: new Date().toISOString()
  });
});

// Endpoint para testear la base de datos
app.get('/test-db', (req, res) => {
  db.query('SELECT 1 as test', (err, results) => {
    if (err) {
      console.error('Error test DB:', err);
      return res.status(500).json({ 
        error: 'Error conectando a la base de datos',
        details: err.message 
      });
    }
    res.json({ 
      db_connection: 'OK',
      result: results[0]
    });
  });
});

// ====================================
//      ENDPOINTS PARA CREAR COLUMNAS
// ====================================

// Endpoint para crear la columna fecha_registro en impresoras si no existe
app.get('/crear-columna-fecha', (req, res) => {
  const sql = `
    ALTER TABLE impresoras 
    ADD COLUMN IF NOT EXISTS fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
  `;
  
  db.query(sql, (err, result) => {
    if (err) {
      console.error('Error creando columna fecha_registro:', err);
      return res.status(500).json({ 
        error: 'Error al crear columna fecha_registro',
        details: err.message 
      });
    }
    
    res.json({ 
      message: 'Columna fecha_registro creada o ya existe',
      result: result
    });
  });
});

// Endpoint para crear las columnas faltantes en usuario
app.get('/crear-columnas-usuario', (req, res) => {
  const sql = `
    ALTER TABLE usuario 
    ADD COLUMN IF NOT EXISTS fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    ADD COLUMN IF NOT EXISTS telefono VARCHAR(20) DEFAULT 'No especificado',
    ADD COLUMN IF NOT EXISTS rol ENUM('admin', 'usuario') DEFAULT 'usuario',
    ADD COLUMN IF NOT EXISTS ultimo_acceso DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  `;
  
  db.query(sql, (err, result) => {
    if (err) {
      console.error('Error creando columnas usuario:', err);
      return res.status(500).json({ 
        error: 'Error al crear columnas de usuario',
        details: err.message 
      });
    }
    
    res.json({ 
      message: 'Columnas de usuario creadas o ya existen',
      result: result
    });
  });
});

// Endpoint para verificar estructura de tablas
app.get('/verificar-tablas', (req, res) => {
  const sql = `
    SELECT 
      TABLE_NAME,
      COLUMN_NAME,
      DATA_TYPE,
      COLUMN_DEFAULT,
      IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME IN ('usuario', 'impresoras')
    ORDER BY TABLE_NAME, ORDINAL_POSITION
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error verificando tablas:', err);
      return res.status(500).json({ 
        error: 'Error al verificar tablas',
        details: err.message 
      });
    }
    
    // Organizar resultados por tabla
    const tablas = {
      usuario: results.filter(r => r.TABLE_NAME === 'usuario'),
      impresoras: results.filter(r => r.TABLE_NAME === 'impresoras')
    };
    
    res.json({ 
      message: 'Estructura de tablas obtenida',
      tablas: tablas,
      total_columnas: results.length
    });
  });
});

// ====================================
//        MANEJO DE ERRORES GLOBAL
// ====================================

// Middleware para manejar errores 404
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path,
    method: req.method,
    available_endpoints: [
      'GET  /',
      'GET  /usuario',
      'GET  /usuario/:id',
      'POST /usuario',
      'PUT  /usuario/:id',
      'PUT  /usuario/:id/estado',
      'DELETE /usuario/:id',
      'GET  /impresoras/verificar-codigo?codigo=VEDXXXX',
      'POST /impresoras',
      'GET  /impresoras',
      'POST /login',
      'GET  /crear-columnas-usuario',
      'GET  /verificar-tablas'
    ]
  });
});

// Middleware para manejar errores generales
app.use((err, req, res, next) => {
  console.error('🔥 Error global:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ====================================
//              SERVIDOR
// ====================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});



