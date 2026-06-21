export const calculateTopStudents = (achievements) => {
  // Group achievements by student and calculate total student activity points
  const studentMap = {};
  
  achievements.forEach(ach => {
    if (!ach.student || !ach.student.user) return;
    
    const studentId = ach.student._id;
    const studentActivityPoints = ach.credits || 0;
    
    if (!studentMap[studentId]) {
      studentMap[studentId] = {
        id: studentId,
        name: ach.student.user.name,
        email: ach.student.user.email,
        department: ach.student.department || 'Not specified',
        studentActivityPoints: 0,
        achievements: 0,
        approved: 0,
        pending: 0,
        rejected: 0
      };
    }
    
    studentMap[studentId].studentActivityPoints += studentActivityPoints;
    studentMap[studentId].achievements += 1;
    
    if (ach.verificationStatus === 'approved') {
      studentMap[studentId].approved += 1;
    } else if (ach.verificationStatus === 'pending') {
      studentMap[studentId].pending += 1;
    } else if (ach.verificationStatus === 'rejected') {
      studentMap[studentId].rejected += 1;
    }
  });
  
  // Convert to array and sort by student activity points (descending)
  const topStudents = Object.values(studentMap)
    .sort((a, b) => b.studentActivityPoints - a.studentActivityPoints)
    .slice(0, 20); // Show top 20 students
  
  return topStudents;
};
