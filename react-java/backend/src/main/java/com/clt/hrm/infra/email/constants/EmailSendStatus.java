package com.clt.hrm.infra.email.constants;

/**
 * Email sending status. Used for EML_SND_STS_CD in COM_EML_SND.
 */
public enum EmailSendStatus {
    /** Inserted into the outbox, waiting to be dispatched by the async listener. */
    QUEUED,
    /** Being actively dispatched by the async listener (used as a lock / in-flight marker). */
    PROCESSING,
    /** Legacy retry-in-progress status kept for backward compatibility. */
    PENDING,
    SUCCESS,
    ERROR
}
