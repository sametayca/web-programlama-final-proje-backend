const request = require('supertest');
const express = require('express');
const eventRoutes = require('../../routes/eventRoutes');
const authGuard = require('../../middleware/auth');
const eventService = require('../../services/eventService');

jest.mock('../../middleware/auth');
jest.mock('../../services/eventService');

const app = express();
app.use(express.json());
app.use('/v1/events', eventRoutes);

describe('Event Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock authGuard to allow all requests
    authGuard.mockImplementation((req, res, next) => {
      req.user = { id: 'user1', role: 'faculty' };
      next();
    });
  });

  describe('GET /v1/events', () => {
    it('should get all events', async () => {
      const mockEvents = [
        { id: '1', title: 'Event 1', eventType: 'workshop' },
        { id: '2', title: 'Event 2', eventType: 'seminar' }
      ];

      eventService.getEvents = jest.fn().mockResolvedValue({
        events: mockEvents,
        pagination: { total: 2, page: 1, limit: 20, pages: 1 }
      });

      const response = await request(app)
        .get('/v1/events')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter events by type', async () => {
      eventService.getEvents = jest.fn().mockResolvedValue({
        events: [{ id: '1', title: 'Workshop', eventType: 'workshop' }],
        pagination: { total: 1, page: 1, limit: 20, pages: 1 }
      });

      const response = await request(app)
        .get('/v1/events?eventType=workshop')
        .expect(200);

      expect(eventService.getEvents).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'workshop' })
      );
    });
  });

  describe('GET /v1/events/:id', () => {
    it('should get event by id', async () => {
      const mockEvent = { id: '1', title: 'Test Event' };

      eventService.getEventById = jest.fn().mockResolvedValue(mockEvent);

      const response = await request(app)
        .get('/v1/events/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockEvent);
    });

    it('should return 404 when event not found', async () => {
      eventService.getEventById = jest.fn().mockRejectedValue(new Error('Event not found'));

      const response = await request(app)
        .get('/v1/events/invalid')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /v1/events', () => {
    it('should create event for faculty', async () => {
      const eventData = {
        title: 'New Event',
        eventType: 'workshop',
        startDate: '2024-12-25',
        endDate: '2024-12-25',
        location: 'Campus'
      };

      const mockEvent = { id: '1', ...eventData };
      eventService.createEvent = jest.fn().mockResolvedValue(mockEvent);

      const response = await request(app)
        .post('/v1/events')
        .send(eventData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(eventService.createEvent).toHaveBeenCalled();
    });
  });

  describe('POST /v1/events/:id/register', () => {
    it('should register user for event', async () => {
      const mockRegistration = {
        id: 'reg1',
        eventId: '1',
        userId: 'user1'
      };

      eventService.registerForEvent = jest.fn().mockResolvedValue(mockRegistration);

      const response = await request(app)
        .post('/v1/events/1/register')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(eventService.registerForEvent).toHaveBeenCalledWith('1', 'user1');
    });
  });
});

