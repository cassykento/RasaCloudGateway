// index.js (Rasa Cloud Gateway for Deployment)
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

// --- Rasa Configuration ---
// This is the Cloudflare link pointing to your local Rasa Server (Port 5005)
const RASA_SERVER_URL = 'https://shall-fool-deny-concern.trycloudflare.com'; 

const SENDER_ID = 'user_unique_id_123'; // Static sender ID
// --------------------------

const app = express();
const PORT = process.env.PORT || 3000; // Use environment variable for hosting provider

// Middleware
app.use(cors());
app.use(bodyParser.json());

// --- Serve Frontend File ---
// When deployed, this serves the index.html file from the same directory
app.get('/', (req, res) => {
    // Ensure index.html exists in the same deployment folder
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint to handle incoming messages from the frontend
app.post('/api/message', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).send({ error: 'Message content is required.' });
    }

    try {
        console.log(`[Cloud Gateway] Forwarding message from ${SENDER_ID}: "${message}" to Rasa server.`);

        // Forward the message to the Public Rasa API URL
        const rasaResponse = await axios.post(RASA_SERVER_URL, {
            sender: SENDER_ID,
            message: message,
        });

        const rasaMessages = rasaResponse.data;
        console.log(`[Cloud Gateway] Received ${rasaMessages.length} responses from Rasa.`);

        res.status(200).send(rasaMessages);

    } catch (error) {
        // Detailed error handling if the Cloud Gateway cannot reach the local Rasa server
        console.error('[Cloud Gateway] 🔴 Error communicating with remote Rasa server:', error.message);
        
        const fallbackMessage = (error.code === 'ECONNREFUSED' || error.message.includes('timeout')) ?
            'Backend Error: I cannot reach the local Rasa AI server. Please ensure Terminal 1 (Rasa) and Terminal 4 (Cloudflare) are running.' :
            `Internal Error: ${error.message}`;

        res.status(500).send([{ text: fallbackMessage }]);
    }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Cloud Gateway is running on port ${PORT}.`);
});