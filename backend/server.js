const express = require('express');
const axios = require('axios');
const { Client } = require('oci-sdk');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/air-pollution', async (req, res) => {
    const { lat, lon } = req.query;
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;

    try {
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch air pollution data' });
    }
});

app.post('/api/cities', async (req, res) => {
    const { name, lat, lon } = req.body;
    const client = new Client({
        user: process.env.OCI_USER,
        fingerprint: process.env.OCI_FINGERPRINT,
        key_file: process.env.OCI_KEY_FILE,
        tenancy: process.env.OCI_TENANCY,
        region: process.env.OCI_REGION
    });

    try {
        const result = await client.putObject({
            namespaceName: process.env.OCI_NAMESPACE,
            bucketName: process.env.OCI_BUCKET,
            objectName: `${name}.json`,
            putObjectBody: JSON.stringify({ name, lat, lon })
        });
        res.json({ message: 'City data stored successfully', result });
    } catch (error) {
        res.status(500).json({ error: 'Failed to store city data' });
    }
});

app.get('/api/cities', async (req, res) => {
    const client = new Client({
        user: process.env.OCI_USER,
        fingerprint: process.env.OCI_FINGERPRINT,
        key_file: process.env.OCI_KEY_FILE,
        tenancy: process.env.OCI_TENANCY,
        region: process.env.OCI_REGION
    });

    try {
        const result = await client.listObjects({
            namespaceName: process.env.OCI_NAMESPACE,
            bucketName: process.env.OCI_BUCKET
        });
        const cities = await Promise.all(result.objects.map(async (object) => {
            const cityData = await client.getObject({
                namespaceName: process.env.OCI_NAMESPACE,
                bucketName: process.env.OCI_BUCKET,
                objectName: object.name
            });
            return JSON.parse(cityData.data);
        }));
        res.json(cities);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve city data' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
