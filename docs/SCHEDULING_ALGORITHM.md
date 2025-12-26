# Scheduling Algorithm & Conflict Detection

## Objective
To prevent scheduling conflicts for students between Courses, Exams, and Events.

## Algorithm Logic

### 1. Time Interval Definition
Each activity is defined as `[startTime, endTime]`.

### 2. Overlap Check
Two intervals `A` and `B` overlap if:
```javascript
(A.start < B.end) && (B.start < A.end)
```

### 3. Implementation (Event Registration)
When a student registers for an event:
1. Fetch all existing enrollments (Course Sections) for the student.
2. Fetch already registered events.
3. Check for overlap between New Event and (Courses + Events).
4. If overlap detected -> **Reject Registration**.

## Complexity
- O(N) where N is the number of student's active commitments. efficient enough for typical loads.
