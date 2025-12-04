import jwt from 'jsonwebtoken';

export const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token faltante" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.rol = decoded.rol;
    next();
  } catch (error) {
    res.status(401).json({ error: "Token inválido" });
  }
};

// Middleware para verificar si el usuario tiene rol de "sorteador"
export const isSorteador = (req, res, next) => {
    const rawRol = req.rol;
    const normalizedRol = rawRol ? rawRol.toLowerCase().trim() : null; 

    if (normalizedRol !== 'sorteador') {
        return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de sorteador.' });
    }
    next();
};


export const isAdmin = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];

  const SUPER_SECRET_KEY = process.env.ADMIN_KEY || 'mi-clave-secreta-12345'; 

  if (!adminKey || adminKey !== SUPER_SECRET_KEY) {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere clave de administrador.' });
  }
  
  next();
};
