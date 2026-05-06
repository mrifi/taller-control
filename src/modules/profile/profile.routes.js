const express = require('express');
const profileController = require('./profile.controller');

const router = express.Router();

router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
router.put('/password', profileController.changePassword);

module.exports = router;
