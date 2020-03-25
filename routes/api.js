const express = require('express');
const router = express.Router();

const stockController = require('../controllers/stockController');

router.get('/', stockController.getController);

module.exports = router;