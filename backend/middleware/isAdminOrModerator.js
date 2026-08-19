import Group from "../models/groupModel.js";

const isAdminOrModerator = async (req, res, next) => {
  const user = req.user;
  const { groupId } = req.body;
  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isAuthorized =
      group.admin.equals(user._id) || group.moderators.includes(user._id);

    if (!isAuthorized) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  } catch (err) {
    res.status(500).json({ message: "Error authorizing user", error: err });
  }
};

const isAdmin = async (req, res, next) => {
  const user = req.user;
  const { groupId } = req.body;
  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isAuthorized = group.admin.equals(user?._id);
    if (!isAuthorized) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  } catch (err) {
    res.status(500).json({ message: "Error authorizing user", error: err });
  }
};

export { isAdminOrModerator, isAdmin };
