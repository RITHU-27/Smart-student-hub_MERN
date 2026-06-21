import Faculty from "../models/facultyModel.js";

export const getAllFaculties = async (req, res) => {
  try {
    const faculties = await Faculty.find().populate("user", "name email");
    res.json({ faculties });
  } catch (error) {
    console.error("Error fetching faculties:", error);
    res.status(500).json({ message: "Server error while fetching faculties" });
  }
};
