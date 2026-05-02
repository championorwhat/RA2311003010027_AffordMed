# Notification System Design

## Stage 1 — Notification System API Design

### Base URL

```text
/api/v1/notifications
```

### 1) Get Notifications

```http
GET /api/v1/notifications
```

#### Query Parameters

* `userId` (required)
* `limit` (optional)
* `offset` (optional)
* `unreadOnly` (optional, boolean)

#### Response

```json
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
```

### 2) Mark Notification as Read

```http
PATCH /api/v1/notifications/:id/read
```

### 3) Create Notification

```http
POST /api/v1/notifications
```

### 4) Bulk Notifications

```http
POST /api/v1/notifications/bulk
```

### 5) Real-Time Notifications

```http
GET /api/v1/notifications/stream
```

**Implementation choice:** WebSockets or Server-Sent Events (SSE) for push-based delivery without polling.

### Required Headers

```http
Authorization: Bearer <token>
Content-Type: application/json
X-Request-ID: <unique-id>
```

### Logging Requirement

All endpoints must be instrumented with custom logging middleware integrated from the first function written in the project. The middleware should capture:

* request ID
* HTTP method
* route
* response status code
* response latency

---

## Stage 2 — Database Design & Scaling

### Recommended Database

**PostgreSQL**

### Why PostgreSQL

* Structured notification data fits a relational model well
* Strong indexing and query optimization support
* ACID compliance for correctness
* Efficient filtering on `user_id`, `is_read`, and `created_at`

### Schema

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Index Strategy

```sql
CREATE INDEX idx_notifications_user_read_time
ON notifications(user_id, is_read, created_at DESC);
```

### Scaling Concerns

* High read volume for unread notifications
* Frequent writes during bulk notifications
* Growth in historical notification records

### Scaling Solutions

* Composite indexes for common query paths
* Partitioning by date or user segment
* Redis caching for frequently accessed unread notifications
* Pagination for large result sets

---

## Stage 3 — Query Optimization

### Problem Query

```sql
SELECT *
FROM notifications
WHERE user_id = 1042 AND is_read = false
ORDER BY created_at DESC;
```

### Issues with the Query

* Can trigger a full table scan without proper indexing
* Sorting large result sets is expensive
* Returns more rows than needed for the UI

### Optimized Query

```sql
SELECT *
FROM notifications
WHERE user_id = 1042 AND is_read = false
ORDER BY created_at DESC
LIMIT 20;
```

### Why This Is Better

* Uses the composite index efficiently
* Limits the number of returned rows
* Reduces sorting and transfer overhead

### Why Not Index Every Column

Indexing every column is not ideal because it:

* increases write cost
* consumes additional storage
* slows down inserts and updates
* creates maintenance overhead

### Better Query for Placement Notifications in the Last 7 Days

```sql
SELECT DISTINCT user_id
FROM notifications
WHERE type = 'Placement'
  AND created_at >= NOW() - INTERVAL '7 days';
```

---

## Stage 4 — Performance Optimization

### Problem

Notifications are fetched on every page load, which increases database load and hurts responsiveness.

### Recommended Improvements

#### 1) Caching with Redis

Cache unread notifications per user to reduce repeated database queries.

#### 2) Pagination / Lazy Loading

Fetch only a small subset initially, then load more as needed.

#### 3) Push-Based Delivery

Use WebSockets or SSE instead of constant polling.

#### 4) Read Replicas

Separate read and write traffic to improve scalability.

### Tradeoffs

| Solution      | Benefit                 | Tradeoff                       |
| ------------- | ----------------------- | ------------------------------ |
| Cache         | Faster reads            | Possible stale data            |
| Pagination    | Lower load              | More client requests           |
| WebSockets    | Real-time updates       | More implementation complexity |
| Read Replicas | Better read scalability | Replication lag                |

### Architectural Note

This shifts the system from a pull-based model to a push-based model, significantly reducing unnecessary database reads.

---

## Stage 5 — Reliable Notification System

### Problems in the Naive Approach

* Sequential processing is slow for large student groups
* No retry strategy for transient failures
* Partial failures can cause inconsistent system state
* No fault isolation or backpressure handling

### Improved Design

Use an asynchronous queue-based architecture such as Kafka or RabbitMQ.

### Flow

1. Push notification jobs to a queue
2. Workers consume jobs asynchronously
3. Worker actions:

   * send email
   * save notification to database
   * push in-app notification
4. Retry failed jobs with exponential backoff

### Example Pseudocode

```python
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
```

### Should DB Save and Email Happen Together?

No. They should not be tightly coupled in a single synchronous transaction.

* Email delivery can fail independently
* Database persistence should remain the source of truth
* The system should use eventual consistency with retries and background processing

### Reliability Goals

This design improves:

* availability
* fault tolerance
* scalability under load

---

## Stage 6 — Priority Inbox

### Problem Statement

The inbox must always show the top `n` most important unread notifications first, where priority depends on both type and recency.

### Priority Rules

1. **Type Weight**

   * Placement = highest priority
   * Result = medium priority
   * Event = lowest priority

2. **Recency**

   * More recent notifications are ranked higher within the same type

### Scoring Approach

A combined score is computed from the notification type weight and timestamp.

```text
score = (type weight × large constant) + timestamp
```

### Efficient Top-N Maintenance

A **Min Heap** of size `10` is used to keep only the top 10 notifications.

#### Algorithm

* Fetch notifications from the protected API
* Compute a score for each notification
* Insert into the heap until size reaches 10
* For each new notification after that:

  * compare its score with the heap root
  * replace the root if the new score is higher
* Return the heap contents sorted in descending priority order

### Complexity

* Time Complexity: `O(n log k)` where `k = 10`
* Space Complexity: `O(k)`

### Continuous Updates

To handle new notifications efficiently:

* keep the current top 10 in memory
* update the heap incrementally on each incoming notification
* avoid sorting the full dataset repeatedly

### Why This Approach Is Efficient

This avoids full sorting and scales well when the number of notifications grows large.

---

## Submission Notes

* Include the working code in the repository
* Include screenshots of the output
* Keep the logging middleware active from the start of the request lifecycle
* Do not hard-code secrets in source files
