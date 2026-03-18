const Student = require("../models/Student");
const Course = require("../models/Course");
const PDFDocument = require("pdfkit");
const mongoose = require("mongoose");

async function addStudent(req, res) {
  const payload = req.body;

  if (payload.course) {
    const selectedCourse = await Course.findById(payload.course);
    if (selectedCourse) {
      payload.feesTotal = selectedCourse.fee;
    }
  }

  const student = await Student.create(payload);
  const populated = await Student.findById(student._id).populate("course batch");
  return res.status(201).json(populated);
}

async function getStudents(req, res) {
  const students = await Student.find().populate("course batch").sort({ createdAt: -1 });
  return res.json(students);
}

async function exportStudentsPdf(req, res) {
  const query = {};

  if (req.query.courseId) {
    if (!mongoose.Types.ObjectId.isValid(req.query.courseId)) {
      return res.status(400).json({ message: "Invalid course filter" });
    }
    query.course = req.query.courseId;
  }

  if (req.query.batchId) {
    if (!mongoose.Types.ObjectId.isValid(req.query.batchId)) {
      return res.status(400).json({ message: "Invalid batch filter" });
    }
    query.batch = req.query.batchId;
  }

  const students = await Student.find(query).populate("course batch").sort({ name: 1, createdAt: -1 });

  const document = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });

  const filename = `students-${new Date().toISOString().slice(0, 10)}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);

  document.pipe(res);

  document.fontSize(18).text("Parivartan Academy", { align: "left" });
  document.moveDown(0.2);
  document.fontSize(14).text("Student List Report", { align: "left" });
  document.moveDown(0.2);
  document
    .fontSize(10)
    .fillColor("#666666")
    .text(`Generated on: ${new Date().toLocaleString()}`)
    .fillColor("#000000");

  document.moveDown(0.8);
  document.fontSize(11).text(`Total students: ${students.length}`);

  if (req.query.courseId || req.query.batchId) {
    const courseLabel = students[0]?.course?.name || (req.query.courseId ? "Selected course" : "All courses");
    const batchLabel = students[0]?.batch?.name || (req.query.batchId ? "Selected batch" : "All batches");
    document
      .fontSize(10)
      .fillColor("#666666")
      .text(`Filters -> Course: ${courseLabel}, Batch: ${batchLabel}`)
      .fillColor("#000000");
  }

  document.moveDown(0.4);

  if (students.length === 0) {
    document.fontSize(12).text("No student records available.");
    document.end();
    return;
  }

  const tableLeft = document.page.margins.left;
  const tableRight = document.page.width - document.page.margins.right;
  const tableWidth = tableRight - tableLeft;
  const pageBottom = document.page.height - document.page.margins.bottom;

  const baseColumns = [
    { label: "#", key: "index", units: 0.6, align: "center" },
    { label: "Name", key: "name", units: 2.2, align: "left" },
    { label: "Mobile", key: "mobile", units: 1.6, align: "left" },
    { label: "Email", key: "email", units: 3.3, align: "left" },
    { label: "Exam", key: "examType", units: 1.3, align: "left" },
    { label: "Course", key: "course", units: 2.0, align: "left" },
    { label: "Batch", key: "batch", units: 1.5, align: "left" },
    { label: "Fees P/T", key: "fees", units: 1.2, align: "right" },
    { label: "Joined", key: "joined", units: 1.4, align: "left" },
  ];

  const totalUnits = baseColumns.reduce((sum, column) => sum + column.units, 0);
  const columns = baseColumns.map((column) => ({
    ...column,
    width: Number(((column.units / totalUnits) * tableWidth).toFixed(2)),
  }));
  columns[columns.length - 1].width +=
    tableWidth - columns.reduce((sum, column) => sum + column.width, 0);

  const headerHeight = 22;
  const cellPaddingX = 4;
  const cellPaddingY = 4;
  let y = document.y + 8;

  const getColumnX = (columnIndex) => {
    let x = tableLeft;
    for (let i = 0; i < columnIndex; i += 1) {
      x += columns[i].width;
    }
    return x;
  };

  const drawHeader = () => {
    document
      .rect(tableLeft, y, tableWidth, headerHeight)
      .fillAndStroke("#f1f5f9", "#cbd5e1");

    document.fillColor("#0f172a").fontSize(9).font("Helvetica-Bold");

    columns.forEach((column, columnIndex) => {
      const x = getColumnX(columnIndex);
      document.text(column.label, x + cellPaddingX, y + 7, {
        width: column.width - cellPaddingX * 2,
        align: column.align,
        ellipsis: true,
      });
      document
        .moveTo(x, y)
        .lineTo(x, y + headerHeight)
        .strokeColor("#cbd5e1")
        .stroke();
    });

    document
      .moveTo(tableLeft + tableWidth, y)
      .lineTo(tableLeft + tableWidth, y + headerHeight)
      .strokeColor("#cbd5e1")
      .stroke();

    y += headerHeight;
    document.font("Helvetica").fillColor("#0f172a");
  };

  drawHeader();

  students.forEach((student, index) => {
    const row = {
      index: String(index + 1),
      name: student.name || "-",
      mobile: student.mobile || "-",
      email: student.email || "-",
      examType: student.examType || "-",
      course: student.course?.name || "-",
      batch: student.batch?.name || "-",
      fees: `${Number(student.feesPaid || 0)}/${Number(student.feesTotal || 0)}`,
      joined: student.createdAt ? new Date(student.createdAt).toLocaleDateString() : "-",
    };

    document.fontSize(8.8).font("Helvetica");

    const contentHeights = columns.map((column) =>
      document.heightOfString(row[column.key], {
        width: column.width - cellPaddingX * 2,
        align: column.align,
      })
    );

    const rowHeight = Math.max(20, Math.max(...contentHeights) + cellPaddingY * 2);

    if (y + rowHeight > pageBottom) {
      document.addPage();
      y = document.page.margins.top;
      drawHeader();
    }

    document
      .rect(tableLeft, y, tableWidth, rowHeight)
      .fillAndStroke(index % 2 === 0 ? "#ffffff" : "#f8fafc", "#e2e8f0");

    columns.forEach((column, columnIndex) => {
      const x = getColumnX(columnIndex);
      document
        .moveTo(x, y)
        .lineTo(x, y + rowHeight)
        .strokeColor("#e2e8f0")
        .stroke();

      document.fillColor("#0f172a");
      document.text(row[column.key], x + cellPaddingX, y + cellPaddingY, {
        width: column.width - cellPaddingX * 2,
        align: column.align,
        ellipsis: true,
      });
    });

    document
      .moveTo(tableLeft + tableWidth, y)
      .lineTo(tableLeft + tableWidth, y + rowHeight)
      .strokeColor("#e2e8f0")
      .stroke();

    y += rowHeight;
  });

  document.end();
}

async function updateStudent(req, res) {
  const payload = req.body;

  if (payload.course) {
    const selectedCourse = await Course.findById(payload.course);
    if (selectedCourse) {
      payload.feesTotal = selectedCourse.fee;
    }
  }

  const student = await Student.findByIdAndUpdate(req.params.id, payload, { new: true }).populate("course batch");
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  return res.json(student);
}

async function deleteStudent(req, res) {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }
  return res.json({ message: "Student deleted" });
}

module.exports = {
  addStudent,
  getStudents,
  exportStudentsPdf,
  updateStudent,
  deleteStudent,
};
