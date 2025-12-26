# Project Retrospective

## What Went Well
- **Modular Architecture:** Separation of concerns made adding IoT easy.
- **WebSocket Integration:** Real-time feedback significantly improved UX.
- **Dark Mode:** Implemented seamlessly with Context API.

## Challenges
- **CORS Issues:** Rate limiting middleware order caused initial CORS blockers. Solved by reordering.
- **GPS Simulation:** Testing geofencing on localhost required manual coord injection.
- **Data Seeding:** Complex dependencies (Enrollments depend on Users and Sections) required identifying correct order.

## Future Improvements
- **Payment Gateway:** Integrate real payment provider.
- **Mobile App:** React Native port for better GPS handling.
- **AI Analytics:** Predictive models for student dropout risk.
