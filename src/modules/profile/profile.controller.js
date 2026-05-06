const profileService = require('./profile.service');

const getProfile = async (req, res, next) => {
  try {
    const result = await profileService.getProfile({
      userId: req.user.id,
      empresaId: req.user.empresaId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const result = await profileService.updateProfile({
      userId: req.user.id,
      empresaId: req.user.empresaId,
      data: req.body
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const result = await profileService.changePassword({
      userId: req.user.id,
      empresaId: req.user.empresaId,
      data: req.body
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  changePassword,
  getProfile,
  updateProfile
};
