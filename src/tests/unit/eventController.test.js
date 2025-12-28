const eventController = require('../../controllers/eventController');
const eventService = require('../../services/eventService');
const notificationService = require('../../services/notificationService');
const logger = require('../../config/logger');

jest.mock('../../services/eventService');
jest.mock('../../services/notificationService');
jest.mock('../../config/logger');

describe('EventController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      query: {},
      params: {},
      body: {},
      user: { id: 'user1', role: 'faculty' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getEvents', () => {
    it('should get all events successfully', async () => {
      const mockEvents = [
        { id: '1', title: 'Event 1' },
        { id: '2', title: 'Event 2' }
      ];

      eventService.getEvents = jest.fn().mockResolvedValue({
        events: mockEvents,
        pagination: { total: 2, page: 1, limit: 20, pages: 1 }
      });

      await eventController.getEvents(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        pagination: expect.any(Object),
        data: mockEvents
      });
    });

    it('should filter events by query parameters', async () => {
      req.query = { eventType: 'workshop', page: '1', limit: '10' };

      eventService.getEvents = jest.fn().mockResolvedValue({
        events: [],
        pagination: { total: 0, page: 1, limit: 10, pages: 0 }
      });

      await eventController.getEvents(req, res);

      expect(eventService.getEvents).toHaveBeenCalledWith({
        eventType: 'workshop',
        page: '1',
        limit: '10'
      });
    });

    it('should handle errors', async () => {
      eventService.getEvents = jest.fn().mockRejectedValue(new Error('Database error'));

      await eventController.getEvents(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to fetch events'
      });
    });
  });

  describe('getEventById', () => {
    it('should get event by id successfully', async () => {
      req.params.id = 'event1';
      const mockEvent = { id: 'event1', title: 'Test Event' };

      eventService.getEventById = jest.fn().mockResolvedValue(mockEvent);

      await eventController.getEventById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockEvent
      });
    });

    it('should return 404 when event not found', async () => {
      req.params.id = 'invalid';
      eventService.getEventById = jest.fn().mockRejectedValue(new Error('Event not found'));

      await eventController.getEventById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createEvent', () => {
    it('should create event successfully for faculty', async () => {
      req.body = {
        title: 'New Event',
        eventType: 'workshop',
        startDate: '2024-12-25',
        endDate: '2024-12-25',
        location: 'Campus'
      };

      const mockEvent = { id: 'event1', ...req.body };
      eventService.createEvent = jest.fn().mockResolvedValue(mockEvent);
      notificationService.broadcastNotification = jest.fn().mockResolvedValue({});

      await eventController.createEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(eventService.createEvent).toHaveBeenCalled();
    });

    it('should reject event creation for students', async () => {
      req.user.role = 'student';

      await eventController.createEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Only faculty, admin, or staff can create events'
      });
    });

    it('should reject academic event creation for non-admin', async () => {
      req.body = { eventType: 'academic', title: 'Academic Event' };
      req.user.role = 'faculty';

      await eventController.createEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Only administrators can create academic calendar events'
      });
    });

    it('should allow admin to create academic events', async () => {
      req.user.role = 'admin';
      req.body = {
        title: 'Academic Event',
        eventType: 'academic',
        startDate: '2024-12-25',
        endDate: '2024-12-25'
      };

      const mockEvent = { id: 'event1', ...req.body };
      eventService.createEvent = jest.fn().mockResolvedValue(mockEvent);
      notificationService.broadcastNotification = jest.fn().mockResolvedValue({});

      await eventController.createEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(notificationService.broadcastNotification).toHaveBeenCalled();
    });
  });

  describe('updateEvent', () => {
    it('should update event successfully', async () => {
      req.params.id = 'event1';
      req.body = { title: 'Updated Event' };

      const mockEvent = { id: 'event1', title: 'Updated Event' };
      eventService.updateEvent = jest.fn().mockResolvedValue(mockEvent);

      await eventController.updateEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Event updated successfully',
        data: mockEvent
      });
    });
  });

  describe('deleteEvent', () => {
    it('should delete event successfully', async () => {
      req.params.id = 'event1';
      eventService.deleteEvent = jest.fn().mockResolvedValue({});

      await eventController.deleteEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Event deleted successfully'
      });
    });
  });

  describe('registerForEvent', () => {
    it('should register user for event', async () => {
      req.params.id = 'event1';
      req.user.id = 'user1';

      const mockRegistration = { id: 'reg1', eventId: 'event1', userId: 'user1' };
      eventService.registerForEvent = jest.fn().mockResolvedValue(mockRegistration);

      await eventController.registerForEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Successfully registered for event',
        data: mockRegistration
      });
    });
  });

  describe('cancelRegistration', () => {
    it('should cancel event registration', async () => {
      req.params.id = 'event1';
      req.user.id = 'user1';

      eventService.cancelRegistration = jest.fn().mockResolvedValue({});

      await eventController.cancelRegistration(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Registration cancelled successfully'
      });
    });
  });
});

