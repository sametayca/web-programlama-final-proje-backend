# GPS Implementation Guide

## Overview
The system uses GPS coordinates to verify student physical presence during attendance check-ins.

## Algorithm: Haversine Formula
We use the Haversine formula to calculate the great-circle distance between two points on a sphere (Earth).

### Formula
```javascript
const R = 6371e3; // Earth radius in meters
const φ1 = lat1 * Math.PI/180;
const φ2 = lat2 * Math.PI/180;
const Δφ = (lat2-lat1) * Math.PI/180;
const Δλ = (lon2-lon1) * Math.PI/180;

const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
const d = R * c; // Distance in meters
```

## Implementation Details
1. **Faculty Session:** Instructor sends current location (`lat`, `long`) and `radius` (e.g., 50m) to create a session.
2. **Student Check-in:** Student app sends current location.
3. **Verification:** Backend calculates distance `d`. If `d <= radius`, attendance is accepted.

## Accuracy Considerations
- Clients typically provide accuracy estimates.
- We implement a buffer of +/- 10m to account for GPS drift.
