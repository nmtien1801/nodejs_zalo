const chatService = require("../services/chatService");
const Message = require("../models/message");

const getConversations = async (req, res) => {
  try {
    const { senderId } = req.params;
    let data = await chatService.getConversations(senderId);

    return res.status(200).json({
      EM: data.EM,
      EC: data.EC,
      DT: data.DT,
    });
  } catch (err) {
    console.log("check getConversations server", err);
    return res.status(500).json({
      EM: "error getConversations", //error message
      EC: 2, //error code
      DT: "", // data
    });
  }
};

const saveMsg = async (data) => {
  try {
    const _data = {
      msg: data.msg,
      sender: {
        _id: data.sender._id,
        name: data.sender.username,
        phone: data.sender.phone,
      },
      receiver: {
        _id: data.receiver._id,
        name: data.receiver.username,
        phone: data.receiver.phone,
      },
    };

    const saveMsg = new Message(_data);
    await saveMsg.save();

    return saveMsg;
  } catch (error) {
    console.log(">>>> check saveMsg server", error);
    return res.status(500).json({
      EM: "error saveMsg", //error message
      EC: 2, //error code
      DT: "", // data
    });
  }
};

const getMsg = async (req, res) => {
  try {
    let sender = req.params.sender;
    let receiver = req.params.receiver;
    let type = req.params.type;

    if (!sender || !receiver) {
      return res.status(403).json({
        EM: "User id required.", //error message
        EC: 2, //error code
        DT: "", // data
      });
    }

    let allMsg = [];
    if (+type === 2) {
      allMsg = await Message.find({
        "receiver._id": receiver,
      });
    } else {
      allMsg = await Message.find({
        $or: [
          { $and: [{ "sender._id": sender }, { "receiver._id": receiver }] },
          { $and: [{ "sender._id": receiver }, { "receiver._id": sender }] },
        ],
      });
    }

    return res.status(200).json({
      EM: "oke allMSg getMsg", //error message
      EC: 0, //error code
      DT: allMsg, // data
    });
  } catch (error) {
    console.log("check getMsg server", error);
    return res.status(500).json({
      EM: "error getMsg", //error message
      EC: 2, //error code
      DT: "", // data
    });
  }
};

const delMsg = async (req, res) => {
  const id = req.params.id;
  try {
    if (!id) {
      return res.status(403).json({
        EM: "User id required.", //error message
        EC: 2, //error code
        DT: "", // data
      });
    }
    const delMsg = await Message.findByIdAndDelete(id);

    return res.status(200).json({
      EM: "oke delMsg delMsg", //error message
      EC: 0, //error code
      DT: delMsg, // data
    });
  } catch (error) {
    console.log("check delMsg server", error);
    return res.status(500).json({
      EM: "error delMsg", //error message
      EC: 2, //error code
      DT: "", // data
    });
  }
};

module.exports = {
  getConversations,
  saveMsg,
  getMsg,
  delMsg,
};
