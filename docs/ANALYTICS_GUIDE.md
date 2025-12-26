# Analytics & Reporting Guide

## Overview
The Admin Analytics Dashboard provides high-level insights into campus operations.

## Key Metrics
1. **Academic Performance:** Average GPA by Department. Correlated with Attendance rate.
2. **Meal Usage:** Daily reservation counts vs. Actual consumption.
3. **Event Popularity:** Registration numbers per event category.
4. **IoT Data:** Peak occupancy hours and energy consumption trends.

## Data Sources
- **SQL Aggregations:** Complex `GROUP BY` queries on `AttendanceRecords` and `Enrollments`.
- **Real-time:** Sensor data from `SensorData` table.
