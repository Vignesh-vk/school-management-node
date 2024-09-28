const bcrypt = require('bcrypt');
const Teacher = require('../models/teacherSchema.js');
const Subject = require('../models/subjectSchema.js');

const teacherRegister = async (req, res) => {
    const { name, email, password, role, school, teachSubject, teachSclass } = req.body;
    try {
        const existingTeacher = await Teacher.findOne({ email });
        if (existingTeacher) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(password, salt);

        const teacher = new Teacher({
            name,
            email,
            password: hashedPass,
            role,
            school,
            teachSubject,
            teachSclass,
        });

        const result = await teacher.save();
        await Subject.findByIdAndUpdate(teachSubject, { teacher: teacher._id });
        
        result.password = undefined; // Exclude password from response
        return res.status(201).json(result);
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const teacherLogIn = async (req, res) => {
    try {
        const teacher = await Teacher.findOne({ email: req.body.email });
        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found" });
        }

        const validated = await bcrypt.compare(req.body.password, teacher.password);
        if (!validated) {
            return res.status(401).json({ message: "Invalid password" });
        }

        await teacher.populate("teachSubject", "subName sessions")
            .populate("school", "schoolName")
            .populate("teachSclass", "sclassName");
        
        teacher.password = undefined; // Exclude password from response
        return res.status(200).json(teacher);
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getTeachers = async (req, res) => {
    try {
        const teachers = await Teacher.find({ school: req.params.id })
            .populate("teachSubject", "subName")
            .populate("teachSclass", "sclassName");

        const modifiedTeachers = teachers.map(teacher => ({ ...teacher._doc, password: undefined }));
        return res.status(200).json(modifiedTeachers.length > 0 ? modifiedTeachers : { message: "No teachers found" });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getTeacherDetail = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id)
            .populate("teachSubject", "subName sessions")
            .populate("school", "schoolName")
            .populate("teachSclass", "sclassName");

        if (!teacher) {
            return res.status(404).json({ message: "No teacher found" });
        }

        teacher.password = undefined; // Exclude password from response
        return res.status(200).json(teacher);
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const updateTeacherSubject = async (req, res) => {
    const { teacherId, teachSubject } = req.body;
    try {
        const updatedTeacher = await Teacher.findByIdAndUpdate(
            teacherId,
            { teachSubject },
            { new: true }
        );

        if (!updatedTeacher) {
            return res.status(404).json({ message: "Teacher not found" });
        }

        await Subject.findByIdAndUpdate(teachSubject, { teacher: updatedTeacher._id });
        return res.status(200).json(updatedTeacher);
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteTeacher = async (req, res) => {
    try {
        const deletedTeacher = await Teacher.findByIdAndDelete(req.params.id);
        if (!deletedTeacher) {
            return res.status(404).json({ message: "Teacher not found" });
        }

        await Subject.updateMany(
            { teacher: deletedTeacher._id },
            { $unset: { teacher: "" } }
        );

        return res.status(200).json(deletedTeacher);
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteTeachers = async (req, res) => {
    try {
        const deletionResult = await Teacher.deleteMany({ school: req.params.id });
        const deletedCount = deletionResult.deletedCount || 0;

        if (deletedCount === 0) {
            return res.status(404).json({ message: "No teachers found to delete" });
        }

        await Subject.updateMany(
            { teacher: { $in: deletionResult.map(teacher => teacher._id) } },
            { $unset: { teacher: "" } }
        );

        return res.status(200).json(deletionResult);
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteTeachersByClass = async (req, res) => {
    try {
        const deletionResult = await Teacher.deleteMany({ sclassName: req.params.id });
        const deletedCount = deletionResult.deletedCount || 0;

        if (deletedCount === 0) {
            return res.status(404).json({ message: "No teachers found to delete" });
        }

        await Subject.updateMany(
            { teacher: { $in: deletionResult.map(teacher => teacher._id) } },
            { $unset: { teacher: "" } }
        );

        return res.status(200).json(deletionResult);
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const teacherAttendance = async (req, res) => {
    const { status, date } = req.body;
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        const existingAttendance = teacher.attendance.find(a => a.date.toDateString() === new Date(date).toDateString());

        if (existingAttendance) {
            existingAttendance.status = status;
        } else {
            teacher.attendance.push({ date, status });
        }

        const result = await teacher.save();
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    teacherRegister,
    teacherLogIn,
    getTeachers,
    getTeacherDetail,
    updateTeacherSubject,
    deleteTeacher,
    deleteTeachers,
    deleteTeachersByClass,
    teacherAttendance,
};
