const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Akıllı Kampüs Yönetim Platformu API',
      version: '1.0.0',
      description: 'Comprehensive university campus management system API documentation',
      contact: {
        name: 'API Support',
        email: 'support@kampus.edu.tr'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      },
      {
        url: 'https://api.kampus.edu.tr/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Error message'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            email: {
              type: 'string',
              format: 'email'
            },
            firstName: {
              type: 'string'
            },
            lastName: {
              type: 'string'
            },
            role: {
              type: 'string',
              enum: ['student', 'faculty', 'admin', 'staff']
            },
            isEmailVerified: {
              type: 'boolean'
            },
            profilePicture: {
              type: 'string',
              nullable: true
            }
          }
        },
        Course: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            code: {
              type: 'string'
            },
            name: {
              type: 'string'
            },
            credits: {
              type: 'integer'
            },
            ects: {
              type: 'integer'
            },
            description: {
              type: 'string',
              nullable: true
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints'
      },
      {
        name: 'Users',
        description: 'User management endpoints'
      },
      {
        name: 'Departments',
        description: 'Department management'
      },
      {
        name: 'Courses',
        description: 'Course management'
      },
      {
        name: 'Sections',
        description: 'Course section management'
      },
      {
        name: 'Enrollments',
        description: 'Student course enrollments'
      },
      {
        name: 'Grades',
        description: 'Grade management and transcripts'
      },
      {
        name: 'Attendance',
        description: 'GPS-based attendance system'
      },
      {
        name: 'Announcements',
        description: 'Campus announcements'
      }
    ]
  },
  apis: ['./src/routes/*.js'] // Path to API routes
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };



