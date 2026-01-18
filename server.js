require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const CURSEFORGE_API_KEY = process.env.CURSEFORGE_API;
const CURSEFORGE_BASE_URL = 'https://api.curseforge.com/v1';
const NGROK_URL = process.env.NGROK_URL; // ngrok URL (例: https://abc123.ngrok.io)

// CORS configuration
const allowedOrigins = [
    'http://localhost:14592',
    'http://127.0.0.1:14592'
];

// ngrok URLが設定されている場合は、そのURLからのアクセスも許可
if (NGROK_URL) {
    allowedOrigins.push(NGROK_URL);
    console.log(`[Config] ngrok URL configured: ${NGROK_URL}`);
}

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Blocked request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        apiKeyConfigured: !!CURSEFORGE_API_KEY
    });
});

// Create axios instance with CurseForge API key
const curseforgeAxios = axios.create({
    baseURL: CURSEFORGE_BASE_URL,
    headers: {
        'Accept': 'application/json',
        'x-api-key': CURSEFORGE_API_KEY,
        'User-Agent': 'ReaLauncher-Proxy/1.0.0'
    }
});

// Search mods
app.get('/api/search', async (req, res) => {
    try {
        const { query, classId, gameVersion, modLoaderType, categoryId, sortField, sortOrder, pageSize, index, offset } = req.query;

        const params = {
            gameId: 432, // Minecraft
            searchFilter: query,
            classId: classId || 6,
            gameVersion,
            modLoaderType,
            categoryId: categoryId !== '0' ? categoryId : undefined,
            sortField,
            sortOrder,
            pageSize: pageSize || 20,
            index: index || offset || 0
        };

        console.log('[Proxy] Search request:', params);
        const response = await curseforgeAxios.get('/mods/search', { params });

        // Standardize to Modrinth-like format
        const data = {
            hits: response.data.data.map(mod => ({
                project_id: `cf-${mod.id}`,
                title: mod.name,
                description: mod.summary,
                icon_url: mod.logo?.url,
                author: mod.authors?.[0]?.name,
                downloads: mod.downloadCount,
                date_modified: mod.dateModified,
                latest_version: mod.latestFiles?.[0]?.id,
                source: 'curseforge',
                categories: mod.categories?.map(c => c.name),
                slug: mod.slug
            })),
            total_hits: response.data.pagination.totalCount
        };

        res.json(data);
    } catch (error) {
        console.error('[Proxy] Search error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: error.response?.data || error.message
        });
    }
});

// Get mod details
app.get('/api/mod/:modId', async (req, res) => {
    try {
        const { modId } = req.params;
        console.log(`[Proxy] Get mod: ${modId}`);

        const response = await curseforgeAxios.get(`/mods/${modId}`);
        res.json(response.data.data);
    } catch (error) {
        console.error('[Proxy] Get mod error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: error.response?.data || error.message
        });
    }
});

// Get mod files
app.get('/api/mod/:modId/files', async (req, res) => {
    try {
        const { modId } = req.params;
        const { gameVersion, modLoaderType } = req.query;

        console.log(`[Proxy] Get mod files: ${modId}`, { gameVersion, modLoaderType });

        const params = {};
        if (gameVersion) params.gameVersion = gameVersion;
        if (modLoaderType) params.modLoaderType = modLoaderType;

        const response = await curseforgeAxios.get(`/mods/${modId}/files`, { params });
        res.json(response.data.data);
    } catch (error) {
        console.error('[Proxy] Get mod files error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: error.response?.data || error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('[Proxy] Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`CurseForge Proxy Server running on port ${PORT}`);
    console.log(`API Key configured: ${!!CURSEFORGE_API_KEY}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    if (NGROK_URL) {
        console.log(`ngrok URL: ${NGROK_URL}`);
        console.log(`Public Health check: ${NGROK_URL}/health`);
    } else {
        console.log(`Tip: Set NGROK_URL in .env to enable public access via ngrok`);
    }
    console.log(`========================================`);
});
