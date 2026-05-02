# Notification System Design


## Stage 1 — Notification System API Design
Base URL
/api/v1/notifications
1. Get Notifications
GET /api/v1/notifications

Query Params

userId (required)
limit (optional)
offset (optional)
unreadOnly (boolean)

Response

{
  "notifications": [
    {
      "id": "uuid",
      "type": "Placement",
      "message": "Company hiring",
      "timestamp": "2026-04-22T17:51:18Z",
      "isRead": false
    }
  ]
}
2. Mark Notification as Read
PATCH /api/v1/notifications/:id/read
3. Create Notification
POST /api/v1/notifications
4. Bulk Notifications
POST /api/v1/notifications/bulk
5. Real-Time Notifications
GET /api/v1/notifications/stream

Implementation: WebSockets (or SSE) to push updates without polling.

Headers
Authorization: Bearer <token>
Content-Type: application/json
X-Request-ID: <unique-id>
Logging
All endpoints use custom logging middleware capturing:
All APIs are instrumented using custom logging middleware integrated from the first function as required in the pre-test.

request ID
route
latency
status code
## Stage 2 — Database Design & Scaling
Choice: PostgreSQL

Reason

Structured data (notifications)
Strong indexing support
ACID compliance
Efficient filtering (userId, isRead)
Schema
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id VARCHAR(50),
  type VARCHAR(20),
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP
);
Indexes
CREATE INDEX idx_user_read_time 
ON notifications(user_id, is_read, created_at DESC);
Scaling Issues
Large volume of notifications
Frequent reads (unread notifications)
Write-heavy during bulk notify
Solutions
Indexing (above)
Partitioning by user_id or date
Caching (Redis)
Pagination
Given Query
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt DESC;
Problems
Full table scan without index
Sorting large dataset
High latency at scale
Optimized Query
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt DESC
LIMIT 20;
Why Faster
Uses composite index
Limits result set
Avoids unnecessary sorting
Index Strategy
CREATE INDEX idx_notifications 
ON notifications(studentID, isRead, createdAt DESC);
Why NOT Index Every Column
High write cost
Increased storage
Poor insert/update performance
New Query (Placement last 7 days)
SELECT DISTINCT studentID
FROM notifications
WHERE notificationType = 'Placement'
AND createdAt >= NOW() - INTERVAL '7 days';
## Stage 4 — Performance Optimization
Problem

Notifications fetched on every page load → DB overload

Solutions
1. Caching (Redis)
Cache unread notifications per user
Reduce DB hits
2. Pagination / Lazy Loading
Load only first 20
Fetch more on scroll
3. Push-Based System
Use WebSockets instead of polling
4. Read Replicas
Separate read and write DB
Tradeoffs
Solution	Pros	Cons
Cache	Fast reads	Stale data risk
Pagination	Reduced load	More API calls
WebSockets	Real-time	Complexity
Replicas	Scalable	Sync overhead
## Stage 5 — Reliable Notification System
Problems in Given Code
Sequential execution (slow)
No retry mechanism
Failure causes data inconsistency
No fault tolerance
Improved Design

Use:

Queue (Kafka / RabbitMQ)
Async processing
Retry mechanism
Updated Flow
Push jobs to queue
Worker processes:
send email
save to DB
push notification
Pseudocode
function notify_all(student_ids, message):
    for student_id in student_ids:
        queue.push({student_id, message})

worker():
    while job:
        try:
            send_email(job.student_id)
            save_to_db(job.student_id)
            push_notification(job.student_id)
        except:
            retry(job)
Should DB + Email be together?

❌ No

Email can fail
DB should always succeed

Use eventual consistency

## Stage 6 — Priority Inbox
Approach

Priority based on:

Type weight
Placement = 3
Result = 2
Event = 1
Recency
Score Formula
score = weight × constant + timestamp
Efficient Solution

Used Min Heap (size = 10)

Algorithm
Iterate notifications
Maintain heap of top 10
Replace smallest if higher score found
Complexity
Time: O(n log k)
Space: O(k)
Handling Continuous Updates
Keep heap in memory
Insert new notifications dynamically
Replace lowest priority if needed