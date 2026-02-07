/**
 * Metadata attached to event messages (e.g. RabbitMQ) for retry and tracing.
 * Used by user-service and provider-service consumers.
 */
export interface MessageMetadata {
  retryCount: number;
  originalTimestamp: number;
}
