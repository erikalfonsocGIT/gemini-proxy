const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

app.get('/', (req, res) => {
    res.send('Servidor Adaptador Gemini activo y funcionando en Render');
});

// INTERCEPTOR INTELIGENTE PARA CHATBOX
app.use('/', createProxyMiddleware({
    target: 'https://generativelanguage.googleapis.com',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: (path, req) => {
        // Si Chatbox intenta usar el formato de OpenAI, lo traducimos al formato real de Gemini
        if (path.includes('/chat/completions')) {
            // Extraemos el modelo que Chatbox configuró o usamos gemini-1.5-flash por defecto
            return '/v1beta/models/gemini-1.5-flash:generateContent';
        }
        return path;
    },
    onProxyReq: (proxyReq, req, res) => {
        // Extraemos la clave API de la cabecera Bearer de Chatbox y se la inyectamos a Google
        if (req.headers['authorization']) {
            const apiKey = req.headers['authorization'].replace('Bearer ', '');
            proxyReq.setHeader('x-goog-api-key', apiKey);
        }
    }
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Adaptador corriendo`));
