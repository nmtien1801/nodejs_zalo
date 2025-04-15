const profileService = require("../services/profileService");

const uploadProfile = async (req, res) => {
  try {
    let raw = req.body
    let data = await profileService.uploadProfile(raw);

    return res.status(200).json({
      EM: data.EM,
      EC: data.EC,
      DT: data.DT,
    });
  } catch (err) {
    console.log("check uploadProfile server", err);
    return res.status(500).json({
      EM: "error uploadProfile", //error message
      EC: 2, //error code
      DT: "", // data
    });
  }
};

module.exports = {
    uploadProfile
};
