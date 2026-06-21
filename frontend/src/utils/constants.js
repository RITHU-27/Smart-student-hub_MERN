export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
    ACHIEVEMENTS: {
        ALL: '/api/achievements/for-faculty', // Faculty dashboard
        MINE: '/api/achievements/mine',
        CREATE: '/api/achievements',
        FOR_FACULTY: '/api/achievements/for-faculty',
        VERIFY: (id) => `/api/achievements/${id}/verify`
    },

    STUDENTS: {
        FOR_FACULTY: '/api/students/for-faculty',
        PROFILE: '/api/students/profile',
        ACHIEVEMENTS: '/api/students/achievements'
    },

    ADMIN: {
        STUDENTS: '/api/admin/students',
        STUDENT_DETAILS: (id) => `/api/admin/student/${id}`,
        ACHIEVEMENT_DETAILS: (id) => `/api/admin/achievement/${id}`,

        // ✅ Corrected endpoint to match backend
        ACHIEVEMENTS: '/api/admin/achievements',

        APPROVE_ACHIEVEMENT: (id) => `/api/admin/approve/${id}`,
        REJECT_ACHIEVEMENT: (id) => `/api/admin/reject/${id}`,
        EXPORT_ACHIEVEMENTS: '/api/admin/export-achievements'
    },

    AUTH: {
        LOGIN: '/api/auth/login'
    }
};

export const FILE_TYPES = {
    IMAGE: ['image/jpeg', 'image/png', 'image/gif'],
    PDF: ['application/pdf']
};
