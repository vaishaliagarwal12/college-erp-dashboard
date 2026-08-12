// Convert a percentage to a letter grade using the standard scale
const gradeForPercentage = (percentage) => {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 40) return "D";
  return "F";
};

const percentageFromMarks = (obtained, max) => {
  if (!max || max <= 0) return 0;
  return (obtained / max) * 100;
};

module.exports = { gradeForPercentage, percentageFromMarks };
