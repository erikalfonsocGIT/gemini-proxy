const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

// 1. Ruta de diagnóstico para que verifiques en el navegador si está vivo
app.get('/', (req, res) => {
    res.send('Servidor Proxy para Gemini activo y funcionando en Render');
});

// 2. El redireccionador inteligente hacia Google AI Studio
app.use('/', createProxyMiddleware({
    target: 'https://generativelanguage.googleapis.com',
    changeOrigin: true,
    logLevel: 'debug',
    onProxyReq: (proxyReq, req, res) => {
        // Pasa las cabeceras de autorización que envíe Chatbox
        if (req.headers['authorization']) {
            const apiKey = req.headers['authorization'].replace('Bearer ', '');
            // Google prefiere su cabecera nativa, se la inyectamos por seguridad
            proxyReq.setHeader('x-goog-api-key', apiKey);
        }
    }
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy Gemini corriendo en puerto ${PORT}`));
