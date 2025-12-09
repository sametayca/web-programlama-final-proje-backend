// Mock models before requiring server
jest.mock('../../models', () => ({
  Department: {
    findAll: jest.fn()
  }
}));

const request = require('supertest');
const app = require('../../server');
const { Department } = require('../../models');

describe('Department Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/departments', () => {
    it('should return all active departments', async () => {
      const mockDepartments = [
        { id: '1', name: 'Computer Science', code: 'CS', description: 'CS Dept' },
        { id: '2', name: 'Electrical Engineering', code: 'EE', description: 'EE Dept' }
      ];

      Department.findAll = jest.fn().mockResolvedValue(mockDepartments);

      const res = await request(app)
        .get('/api/departments')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(Department.findAll).toHaveBeenCalledWith({
        where: { isActive: true },
        attributes: ['id', 'name', 'code', 'description'],
        order: [['name', 'ASC']]
      });
    });

    it('should return empty array when no departments exist', async () => {
      Department.findAll = jest.fn().mockResolvedValue([]);

      const res = await request(app)
        .get('/api/departments')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    it('should handle database errors', async () => {
      Department.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

      const res = await request(app)
        .get('/api/departments')
        .expect(500);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Database error');
    });
  });
});

