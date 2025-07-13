# Notification System Documentation

## Database Schema

The notification system uses a single-record table `notification_status` to track the latest notification state and details.

### Table Structure: notification_status

This table maintains a single record (enforced by `CHECK (id = 1)`) with the following information:

#### Article and Translation Information
- `last_notified_article_id`: Reference to the last article that was notified
- `notified_translation_ids`: Array of news_article_translation IDs that were sent

#### Notification Content
- `notification_title`: Title of the notification
- `notification_body`: Body content of the notification

#### Recipients Information
- `notified_user_preference_ids`: Array of user_preferences IDs that received the notification
- `total_recipients_count`: Total number of recipients targeted
- `successful_recipients_count`: Number of successful notifications
- `failed_recipients_count`: Number of failed notifications

#### Expo API Response
- `expo_success_tickets`: Array of successful Expo ticket IDs
- `expo_failed_tickets`: JSONB object containing detailed error information for failed tickets

#### Status and Timing
- `notification_status`: Current status ('pending', 'in_progress', 'completed', 'failed')
- `error_message`: Any error message if notification failed
- `last_notification_start_time`: When the last notification process started
- `last_notification_end_time`: When the last notification process completed
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

## Common Queries

### 1. Get Latest Notification Status
```sql
SELECT 
    last_notified_article_id,
    notification_status,
    total_recipients_count,
    successful_recipients_count,
    failed_recipients_count,
    last_notification_start_time,
    last_notification_end_time
FROM notification_status 
WHERE id = 1;
```

### 2. Get Users Who Received Last Notification
```sql
SELECT up.* 
FROM user_preferences up 
WHERE up.id = ANY(
    (SELECT notified_user_preference_ids 
     FROM notification_status 
     WHERE id = 1)
);
```

### 3. Get Translations That Were Sent
```sql
SELECT nat.* 
FROM news_article_translation nat 
WHERE nat.id = ANY(
    (SELECT notified_translation_ids 
     FROM notification_status 
     WHERE id = 1)
);
```

### 4. Get Failed Notification Details
```sql
SELECT 
    notification_status,
    error_message,
    expo_failed_tickets
FROM notification_status 
WHERE id = 1 
  AND notification_status = 'failed';
```

### 5. Get Success Rate
```sql
SELECT 
    ROUND(
        (successful_recipients_count::float / 
         NULLIF(total_recipients_count, 0) * 100)::numeric, 
        2
    ) as success_rate_percentage
FROM notification_status 
WHERE id = 1;
```

## Monitoring and Maintenance

### Indexes
The table has two indexes for efficient querying:
- `idx_notification_status_article`: On last_notified_article_id
- `idx_notification_status_updated`: On updated_at

### Status Values
The `notification_status` field can have these values:
- `pending`: Notification is queued
- `in_progress`: Currently sending notifications
- `completed`: Successfully completed
- `failed`: Failed to send notifications

## Best Practices

1. **Always Check Status Before Sending**
   ```sql
   SELECT notification_status 
   FROM notification_status 
   WHERE id = 1;
   ```
   Ensure it's not 'in_progress' before starting a new notification.

2. **Update Status Atomically**
   ```sql
   UPDATE notification_status 
   SET notification_status = 'in_progress',
       last_notification_start_time = CURRENT_TIMESTAMP 
   WHERE id = 1 
     AND notification_status != 'in_progress';
   ```

3. **Track Failed Recipients**
   Always update both successful and failed counts to maintain accurate metrics.

4. **Regular Monitoring**
   Monitor the success rate and failed_recipients_count to ensure the notification system is working effectively.

## Troubleshooting

### Common Issues

1. **High Failure Rate**
   - Check `expo_failed_tickets` for specific error messages
   - Verify user push tokens are valid
   - Check network connectivity

2. **Stuck in 'in_progress' State**
   ```sql
   UPDATE notification_status 
   SET notification_status = 'failed',
       error_message = 'Reset due to stuck state',
       updated_at = CURRENT_TIMESTAMP 
   WHERE id = 1 
     AND notification_status = 'in_progress' 
     AND last_notification_start_time < (CURRENT_TIMESTAMP - INTERVAL '1 hour');
   ```

3. **Missing Recipients**
   - Verify user preferences are correctly set
   - Check if users have valid push tokens
   - Ensure notification filters are correct

### Recovery Steps

1. **Reset Failed State**
   ```sql
   UPDATE notification_status 
   SET notification_status = 'pending',
       error_message = NULL,
       updated_at = CURRENT_TIMESTAMP 
   WHERE id = 1;
   ```

2. **Clear Notification History**
   ```sql
   UPDATE notification_status 
   SET notified_translation_ids = '{}',
       notified_user_preference_ids = '{}',
       total_recipients_count = 0,
       successful_recipients_count = 0,
       failed_recipients_count = 0,
       expo_success_tickets = '{}',
       expo_failed_tickets = NULL,
       updated_at = CURRENT_TIMESTAMP 
   WHERE id = 1;
   ```

## Performance Considerations

1. The table is designed for single-record operations, so performance should be consistent
2. Array operations might be slower with large numbers of recipients
3. Consider archiving old notification data periodically if needed
4. JSONB fields allow for flexible error tracking without schema changes 