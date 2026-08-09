const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const http = require('http');
const https = require('https');

const app = express();

// Agentes de red optimizados para Keep-Alive en conexiones inestables
const httpAgent = new http.Agent({ keepAlive: true, keepAliveMsecs: 10000 });
const httpsAgent = new https.Agent({ keepAlive: true, keepAliveMsecs: 10000 });

app.get('/', (req, res) => {
    res.send('Servidor Adaptador Gemini activo y funcionando en Render');
});

// INTERCEPTOR INTELIGENTE Y CONEXIÓN ROBUSTA
app.use('/', createProxyMiddleware({
    target: 'https://generativelanguage.googleapis.com',
    changeOrigin: true,
    logLevel: 'debug',
    
    // Asigna los agentes HTTP/HTTPS con Keep-Alive para reutilizar el socket TCP
    agent: httpsAgent,

    // Amplía el timeout del proxy a 2 minutos (120,000 ms) para soportar la red de ETECSA
    proxyTimeout: 120000,
    timeout: 120000,

    pathRewrite: (path, req) => {
        // Mantiene la flexibilidad dinámica original pero redirige limpiamente
        return path;
    },
    onProxyReq: (proxyReq, req, res) => {
        // Extrae la clave API de la cabecera Bearer de Chatbox y se la inyecta a Google
        if (req.headers['authorization']) {
            const apiKey = req.headers['authorization'].replace('Bearer ', '').trim();
            proxyReq.setHeader('x-goog-api-key', apiKey);
        }
    },
    onError: (err, req, res) => {
        console.error('Error de red/timeout en el Proxy:', err.message);
        if (!res.headersSent) {
            res.status(504).send('Error de tiempo de espera en la red. Conexión inestable.');
        }
    }
}));

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`Adaptador corriendo en el puerto ${PORT}`));

// CONFIGURACIÓN DE TIMEOUTS Y KEEP-ALIVE EN EL SERVIDOR NODE.JS
server.timeout = 180000;         // 3 minutos de tiempo máximo por petición
server.keepAliveTimeout = 65000;   // Mantiene el socket activo por encima del límite de 60s de Render
server.headersTimeout = 66000;     // Previene cierres al recibir cabeceras lentas
