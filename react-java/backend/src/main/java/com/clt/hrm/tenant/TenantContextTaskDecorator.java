package com.clt.hrm.tenant;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.task.TaskDecorator;

import java.util.Map;

/**
 * Task decorator that propagates tenant context from the calling thread
 * to the async execution thread.
 * 
 * This ensures that ThreadLocal tenant context is available in async operations
 * such as @Async methods and CompletableFuture.supplyAsync() calls.
 */
@Slf4j
public class TenantContextTaskDecorator implements TaskDecorator {

    @Override
    public Runnable decorate(Runnable runnable) {
        String tenantId = TenantContext.getTenant();
        Map<String, String> mdcContext = MDC.getCopyOfContextMap();

        return () -> {
            try {
                if (tenantId != null && !tenantId.trim().isEmpty()) {
                    TenantContext.setTenant(tenantId);
                    log.debug("Tenant context propagated to async thread: {}", tenantId);
                }
                if (mdcContext != null) {
                    MDC.setContextMap(mdcContext);
                }
                runnable.run();
            } finally {
                TenantContext.clear();
                MDC.clear();
            }
        };
    }
}
