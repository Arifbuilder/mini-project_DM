const express = require('express');
const { fetchCurrentWeather } = require('../connectors/weather');

const router = express.Router();

router.get('/', async (req, res) => {
  const { lat, lng } = req.query;
  const weather = await fetchCurrentWeather(
    parseFloat(lat) || 35.68,
    parseFloat(lng) || 139.69
  );
  res.json(weather);
});

module.exports = router;
