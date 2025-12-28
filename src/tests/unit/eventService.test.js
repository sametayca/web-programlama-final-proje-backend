const eventService = require('../../services/eventService');
const { Event, EventRegistration, User } = require('../../models');
const notificationService = require('../../services/notificationService');

jest.mock('../../models');
jest.mock('../../services/notificationService');

describe('EventService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEvents', () => {
    it('should get events with default filters', async () => {
      const mockEvents = [
        { id: '1', title: 'Event 1', isActive: true },
        { id: '2', title: 'Event 2', isActive: true }
      ];

      Event.findAndCountAll = jest.fn().mockResolvedValue({
        count: 2,
        rows: mockEvents
      });

      const result = await eventService.getEvents();

      expect(result.events).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(Event.findAndCountAll).toHaveBeenCalled();
    });

    it('should filter events by eventType', async () => {
      Event.findAndCountAll = jest.fn().mockResolvedValue({
        count: 1,
        rows: [{ id: '1', eventType: 'workshop' }]
      });

      await eventService.getEvents({ eventType: 'workshop' });

      expect(Event.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ eventType: 'workshop' })
        })
      );
    });

    it('should filter events by date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      Event.findAndCountAll = jest.fn().mockResolvedValue({
        count: 0,
        rows: []
      });

      await eventService.getEvents({ startDate, endDate });

      expect(Event.findAndCountAll).toHaveBeenCalled();
    });

    it('should paginate results', async () => {
      Event.findAndCountAll = jest.fn().mockResolvedValue({
        count: 50,
        rows: []
      });

      const result = await eventService.getEvents({ page: 2, limit: 10 });

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.pages).toBe(5);
    });
  });

  describe('getEventById', () => {
    it('should get event by id', async () => {
      const mockEvent = { id: '1', title: 'Test Event' };

      Event.findByPk = jest.fn().mockResolvedValue(mockEvent);

      const result = await eventService.getEventById('1');

      expect(result).toEqual(mockEvent);
      expect(Event.findByPk).toHaveBeenCalledWith('1', expect.any(Object));
    });

    it('should throw error if event not found', async () => {
      Event.findByPk = jest.fn().mockResolvedValue(null);

      await expect(eventService.getEventById('invalid')).rejects.toThrow('Event not found');
    });
  });

  describe('createEvent', () => {
    it('should create a new event', async () => {
      const eventData = {
        title: 'New Event',
        description: 'Description',
        eventType: 'workshop',
        startDate: '2024-12-25',
        endDate: '2024-12-25',
        location: 'Campus',
        maxCapacity: 50
      };

      const mockEvent = { id: '1', ...eventData };
      Event.create = jest.fn().mockResolvedValue(mockEvent);
      Event.findByPk = jest.fn().mockResolvedValue(mockEvent);

      const result = await eventService.createEvent(eventData, 'user1');

      expect(result).toBeDefined();
      expect(Event.create).toHaveBeenCalled();
    });

    it('should set organizerId from userId', async () => {
      const eventData = {
        title: 'New Event',
        eventType: 'workshop',
        startDate: '2024-12-25',
        endDate: '2024-12-25'
      };

      const mockEvent = { id: '1', organizerId: 'user1', ...eventData };
      Event.create = jest.fn().mockResolvedValue(mockEvent);
      Event.findByPk = jest.fn().mockResolvedValue(mockEvent);

      await eventService.createEvent(eventData, 'user1');

      expect(Event.create).toHaveBeenCalledWith(
        expect.objectContaining({ organizerId: 'user1' }),
        expect.any(Object)
      );
    });
  });

  describe('updateEvent', () => {
    it('should update an existing event', async () => {
      const mockEvent = {
        id: '1',
        title: 'Old Title',
        update: jest.fn().mockResolvedValue(true)
      };

      Event.findByPk = jest.fn().mockResolvedValue(mockEvent);

      const updateData = { title: 'New Title' };
      await eventService.updateEvent('1', updateData, 'user1');

      expect(mockEvent.update).toHaveBeenCalledWith(updateData);
    });

    it('should throw error if event not found', async () => {
      Event.findByPk = jest.fn().mockResolvedValue(null);

      await expect(eventService.updateEvent('invalid', {}, 'user1')).rejects.toThrow('Event not found');
    });
  });

  describe('deleteEvent', () => {
    it('should soft delete an event', async () => {
      const mockEvent = {
        id: '1',
        isActive: true,
        update: jest.fn().mockResolvedValue(true)
      };

      Event.findByPk = jest.fn().mockResolvedValue(mockEvent);

      await eventService.deleteEvent('1', 'user1');

      expect(mockEvent.update).toHaveBeenCalledWith({ isActive: false });
    });
  });

  describe('registerForEvent', () => {
    it('should register user for event', async () => {
      const mockEvent = {
        id: '1',
        maxCapacity: 50,
        isActive: true,
        startDate: new Date(Date.now() + 86400000)
      };

      const mockRegistration = { id: 'reg1', eventId: '1', userId: 'user1' };

      Event.findByPk = jest.fn().mockResolvedValue(mockEvent);
      EventRegistration.findOne = jest.fn().mockResolvedValue(null);
      EventRegistration.count = jest.fn().mockResolvedValue(10);
      EventRegistration.create = jest.fn().mockResolvedValue(mockRegistration);
      notificationService.createNotification = jest.fn().mockResolvedValue({});

      const result = await eventService.registerForEvent('1', 'user1');

      expect(result).toBeDefined();
      expect(EventRegistration.create).toHaveBeenCalled();
    });

    it('should throw error if event is full', async () => {
      const mockEvent = {
        id: '1',
        maxCapacity: 10,
        isActive: true
      };

      Event.findByPk = jest.fn().mockResolvedValue(mockEvent);
      EventRegistration.count = jest.fn().mockResolvedValue(10);

      await expect(eventService.registerForEvent('1', 'user1')).rejects.toThrow(/full|capacity/i);
    });

    it('should throw error if already registered', async () => {
      const mockEvent = { id: '1', isActive: true };
      const mockRegistration = { id: 'reg1' };

      Event.findByPk = jest.fn().mockResolvedValue(mockEvent);
      EventRegistration.findOne = jest.fn().mockResolvedValue(mockRegistration);

      await expect(eventService.registerForEvent('1', 'user1')).rejects.toThrow(/already registered/i);
    });
  });

  describe('cancelRegistration', () => {
    it('should cancel event registration', async () => {
      const mockRegistration = {
        id: 'reg1',
        userId: 'user1',
        destroy: jest.fn().mockResolvedValue(true)
      };

      EventRegistration.findOne = jest.fn().mockResolvedValue(mockRegistration);

      await eventService.cancelRegistration('1', 'user1');

      expect(mockRegistration.destroy).toHaveBeenCalled();
    });

    it('should throw error if registration not found', async () => {
      EventRegistration.findOne = jest.fn().mockResolvedValue(null);

      await expect(eventService.cancelRegistration('1', 'user1')).rejects.toThrow(/not found/i);
    });
  });
});

