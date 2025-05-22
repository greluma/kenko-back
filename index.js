const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(
  cors({
    origin: '*', // ⚠️ Cambia esto a tu dominio en producción
    methods: ['GET', 'POST'],
  })
);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // ⚠️ Cambia esto a tu dominio en producción
    methods: ['GET', 'POST'],
  },
});

// Función que emite un mensaje cada 5 segundos a todos los clientes conectados
let inbox = [];
let currentIndex = 0;

// Cargar el inbox una vez al iniciar el servidor
const filePath = path.join(__dirname, 'bd_local', 'inbox.json');
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error leyendo inbox.json al iniciar:', err);
    inbox = [];
  } else {
    inbox = JSON.parse(data).bandeja_entrada || [];
  }
});

// Enviar una notificación de la lista cada 5 segundos
setInterval(() => {
  if (inbox.length === 0) {
    console.log('No hay notificaciones en la bandeja de entrada.');
    return;
  }

  const notificacion = inbox[currentIndex];
  const mensaje = {
    titulo: 'Notificación automática',
    mensaje: notificacion.mensaje,
    timestamp: new Date().toISOString(),
    id: notificacion.id,
    leido: notificacion.leido,
  };

  console.log('📤 Emitiendo notificación automática:', mensaje);
  io.emit('notificacion', mensaje);

  currentIndex = (currentIndex + 1) % inbox.length; // Reinicia al llegar al final
}, 5000);

// Escucha conexiones
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado:', socket.id);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Ruta para obtener las notificaciones archivadas
app.get('/archivadas', (req, res) => {
  const filePath = path.join(__dirname, 'bd_local', 'archivadas.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error leyendo archivadas.json:', err);
      return res
        .status(500)
        .json({ error: 'Error al leer las notificaciones archivadas' });
    }
    const archivadas = JSON.parse(data);
    res.json(archivadas);
  });
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});
